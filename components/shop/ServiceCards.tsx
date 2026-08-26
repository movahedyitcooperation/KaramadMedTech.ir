import { ChatCircleDots, CreditCard, FileText, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { fa } from "@/lib/i18n/fa";

const services = [
  { icon: CreditCard, accent: "bg-brand-600", ...fa.service.installment },
  { icon: ChatCircleDots, accent: "bg-teal-500", ...fa.service.consultRequest },
  { icon: FileText, accent: "bg-coral-500", ...fa.service.officialInvoice },
  { icon: SealCheck, accent: "bg-brand-700", ...fa.service.whyUs },
];

export function ServiceCards() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="overflow-hidden rounded-card border border-line bg-surface shadow-soft"
            >
              <div className={`h-1 ${s.accent}`} aria-hidden="true" />
              <div className="flex flex-col items-start gap-3 p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <p className="text-sm font-bold text-ink-900">{s.title}</p>
                <p className="text-xs text-ink-500">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
