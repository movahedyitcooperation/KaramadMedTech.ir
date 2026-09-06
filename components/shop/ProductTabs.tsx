"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { fa } from "@/lib/i18n/fa";
import type { Product, ProductSpec } from "@/lib/types/product";
import { waHref } from "@/lib/utils/links";
import type { ContactSetting } from "@/lib/types/settings";
import { cn } from "@/lib/utils/cn";

/**
 * Safety-relevant spec keys, surfaced above the table.
 *
 * The schema has no dedicated fields for sterility, expiry, IRC code or
 * storage temperature — everything domain-specific is a `specs` row of
 * group/key/value strings. Rather than invent UI for fields that don't
 * exist, this matches on the key names the catalog actually uses and lifts
 * those rows into a pale-warn block, so they are reachable on a phone
 * without scrolling the whole table. If they ever become first-class
 * columns, this list goes away and the block reads them directly.
 */
const SAFETY_KEYS = [
  "وضعیت سترون",
  "تاریخ انقضا",
  "شرایط نگهداری",
  "دمای نگهداری",
  "کد IRC",
  "ضدعفونی",
  "ضدعفونی روکش",
];

type TabId = "review" | "specs" | "comments";

export function ProductTabs({
  product,
  contact,
}: {
  product: Product;
  contact: ContactSetting;
}) {
  const [tab, setTab] = useState<TabId>("review");

  // Group by `group`, preserving first-seen order — the backend already
  // returns specs in sort_order, so this never re-sorts, only buckets.
  const groups: { name: string; rows: ProductSpec[] }[] = [];
  for (const spec of product.specs) {
    let group = groups.find((g) => g.name === spec.group);
    if (!group) {
      group = { name: spec.group, rows: [] };
      groups.push(group);
    }
    group.rows.push(spec);
  }
  const safety = product.specs.filter((s) => SAFETY_KEYS.includes(s.key));

  const tabs: { id: TabId; label: string }[] = [
    { id: "review", label: fa.pdp.tabReview },
    { id: "specs", label: fa.pdp.tabSpecs },
    { id: "comments", label: fa.pdp.tabComments },
  ];

  return (
    <section className="mt-16">
      <div
        role="tablist"
        aria-label={fa.pdp.tabsAria}
        className="flex flex-wrap gap-0.5 border-b border-ink/14"
      >
        {tabs.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={cn(
                "cursor-pointer border-b-2 px-5.5 py-3.5 text-[15.5px] transition-colors duration-(--duration-state)",
                on
                  ? "border-emerald bg-emerald/6 font-bold text-emerald"
                  : "border-transparent font-medium text-ink/68"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="pt-7">
        {tab === "review" && (
          <div className="flex max-w-[72ch] flex-col gap-4">
            {product.description.map((paragraph, i) => (
              <p key={i} className="text-[16.5px] leading-[1.95] text-ink/82 text-pretty">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {tab === "specs" && (
          <div className="flex max-w-[820px] flex-col gap-6.5">
            {safety.length > 0 && (
              <div className="rounded-6 border border-warn-border bg-warn-bg px-5 py-4.5">
                <strong className="mb-3 block text-14 font-bold text-warn-strong">
                  {fa.pdp.safetyHeading}
                </strong>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4.5 gap-y-2.25 text-14">
                  {safety.map((spec, i) => (
                    <div key={i} className="contents">
                      <dt className="leading-[1.7] text-ink/68">{spec.key}</dt>
                      <dd className="m-0 leading-[1.7] font-semibold">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {groups.map((group) => (
              <div key={group.name}>
                <div className="border-b border-ink/14 pb-2.5 text-base font-bold text-emerald">
                  {group.name}
                </div>
                {group.rows.map((row, j) => (
                  <div
                    key={j}
                    className="grid grid-cols-[minmax(0,200px)_1fr] gap-5 border-b border-ink/7 py-3.25 text-15"
                  >
                    <span className="leading-[1.7] text-ink/68">{row.key}</span>
                    <span className="leading-[1.7] font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === "comments" && (
          // Not a form that posts nowhere: review submission is a Phase 7
          // stub, so this says so and offers the channel that does work.
          <Panel
            className="max-w-[720px]"
            title={fa.pdp.commentsSoonTitle}
            body={fa.pdp.commentsSoonBody}
            actions={
              <a
                href={waHref(contact)}
                className="rounded-4 bg-ink px-6 py-3.25 text-15 font-semibold text-surface transition-colors hover:bg-emerald"
              >
                {fa.pdp.commentsSoonCta}
              </a>
            }
          />
        )}
      </div>
    </section>
  );
}
