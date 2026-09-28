import "server-only";
import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { features, serverEnv } from "@/lib/env";

export const UPLOAD_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
} as const;
export type UploadType = keyof typeof UPLOAD_TYPES;

export const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;

let client: S3Client | undefined;

function s3() {
  const env = serverEnv();
  if (!features().s3 || !env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("S3 is not configured");
  }
  client ??= new S3Client({
    region: env.AWS_REGION,
    credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY },
  });
  return { client, bucket: env.AWS_S3_BUCKET!, region: env.AWS_REGION };
}

export function publicObjectUrl(key: string) {
  const { bucket, region } = s3();
  return `https://${bucket}.s3.${region}.amazonaws.com/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Pre-signed PUT for a post creative. The content type and length are part of the signature, so
 * the browser must upload exactly what was declared. Objects under `clients/<id>/posts/` are
 * expected to be publicly readable (see README bucket policy) so the portal can display them.
 */
export async function presignCreativeUpload(opts: {
  clientId: string;
  contentType: UploadType;
  size: number;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const { client, bucket } = s3();
  const key = `clients/${opts.clientId}/posts/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${UPLOAD_TYPES[opts.contentType]}`;
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: opts.contentType,
      ContentLength: opts.size,
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn: 300 },
  );
  return { uploadUrl, publicUrl: publicObjectUrl(key), key };
}

/** Uploads a server-generated file (e.g. report PDFs). Returns the object key. */
export async function putPrivateObject(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<string> {
  const { client, bucket } = s3();
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
  return key;
}

/** Short-lived download link for a private object. */
export async function signedDownloadUrl(
  key: string,
  fileName: string,
  expiresIn = 300,
): Promise<string> {
  const { client, bucket } = s3();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName.replace(/"/g, "")}"`,
    }),
    { expiresIn },
  );
}
