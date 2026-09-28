import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="shadow-xl shadow-primary/5">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? (
        <div className="px-6 text-center text-sm text-muted-foreground">{footer}</div>
      ) : null}
    </Card>
  );
}
