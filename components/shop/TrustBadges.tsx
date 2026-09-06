import { fa } from "@/lib/i18n/fa";

/**
 * The trust band. Six promises on the emerald ground, separated by hairlines
 * rather than boxed — one continuous band, not six cards.
 *
 * No icons: the design's rule is that a dot plus the words carries it, and
 * six decorative glyphs here would compete with the department icons that
 * genuinely mean something on the rail above.
 */
export function TrustBadges() {
  return (
    <section
      aria-label={fa.home.trustAria}
      className="on-emerald mt-20 bg-linear-to-b from-emerald-hi to-emerald to-60% text-bone"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 px-5 sm:grid-cols-3 lg:grid-cols-6 lg:px-8">
        {fa.trust.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-2.5 border-s border-bone/14 px-5 py-7.5"
          >
            <span aria-hidden="true" className="block size-2 rounded-full bg-emerald-live" />
            <strong className="text-15 leading-relaxed font-bold">{item.title}</strong>
            <span className="text-13 leading-[1.75] text-bone/65">{item.body}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
