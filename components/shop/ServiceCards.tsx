import Link from "next/link";
import { RuleBox } from "@/components/ui/RuleBox";
import { fa } from "@/lib/i18n/fa";
import { telHref } from "@/lib/utils/links";
import type { ContactSetting } from "@/lib/types/settings";

/**
 * The four service cells. A RuleBox, not four cards: they read as one set
 * of promises the shop makes, so they share a single box divided by
 * hairlines rather than each floating separately.
 *
 * The differing corner radius on each cell's small square is the only thing
 * distinguishing them visually — deliberately not four different icons, and
 * deliberately not four different colors.
 */
export function ServiceCards({
  contact,
  clinicCategorySlug,
}: {
  contact: ContactSetting;
  clinicCategorySlug: string | null;
}) {
  const hrefs = [
    clinicCategorySlug ? `/category/${clinicCategorySlug}` : "#finder",
    telHref(contact.phone),
    telHref(contact.phone),
    "#site-footer",
  ];

  return (
    <section
      aria-label={fa.home.servicesAria}
      className="mx-auto max-w-[1280px] px-5 pt-18 lg:px-8"
    >
      <RuleBox
        className="sm:grid-cols-2 lg:grid-cols-4"
        itemClassName="flex min-h-48 flex-col gap-3.5 p-7"
        items={fa.services.map((service, i) => (
          <>
            <span
              aria-hidden="true"
              className="block size-6.5 border-2 border-emerald-live"
              style={{ borderRadius: service.radius }}
            />
            <strong className="text-[17px] leading-relaxed font-bold">{service.title}</strong>
            <p className="text-sm leading-[1.85] text-ink/62">{service.body}</p>
            <Link
              href={hrefs[i]}
              className="mt-auto text-start text-sm font-semibold text-emerald transition-colors duration-(--duration-state) hover:text-emerald-live"
            >
              {service.action}
            </Link>
          </>
        ))}
      />
    </section>
  );
}
