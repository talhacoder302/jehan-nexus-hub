import { NextResponse, type NextRequest } from "next/server";
import { isStaff } from "@/lib/permissions";
import { getSessionUser } from "@/server/permissions";

/** Post-login landing: sends staff to the admin area and client users to their portal. */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const target = !user ? "/login" : isStaff(user.role) ? "/admin" : "/portal";
  return NextResponse.redirect(new URL(target, request.nextUrl));
}
