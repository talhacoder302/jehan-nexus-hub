import { Megaphone, MonitorSmartphone, Target } from "lucide-react";
import type { ServiceIcon as ServiceIconName } from "@/content/services";
import { cn } from "@/lib/utils";

const icons = { web: MonitorSmartphone, social: Megaphone, ads: Target } as const;

export function ServiceIcon({ name, className }: { name: ServiceIconName; className?: string }) {
  const Icon = icons[name];
  return (
    <div
      className={cn(
        "grid size-11 place-items-center rounded-xl bg-brand-gradient text-white shadow-md shadow-primary/20",
        className,
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}
