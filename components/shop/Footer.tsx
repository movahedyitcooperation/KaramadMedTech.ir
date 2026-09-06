import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { getTopLevelCategories } from "@/lib/db/categories";
import { getSiteSettings } from "@/lib/db/settings";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { socialHref, telHref, waHref } from "@/lib/utils/links";

/**
 * Four columns on the emerald ground: the brand block with socials, the
 * department list, the services list, and contact + licence badge slots.
 *
 * The socials are lettered chips rather than brand glyphs — Aparat has no
 * Phosphor icon, and three real logos plus one improvised mark reads worse
 * than four consistent word-chips.
 *
 * The نماد اعتماد / ساماندهی slots are placeholders on purpose: those badges
 * are issued to the business and pasted in as vendor-hosted markup. Empty
 * outlines say "this is where they go" without inventing a fake seal.
 */
export async function Footer() {
  const [settings, categories] = await Promise.all([getSiteSettings(), getTopLevelCategories()]);

  // Only the three the footer actually links, plus WhatsApp — `youtube`
  // exists on the settings schema but the shop has no channel, and an empty
  // chip is worse than no chip.
  type SocialKind = "telegram" | "instagram" | "aparat" | "whatsapp";
  const socials: { kind: SocialKind; href: string }[] = [
    ...(["telegram", "instagram", "aparat"] as const)
      .filter((k) => Boolean(settings.social[k]))
      .map((k) => ({ kind: k as SocialKind, href: socialHref(k, settings.social[k] as string) })),
    { kind: "whatsapp" as SocialKind, href: waHref(settings.contact) },
  ];

  const clinic = categories.find((c) => c.slug === "tajhizat-matb-clinic");
  const serviceHrefs = [
    clinic ? `/category/${clinic.slug}` : "/",
    telHref(settings.contact.phone),
    telHref(settings.contact.phone),
    "#site-footer",
  ];

  return (
    <footer
      id="site-footer"
      className="on-emerald mt-auto bg-linear-to-b from-emerald-hi from-[-8%] via-emerald via-[22%] to-emerald-deep text-bone"
    >
      <div className="mx-auto max-w-[1280px] px-5 pt-14 pb-8 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.3fr]">
          <div className="flex flex-col gap-4">
            <Logo tone="bone" />
            <p className="max-w-[36ch] text-sm leading-[1.9] text-bone/70">{fa.brand.blurb}</p>
            <div className="flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.kind}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={fa.footer.socialNames[s.kind]}
                  className="grid size-10 place-items-center rounded-4 border border-bone/26 text-[11.5px] font-semibold text-bone transition-colors duration-(--duration-state) hover:border-bone"
                >
                  {fa.footer.socialNames[s.kind]}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3.5 text-15 font-bold">{fa.footer.categoriesHeading}</div>
            <ul className="flex flex-col gap-2.5">
              {categories.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="text-sm leading-relaxed text-bone/72 transition-colors duration-(--duration-state) hover:text-bone"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-3.5 text-15 font-bold">{fa.footer.servicesHeading}</div>
            <ul className="flex flex-col gap-2.5">
              {fa.footer.serviceLinks.map((link, i) => (
                <li key={link.label}>
                  <Link
                    href={serviceHrefs[i]}
                    className="text-sm leading-relaxed text-bone/72 transition-colors duration-(--duration-state) hover:text-bone"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-15 font-bold">{fa.footer.contactHeading}</div>
            <a
              href={telHref(settings.contact.phone)}
              dir="ltr"
              style={{ unicodeBidi: "plaintext" }}
              className="text-[19px] font-bold text-bone"
            >
              {toPersianDigits(settings.contact.phone)}
            </a>
            <div className="text-sm leading-[1.95] text-bone/72">{settings.contact.address}</div>
            <div className="mt-1 flex gap-2.5">
              {[fa.footer.enamad, fa.footer.samandehi].map((label) => (
                <span
                  key={label}
                  className="grid h-16 w-22 place-items-center rounded-4 border border-bone/24 p-1.5 text-center text-[11px] leading-normal text-bone/55"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-5 border-t border-bone/14 pt-5.5 text-13 leading-[1.8] text-bone/55">
          <span>{fa.footer.copyright}</span>
          <span>{fa.footer.returnPolicy}</span>
        </div>
      </div>
    </footer>
  );
}
