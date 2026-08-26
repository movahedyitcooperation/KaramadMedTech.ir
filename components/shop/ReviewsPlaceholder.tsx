import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr";
import { fa } from "@/lib/i18n/fa";

export function ReviewsPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line py-12 text-center">
      <ChatCircleDots size={32} className="text-ink-500" aria-hidden="true" />
      <p className="font-medium text-ink-900">{fa.reviews.comingSoonTitle}</p>
      <p className="max-w-sm text-sm text-ink-500">{fa.reviews.comingSoonDesc}</p>
    </div>
  );
}
