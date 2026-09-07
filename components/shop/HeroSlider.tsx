"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fa } from "@/lib/i18n/fa";
import type { HeroSlide } from "@/lib/types/settings";
import { cn } from "@/lib/utils/cn";

/**
 * Hero imagery is the frontend's own, keyed by slide id.
 *
 * The backend's hero_slides rows carry `image_alt` but no image URL, so the
 * photograph can't come from the API. Falling back by index keeps a
 * newly-added fourth slide from rendering with no background at all.
 *
 * Sources are 1600px WebP (~35-120 KB each, down from 0.5-1.4 MB PNG/JPEG).
 * next/image re-encodes to AVIF where the browser accepts it and serves a
 * width matched to the viewport, so a phone never downloads the desktop file.
 */
const SLIDE_IMAGES = [
  { src: "/images/hero/hero-1.webp", position: "22% 50%" },
  { src: "/images/hero/hero-2.webp", position: "38% 50%" },
  { src: "/images/hero/hero-3.webp", position: "32% 50%" },
];
const IMAGE_BY_ID: Record<string, (typeof SLIDE_IMAGES)[number]> = {
  "slide-1": SLIDE_IMAGES[0],
  "slide-2": SLIDE_IMAGES[1],
  "slide-3": SLIDE_IMAGES[2],
};

/** Mirrors --hero-cycle in globals.css: the dot's fill IS this timer. */
const CYCLE_MS = 6500;

/**
 * The one authored moment in the whole storefront: a slide focuses in, its
 * text settles line by line, and the active dot fills as a visible cycle
 * timer. Everywhere else motion only reports feedback or state.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Only slides that have actually been shown get an <Image> in the tree.
  // All three are inside the viewport (stacked, faded), so `loading="lazy"`
  // would not hold any of them back — the browser fetches everything it can
  // see. Mounting on demand is what keeps first paint to ONE hero image
  // instead of three, which matters most on the mobile connections this shop
  // is built for. Once shown, a slide stays mounted so cycling back is
  // instant and the crossfade still has something to fade to.
  const [shown, setShown] = useState<number[]>([0]);
  const count = slides.length;

  const go = useCallback(
    (next: number) => {
      const target = ((next % count) + count) % count;
      setIndex(target);
      setShown((prev) => (prev.includes(target) ? prev : [...prev, target]));
    },
    [count]
  );
  const goPrev = useCallback(() => go(index - 1), [go, index]);
  const goNext = useCallback(() => go(index + 1), [go, index]);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setTimeout(() => go(index + 1), CYCLE_MS);
    return () => clearTimeout(t);
  }, [index, paused, count, go]);

  if (count === 0) return null;
  const slide = slides[index];
  // The backend's `highlight` is a phrase *inside* the title (e.g. «تضمین
  // اصالت» within «تجهیزات پزشکی با تضمین اصالت…»), whereas the design uses
  // it as a separate supporting line. Rendering both would echo the same
  // words twice, so a highlight that is already part of the title is
  // emphasised in place instead; a standalone one becomes the lead line.
  const highlightIsInTitle = slide.highlight.length > 0 && slide.title.includes(slide.highlight);

  return (
    <section
      aria-label={fa.hero.aria}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        // RTL: ArrowLeft advances, ArrowRight goes back.
        if (e.key === "ArrowLeft") goNext();
        else goPrev();
      }}
      className="on-emerald relative flex min-h-[clamp(468px,58vh,552px)] items-center overflow-hidden bg-emerald text-bone"
    >
      <div aria-hidden="true" className="absolute inset-0">
        {slides.map((s, i) => {
          if (!shown.includes(i)) return null;
          const img = IMAGE_BY_ID[s.id] ?? SLIDE_IMAGES[i % SLIDE_IMAGES.length];
          return (
            <Image
              key={s.id}
              src={img.src}
              alt=""
              fill
              priority={i === 0}
              // Full-bleed: the rendered width IS the viewport width, so the
              // optimizer picks a 640px variant for a phone and a 1600px one
              // for a wide desktop.
              sizes="100vw"
              style={{
                objectPosition: img.position,
                opacity: index === i ? 1 : 0,
                transform: index === i ? "scale(1)" : "scale(1.02)",
              }}
              className="object-cover transition-[opacity,transform] duration-(--duration-hero) ease-out"
            />
          );
        })}
        {/* Darkens the inline-start (right, in RTL) edge, where the text
         * column sits — a plain 90deg gradient darkens the wrong side. */}
        <div className="absolute inset-0 bg-[linear-gradient(270deg,rgb(8_20_15/0.82)_0%,rgb(8_20_15/0.6)_40%,rgb(8_20_15/0.26)_70%,rgb(8_20_15/0.08)_100%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col justify-center px-5 pt-12 pb-[112px] lg:px-8">
        {/* Re-keyed per slide so the reconciler re-creates the column and the
         * .km-slidein children settle in again, once, per slide change. */}
        <div key={index} className="km-slidein max-w-[640px]">
          <div className="text-sm leading-relaxed text-bone/70">
            {fa.hero.counter(index + 1, count)}
          </div>
          <h1 className="mt-3.5 max-w-[20ch] text-display leading-tight font-extrabold tracking-display text-pretty [text-shadow:0_1px_12px_rgb(0_0_0/0.28)]">
            {highlightIsInTitle ? highlightedTitle(slide.title, slide.highlight) : slide.title}
          </h1>
          {!highlightIsInTitle && (
            <p className="mt-5 max-w-[44ch] border-s-2 border-emerald-live ps-[18px] text-lead leading-[1.85] text-bone/90">
              {slide.highlight}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={slide.ctaHref}
              className="rounded-4 bg-bone px-7 py-4 text-base font-bold text-ink transition-colors duration-(--duration-state) ease-out hover:bg-white"
            >
              {slide.ctaLabel}
            </Link>
            <a
              href="#site-footer"
              className="rounded-4 border border-bone/44 px-7 py-4 text-base text-bone transition-colors duration-(--duration-state) ease-out hover:border-bone"
            >
              {fa.hero.consult}
            </a>
          </div>
        </div>
      </div>

      {/* Pinned to the section's own bottom edge so the controls hold one
       * fixed spot however tall a given slide's headline runs. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[40px] mx-auto w-full max-w-[1280px] px-5 lg:px-8">
        <div className="pointer-events-auto flex max-w-[640px] items-center justify-between gap-4">
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={fa.hero.dot(i + 1)}
                aria-current={index === i ? "true" : "false"}
                className={cn(
                  "relative h-1 w-[30px] cursor-pointer overflow-hidden rounded-pill transition-colors duration-(--duration-state)",
                  index === i ? "bg-bone/50" : "bg-bone/26"
                )}
              >
                <span
                  // Re-keyed per slide so the fill animation restarts each cycle.
                  key={index === i ? `t${index}` : "f"}
                  data-paused={String(paused)}
                  className={cn(
                    "absolute inset-0 origin-right rounded-[inherit] bg-bone",
                    index === i ? "km-hero-progress" : "scale-x-0"
                  )}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label={fa.hero.prev}
              className="j-hero-arrow size-11 cursor-pointer rounded-4 text-[17px] text-bone"
            >
              →
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={fa.hero.next}
              className="j-hero-arrow size-11 cursor-pointer rounded-4 text-[17px] text-bone"
            >
              ←
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Splits the title on the highlight phrase and marks each occurrence. */
function highlightedTitle(title: string, highlight: string) {
  const parts = title.split(highlight);
  return parts.flatMap((part, i) => [
    <span key={`p${i}`}>{part}</span>,
    ...(i < parts.length - 1
      ? [
          <span key={`h${i}`} className="border-b-2 border-emerald-live pb-0.5">
            {highlight}
          </span>,
        ]
      : []),
  ]);
}
