import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

/**
 * Picks the database for CLI scripts. `--target=production` uses MONGODB_URI_PRODUCTION so the
 * Atlas cluster can be seeded from a laptop without swapping the local URI.
 */
export function scriptMongoUri(): string {
  const production = process.argv.includes("--target=production");
  const uri = production ? process.env.MONGODB_URI_PRODUCTION : process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      production ? "MONGODB_URI_PRODUCTION is not set in .env.local" : "MONGODB_URI is not set",
    );
  }
  return uri;
}

export function requireVar(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set in .env.local`);
  return value;
}
