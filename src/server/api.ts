import "server-only";
import { NextResponse } from "next/server";
import { AuthorizationError } from "./permissions";

/** Consistent JSON errors for route handlers. Never leaks internal error details. */
export function apiError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("[api]", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export const noStore = { "Cache-Control": "no-store" } as const;
