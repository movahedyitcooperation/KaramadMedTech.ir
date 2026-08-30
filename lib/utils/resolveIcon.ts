import { Package } from "@phosphor-icons/react/dist/ssr";
import * as PhosphorIcons from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react/lib";

/** Resolves a Category.icon string (e.g. "Stethoscope") to its Phosphor icon
 * component, falling back to a generic Package icon for an unknown/missing
 * name. Shared by the public CategoryIconCards and the admin CategoryForm's
 * live icon preview, so both agree on exactly what counts as "valid". */
export function resolveIcon(name: string): Icon {
  const icons = PhosphorIcons as unknown as Record<string, Icon>;
  return icons[name] ?? Package;
}
