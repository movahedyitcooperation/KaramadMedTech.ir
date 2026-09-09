"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { fa } from "@/lib/i18n/fa";

const AUTOPLAY_MS = 3000;
/** How long a touch/click/keypress keeps autoplay parked before it resumes. */
const RESUME_AFTER_MS = 5000;

/**
 * The phone control strip for the home category rail — a row of pill chips,
 * one per category, over the scroll-snap carousel in CategoryIconCards.
 *
 * This replaces the pagination dots it grew out of, and keeps their job: the
 * carousel itself is still native overflow scrolling with CSS scroll-snap, so
 * the swipe, its momentum and its settle are all the browser's. This
 * component only ever answers "which card is centred", scrolls to a card when
 * its chip is tapped, and advances on a timer.
 *
 * It reads geometry rather than scrollLeft on purpose: in RTL the sign and
 * origin of scrollLeft still differ between engines, but "which child's
 * centre is nearest the track's centre" is direction-agnostic and correct
 * everywhere. (This is not the scroll-triggered animation CLAUDE.md §3 rules
 * out — nothing is revealed by scrolling; a control is reporting position.)
 *
 * Autoplay is deliberately timid: it stops the moment anyone touches the
 * strip or the carousel, waits out an idle period before resuming, halts
 * while the tab is in the background, and never runs at all under
 * prefers-reduced-motion.
 *
 * Above the sm breakpoint the rail is a grid and this whole strip is
 * display:none, so every listener bails out rather than describing a layout
 * it is not attached to.
 */
export function CategoryRailChips({
  trackId,
  labels,
}: {
  trackId: string;
  labels: string[];
}) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const chipsRef = useRef<(HTMLButtonElement | null)[]>([]);
  // Timestamp until which autoplay stays parked after an interaction.
  const pausedUntil = useRef(0);

  const isPhone = () =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;

  /* ---- which card is centred ---- */
  useEffect(() => {
    const track = document.getElementById(trackId);
    if (!track) return;
    trackRef.current = track;
    let frame = 0;

    const measure = () => {
      frame = 0;
      if (!isPhone()) return;
      const box = track.getBoundingClientRect();
      const centre = box.left + box.width / 2;
      let nearest = 0;
      let shortest = Infinity;
      for (let i = 0; i < track.children.length; i += 1) {
        const slide = track.children[i].getBoundingClientRect();
        const distance = Math.abs(slide.left + slide.width / 2 - centre);
        if (distance < shortest) {
          shortest = distance;
          nearest = i;
        }
      }
      setActive(nearest);
    };

    // rAF-coalesced: a flung carousel fires scroll far more often than it
    // paints, and the chips only ever need the painted answer.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    measure();

    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [trackId]);

  const goTo = useCallback((index: number) => {
    const slide = trackRef.current?.children[index];
    slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  /* ---- park autoplay whenever a person is doing something ---- */
  useEffect(() => {
    const track = trackRef.current;
    const strip = stripRef.current;
    if (!track || !strip) return;
    const park = () => {
      pausedUntil.current = Date.now() + RESUME_AFTER_MS;
    };
    const targets = [track, strip];
    const events = ["pointerdown", "touchstart", "wheel", "keydown", "focusin"] as const;
    for (const el of targets) {
      for (const type of events) el.addEventListener(type, park, { passive: true });
    }
    return () => {
      for (const el of targets) {
        for (const type of events) el.removeEventListener(type, park);
      }
    };
  }, []);

  /* ---- autoplay ---- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Reduced motion means no unrequested movement at all, not a slower one.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tick = window.setInterval(() => {
      if (!isPhone()) return;
      if (document.hidden) return;
      if (Date.now() < pausedUntil.current) return;
      const count = trackRef.current?.children.length ?? 0;
      if (!count) return;
      setActive((current) => {
        const next = (current + 1) % count;
        goTo(next);
        return current; // the scroll listener is the source of truth
      });
    }, AUTOPLAY_MS);

    return () => window.clearInterval(tick);
  }, [goTo]);

  /* ---- keep the active row in view, but only if the index itself scrolls ----
   * The index is a short static list at every phone width tested, so this
   * normally does nothing. Guarding on the strip's own overflow matters:
   * calling scrollIntoView on a child of a NON-scrolling container walks up
   * and scrolls the PAGE instead, which would yank the viewport every time
   * autoplay advanced. */
  useEffect(() => {
    if (!isPhone()) return;
    const strip = stripRef.current;
    const chip = chipsRef.current[active];
    if (!strip || !chip) return;
    const scrolls = strip.scrollHeight > strip.clientHeight + 2;
    if (!scrolls) return;
    strip.scrollTo({
      top: chip.offsetTop - strip.clientHeight / 2 + chip.offsetHeight / 2,
      behavior: "smooth",
    });
  }, [active]);

  return (
    <div
      ref={stripRef}
      /* Deliberately NOT role="tablist": the carousel slides are links, not
       * tabpanels, and a tablist without panels misleads a screen reader
       * about what the arrow keys will do. A plain group of buttons with
       * aria-current says exactly what is true — one of these is the one
       * you are on. */
      role="group"
      aria-label={fa.home.categoriesAria}
      /* A vertical index down the physical left of the phone composition,
       * in its own emerald panel — the same ground the header, trust band
       * and footer sit on, so the panel reads as part of the site rather
       * than a component dropped into it. `on-emerald` switches the focus
       * ring to bone, which is the only colour that carries on this ground.
       * The width is a share of the row rather than a fixed px so the long
       * Persian names wrap the same way at every phone width, and the card
       * beside it keeps the majority of the space. */
      className="km-cat-chips on-emerald flex w-[34%] shrink-0 flex-col justify-center gap-1 rounded-7 bg-emerald p-2 sm:hidden"
    >
      {labels.map((label, index) => {
        const distance = Math.abs(index - active);
        const isActive = index === active;
        return (
          <button
            key={label}
            ref={(el) => {
              chipsRef.current[index] = el;
            }}
            type="button"
            aria-current={isActive}
            onClick={() => {
              pausedUntil.current = Date.now() + RESUME_AFTER_MS;
              goTo(index);
            }}
            /* An index row, not a pill and not a sidebar item: no border,
             * no fill for the inactive ones, and the selected one lifts onto
             * the surface with ink text. Text is `text-start` — the right
             * edge in RTL — so the names face the card they describe. */
            className={cn(
              "relative w-full cursor-pointer rounded-pill px-3 py-2 text-start text-12 leading-snug transition-[color,background-color,opacity] duration-(--duration-state) ease-out",
              isActive ? "bg-surface font-bold text-ink" : "text-bone/70"
            )}
            /* Rows further from the current one recede a little, the way the
             * reference's chips do — gently, so the whole index stays
             * legible and tappable rather than becoming decoration. */
            style={{ opacity: isActive ? 1 : Math.max(0.7, 1 - distance * 0.09) }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
