import Link from "next/link";
import { Fragment } from "react";
import { ArrowLeft, CreditCard, Headset, Receipt, SealCheck } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react/lib";
import { RuleBox } from "@/components/ui/RuleBox";
import { fa } from "@/lib/i18n/fa";
import { telHref } from "@/lib/utils/links";
import type { ContactSetting } from "@/lib/types/settings";

/**
 * The four service cells. A RuleBox, not four cards: they read as one set
 * of promises the shop makes, so they share a single box divided by
 * hairlines rather than each floating separately.
 *
 * Each cell now carries the icon that names its promise — a payment card
 * for the instalment plan, a headset for the pre-sale expert, a receipt for
 * the official invoice, a seal for provenance. They replace four squares
 * that differed only in corner radius, which asked a shopper to read the
 * heading before the cell meant anything.
 *
 * The icons are Phosphor at `light` weight, the project's existing icon
 * library — deliberately NOT the six department glyphs, which are the
 * owner's own artwork and mean "this is a department of the shop." Nothing
 * here is a department, so nothing here borrows that mark or its hue.
 *
 * The hover/focus treatment lives in `.km-service` (globals.css): a shallow
 * emerald wash, a rule on the cell's inline-start divider, and the icon and
 * title going from resting emerald to the live green. Hover is on the CELL,
 * `group` on the cell, so pointing anywhere in it lights all of it — but the
 * CTA link is still the only click target, unchanged.
 */
const icons: Icon[] = [CreditCard, Headset, Receipt, SealCheck];

export function ServiceCards({
  contact,
  clinicCategorySlug,
}: {
  contact: ContactSetting;
  clinicCategorySlug: string | null;
}) {
  const hrefs = [
    clinicCategorySlug ? `/category/${clinicCategorySlug}` : "/search",
    telHref(contact.phone),
    telHref(contact.phone),
    "#site-footer",
  ];

  return (
    <section
      aria-labelledby="km-services-heading"
      className="mx-auto max-w-[1280px] px-5 pt-18 lg:px-8"
    >
      <h2 id="km-services-heading" className="mb-6 text-h2 font-extrabold tracking-[-0.01em]">
        {fa.home.servicesAria}
      </h2>
      <RuleBox
        className="sm:grid-cols-2 lg:grid-cols-4"
        itemClassName="km-service group flex min-h-52 flex-col gap-4 p-7"
        items={fa.services.map((service, i) => {
          const Glyph = icons[i];
          return (
            <Fragment key={service.title}>
              <Glyph
                aria-hidden="true"
                size={27}
                weight="light"
                className="text-emerald/55 transition-colors duration-(--duration-state) ease-out group-hover:text-emerald-live group-focus-within:text-emerald-live"
              />
              <strong className="text-[17px] leading-relaxed font-bold transition-colors duration-(--duration-state) ease-out group-hover:text-emerald-live-deep group-focus-within:text-emerald-live-deep">
                {service.title}
              </strong>
              <p className="text-sm leading-[1.85] text-ink/72">{service.body}</p>
              <Link
                href={hrefs[i]}
                className="mt-auto inline-flex items-center gap-1.5 self-start text-sm font-semibold text-emerald transition-colors duration-(--duration-state) hover:text-emerald-live"
              >
                {service.action}
                <ArrowLeft
                  aria-hidden="true"
                  size={14}
                  weight="bold"
                  className="transition-transform duration-(--duration-state) ease-out group-hover:-translate-x-0.5 group-focus-within:-translate-x-0.5"
                />
              </Link>
            </Fragment>
          );
        })}
      />
    </section>
  );
}
