import { InstagramLogo, MapPin, Phone, TelegramLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { getSiteSettings } from "@/lib/db/settings";
import { jalaliYear, toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";

const quickLinks = [
  { label: fa.footer.links.about, href: "/" },
  { label: fa.footer.links.blog, href: "/" },
  { label: fa.footer.links.faq, href: "/" },
  { label: fa.footer.links.trackOrder, href: "/" },
];

const customerServiceLinks = [
  { label: fa.footer.links.shipping, href: "/" },
  { label: fa.footer.links.payment, href: "/" },
  { label: fa.footer.links.returns, href: "/" },
  { label: fa.footer.links.terms, href: "/" },
  { label: fa.footer.links.privacy, href: "/" },
];

export async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="on-emerald bg-linear-to-b from-emerald-hi from-[-8%] via-emerald via-[22%] to-emerald-deep text-bone">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.3fr]">
          <div>
            <Logo tone="bone" />
            <p className="mt-4 max-w-[36ch] text-14 leading-prose text-bone/70">{fa.footer.aboutText}</p>
            <div className="mt-4 flex items-center gap-3">
              {/* aria-labels are hardcoded here, matching the pre-existing
                  behavior — one of the ~14 hardcoded-Persian sites this
                  whole codebase has; the sweep into fa.ts is Stage 7 scope,
                  not this restyle. */}
              {settings.social.telegram && (
                <a
                  href={settings.social.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="تلگرام"
                  className="flex h-10 w-10 items-center justify-center rounded-5 border border-bone/26 transition-colors duration-(--duration-state) hover:border-bone"
                >
                  <TelegramLogo size={18} aria-hidden="true" />
                </a>
              )}
              {settings.social.instagram && (
                <a
                  href={settings.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="اینستاگرام"
                  className="flex h-10 w-10 items-center justify-center rounded-5 border border-bone/26 transition-colors duration-(--duration-state) hover:border-bone"
                >
                  <InstagramLogo size={18} aria-hidden="true" />
                </a>
              )}
              {settings.social.aparat && (
                <a
                  href={settings.social.aparat}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="آپارات"
                  className="flex h-10 w-10 items-center justify-center rounded-5 border border-bone/26 transition-colors duration-(--duration-state) hover:border-bone"
                >
                  <YoutubeLogo size={18} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3.5 text-15 font-bold">{fa.footer.quickLinksTitle}</h3>
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-14 text-bone/72 transition-colors duration-(--duration-state) hover:text-bone"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3.5 text-15 font-bold">{fa.footer.customerServiceTitle}</h3>
            <ul className="flex flex-col gap-2.5">
              {customerServiceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-14 text-bone/72 transition-colors duration-(--duration-state) hover:text-bone"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3.5 text-15 font-bold">{fa.footer.contactTitle}</h3>
            <a
              href={`tel:${settings.contact.phone}`}
              dir="ltr"
              style={{ unicodeBidi: "plaintext" }}
              className="block text-lg font-bold"
            >
              {toPersianDigits(settings.contact.phone)}
            </a>
            <ul className="mt-3 flex flex-col gap-2.5 text-14 text-bone/72">
              <li className="flex items-start gap-2">
                <MapPin size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span className="leading-prose">{settings.contact.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={17} className="shrink-0" aria-hidden="true" />
                <span>{fa.footer.workingHours}</span>
              </li>
            </ul>
            {/* Placeholder license badges — left exactly as before (3
                generic dashed boxes, no real link) per the porting plan;
                real license badges/links are out of scope for this pass. */}
            <div className="mt-5 flex flex-wrap gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-16 w-16 items-center justify-center rounded-4 border border-dashed border-bone/24 text-center text-11 text-bone/55"
                >
                  نماد
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-bone/14 pt-5.5 text-13 text-bone/55 sm:flex-row sm:items-center sm:justify-between">
          <p>{fa.footer.rights(jalaliYear())}</p>
          <Link href="/" className="hover:text-bone">
            {fa.footer.links.returns}
          </Link>
        </div>
      </div>
    </footer>
  );
}
