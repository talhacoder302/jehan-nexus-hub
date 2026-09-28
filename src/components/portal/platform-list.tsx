import { FacebookIcon, InstagramIcon } from "@/components/marketing/social-icons";
import type { Platform } from "@/lib/constants";

const META: Record<Platform, { label: string; Icon: typeof FacebookIcon }> = {
  facebook: { label: "Facebook", Icon: FacebookIcon },
  instagram: { label: "Instagram", Icon: InstagramIcon },
};

export function PlatformList({
  platforms,
  showLabels = false,
}: {
  platforms: Platform[];
  showLabels?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      {platforms.map((p) => {
        const { label, Icon } = META[p];
        return (
          <span key={p} className="inline-flex items-center gap-1 text-xs" title={label}>
            <Icon className="size-3.5" />
            {showLabels ? label : <span className="sr-only">{label}</span>}
          </span>
        );
      })}
    </span>
  );
}
