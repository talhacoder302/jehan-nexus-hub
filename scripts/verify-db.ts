/**
 * Lists collections, document counts and indexes. Stands in for the Atlas MCP verification step.
 * Run with `pnpm db:verify` or `pnpm db:verify --target=production`.
 */
import { scriptMongoUri } from "./_env";
import mongoose from "mongoose";
import { connectDB, DB_NAME } from "@/lib/db";

const EXPECTED = [
  "users",
  "clients",
  "posts",
  "comments",
  "adinsightdailies",
  "reports",
  "notifications",
  "leads",
  "activitylogs",
  "verificationtokens",
];

async function main() {
  const conn = await connectDB(scriptMongoUri());
  const db = conn.connection.db;
  if (!db) throw new Error("No database handle");

  const names = (await db.listCollections().toArray()).map((c) => c.name).sort();
  console.log(`Database: ${DB_NAME}`);
  for (const name of names) {
    const col = db.collection(name);
    const [count, indexes] = await Promise.all([col.countDocuments(), col.indexes()]);
    const idx = indexes
      .map((i) => {
        const flags = [i.unique && "unique", i.expireAfterSeconds !== undefined && "ttl"].filter(
          Boolean,
        );
        return `${JSON.stringify(i.key)}${flags.length ? ` (${flags.join(", ")})` : ""}`;
      })
      .join(", ");
    console.log(`  ${name.padEnd(20)} ${String(count).padStart(5)} docs  ${idx}`);
  }

  const missing = EXPECTED.filter((n) => !names.includes(n));
  if (missing.length) {
    console.log(`Missing collections (created on first write): ${missing.join(", ")}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
