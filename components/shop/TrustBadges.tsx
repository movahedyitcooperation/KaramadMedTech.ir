import {
  ArrowCounterClockwise,
  HandCoins,
  Headset,
  ShieldCheck,
  Tag,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import { fa } from "@/lib/i18n/fa";

const badges = [
  { icon: Truck, ...fa.trust.fastShipping },
  { icon: HandCoins, ...fa.trust.cod },
  { icon: Tag, ...fa.trust.bestPrice },
  { icon: ShieldCheck, ...fa.trust.authenticity },
  { icon: Headset, ...fa.trust.expertConsult },
  { icon: ArrowCounterClockwise, ...fa.trust.returnPolicy },
];

export function TrustBadges() {
  return (
    <section aria-label="ویژگی‌های فروشگاه" className="border-y border-line bg-surface py-9">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-6 px-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-6">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} className="flex flex-col items-center gap-2 px-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-brand-50 text-brand-600">
                <Icon size={24} aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-ink-900">{b.title}</p>
              <p className="text-xs leading-5 text-ink-500">{b.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
