import { cn } from "@/lib/utils/cn";
import type { Icon, IconProps } from "@phosphor-icons/react/lib";

interface DirIconProps extends IconProps {
  icon: Icon;
  /**
   * Whether to mirror the icon under dir="rtl". Pass the icon's canonical
   * LTR-oriented meaning (e.g. CaretRight = "forward") and leave this on —
   * the flip makes it point the visually-correct direction for RTL reading.
   * Turn off only for icons with no directional meaning (e.g. a search glass).
   */
  flip?: boolean;
}

export function DirIcon({ icon: IconComponent, flip = true, className, ...props }: DirIconProps) {
  return (
    <IconComponent
      aria-hidden="true"
      className={cn(flip && "rtl:-scale-x-100", className)}
      {...props}
    />
  );
}
