import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { Button } from "@/components/ui/button";
import { isResetTokenValid } from "@/server/users";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const { token } = await props.searchParams;
  const value = typeof token === "string" ? token : "";
  const valid = value.length >= 20 && (await isResetTokenValid(value));

  if (!valid) {
    return (
      <AuthCard
        title="Link expired"
        description="This password reset link is invalid or has expired. Reset links are valid for one hour."
      >
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      <ResetPasswordForm token={value} />
    </AuthCard>
  );
}
