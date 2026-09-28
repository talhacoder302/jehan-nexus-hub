import type { Metadata } from "next";
import { PageTitle } from "@/components/app-shell/page-header";
import { ChangePasswordForm, ProfileForm } from "@/components/portal/settings-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/permissions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <>
      <PageTitle title="Settings" description="Manage your profile and password." />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm name={user.name} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change the password you use to sign in.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
