import { ChatCircleDots, CreditCard, FileText, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fa } from "@/lib/i18n/fa";

const services = [
  { icon: CreditCard, bar: "bg-brand-600", tile: "bg-brand-50 text-brand-600", ...fa.service.installment },
  { icon: ChatCircleDots, bar: "bg-green-500", tile: "bg-green-500/10 text-green-600", ...fa.service.consultRequest },
  { icon: FileText, bar: "bg-accent-500", tile: "bg-accent-500/10 text-accent-600", ...fa.service.officialInvoice },
  { icon: SealCheck, bar: "bg-brand-700", tile: "bg-brand-50 text-brand-700", ...fa.service.whyUs },
];

export function ServiceCards() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeader kicker={fa.home.servicesKicker} title={fa.home.servicesTitle} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="overflow-hidden rounded-card border border-line bg-surface shadow-sm transition-[box-shadow,border-color] duration-(--duration-base) ease-out-soft hover:border-brand-200 hover:shadow-md"
            >
              <div className={`h-1 ${s.bar}`} aria-hidden="true" />
              <div className="flex flex-col items-start gap-3 p-5">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-tile ${s.tile}`}
                >
                  <Icon size={24} aria-hidden="true" />
                </span>
                <p className="text-sm font-bold text-ink-900">{s.title}</p>
                <p className="text-xs leading-6 text-ink-500">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
