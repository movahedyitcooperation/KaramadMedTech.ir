import {
  ArrowCounterClockwise,
  HandCoins,
  Headset,
  ShieldCheck,
  Tag,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import { RuleBox } from "@/components/ui/RuleBox";
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
    <section
      // aria-label is hardcoded here, matching pre-existing behavior; the
      // fa.ts sweep is Stage 7 scope.
      aria-label="ویژگی‌های فروشگاه"
      className="on-emerald bg-linear-to-b from-emerald-hi to-emerald to-60% py-0 text-bone"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <RuleBox
          tone="emerald"
          className="rounded-none grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
          itemClassName="flex flex-col items-center gap-2.5 py-7.5 text-center"
          items={badges.map((b) => {
            const Icon = b.icon;
            return (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-live" aria-hidden="true" />
                <Icon size={20} aria-hidden="true" />
                <p className="text-15 font-bold">{b.title}</p>
                <p className="text-13 leading-prose text-bone/65">{b.desc}</p>
              </>
            );
          })}
        />
      </div>
    </section>
  );
}
