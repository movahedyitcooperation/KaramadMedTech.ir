import { InstagramLogo, MapPin, Phone, TelegramLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { jalaliYear, toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { getSiteSettings } from "@/lib/db/settings";

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
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-ink-500">{fa.footer.aboutText}</p>
            <div className="mt-4 flex items-center gap-3">
              {settings.social.telegram && (
                <a
                  href={settings.social.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="تلگرام"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-500 transition-colors duration-200 hover:text-brand-600"
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-500 transition-colors duration-200 hover:text-brand-600"
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-500 transition-colors duration-200 hover:text-brand-600"
                >
                  <YoutubeLogo size={18} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-ink-900">{fa.footer.quickLinksTitle}</h3>
            <ul className="space-y-2 text-sm text-ink-500">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-brand-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-ink-900">{fa.footer.customerServiceTitle}</h3>
            <ul className="space-y-2 text-sm text-ink-500">
              {customerServiceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-brand-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-ink-900">{fa.footer.contactTitle}</h3>
            <ul className="space-y-3 text-sm text-ink-500">
              <li className="flex items-start gap-2">
                <MapPin size={18} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
                <span>{settings.contact.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={18} className="shrink-0 text-brand-600" aria-hidden="true" />
                <span>{toPersianDigits(settings.contact.phone)}</span>
              </li>
              <li className="text-xs">{fa.footer.workingHours}</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <h3 className="mb-3 text-sm font-bold text-ink-900">{fa.footer.licensesTitle}</h3>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex h-16 w-16 items-center justify-center rounded-input border border-dashed border-line text-xs text-ink-500"
              >
                نماد
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-ink-500">{fa.footer.rights(jalaliYear())}</p>
      </div>
    </footer>
  );
}
