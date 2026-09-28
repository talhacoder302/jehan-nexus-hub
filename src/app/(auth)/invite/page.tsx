import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AcceptInviteForm } from "@/components/auth/password-forms";
import { Button } from "@/components/ui/button";
import { getInviteDetails } from "@/server/users";

export const metadata: Metadata = { title: "Accept invitation" };

export default async function InvitePage(props: PageProps<"/invite">) {
  const { token } = await props.searchParams;
  const value = typeof token === "string" ? token : "";
  const invite = value.length >= 20 ? await getInviteDetails(value) : null;

  if (!invite) {
    return (
      <AuthCard
        title="Invitation not valid"
        description="This invitation link is invalid, has already been used, or has expired. Ask your account manager to send a new one."
      >
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set up your account"
      description={
        <>
          You&apos;re activating the portal account for{" "}
          <span className="font-medium text-foreground">{invite.email}</span>.
        </>
      }
    >
      <AcceptInviteForm token={value} name={invite.name} />
    </AuthCard>
  );
}
