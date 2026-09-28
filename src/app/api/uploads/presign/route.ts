import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { features } from "@/lib/env";
import { objectId } from "@/lib/validators/auth";
import { apiError, noStore } from "@/server/api";
import { assertClientAccess, assertStaff } from "@/server/permissions";
import {
  MAX_UPLOAD_BYTES,
  presignCreativeUpload,
  UPLOAD_TYPES,
  type UploadType,
} from "@/server/s3";

const bodySchema = z.object({
  clientId: objectId,
  contentType: z.enum(Object.keys(UPLOAD_TYPES) as [UploadType, ...UploadType[]]),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

/** Staff-only: returns a short-lived pre-signed PUT URL for a post creative. */
export async function POST(request: NextRequest) {
  try {
    const user = await assertStaff();
    if (!features().s3) {
      return NextResponse.json(
        { error: "File uploads aren't configured. Paste a media URL instead." },
        { status: 503 },
      );
    }
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Unsupported file. Use JPG, PNG, WebP, GIF, MP4, MOV or WebM up to 250 MB." },
        { status: 400 },
      );
    }
    await assertClientAccess(user, parsed.data.clientId);
    return NextResponse.json(await presignCreativeUpload(parsed.data), { headers: noStore });
  } catch (error) {
    return apiError(error);
  }
}
