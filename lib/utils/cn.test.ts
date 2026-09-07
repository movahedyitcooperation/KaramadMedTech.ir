import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { cn, themeFontSizes } from "./cn";

/**
 * These guard one specific failure: tailwind-merge only knows Tailwind's
 * default t-shirt sizes, so an unregistered `text-*` class is filed as a text
 * COLOUR and silently evicts a real colour that came before it. That is how
 * the add-to-cart CTA shipped ink text on an ink fill.
 */
describe("cn — theme font sizes vs. text colours", () => {
  it("keeps the colour when a theme font size follows it (the add-to-cart CTA)", () => {
    // Button's `ink` variant emits the colour; AddToCartButton appends the size.
    expect(cn("bg-ink text-surface hover:bg-emerald", "w-full py-3 text-14 font-semibold"))
      .toContain("text-surface");
  });

  it("keeps the size when a text colour follows it (RatingRow, the logo tagline)", () => {
    expect(cn("flex items-center gap-[7px] text-13 text-ink/70")).toContain("text-13");
  });

  it("still lets a later size win over an earlier one", () => {
    const result = cn("text-base", "text-14");
    expect(result).toBe("text-14");
  });

  it("still lets a later colour win over an earlier one", () => {
    expect(cn("text-ink", "text-surface")).toBe("text-surface");
  });

  it("covers every theme size against every text colour it shares a component with", () => {
    for (const size of themeFontSizes) {
      const result = cn(`text-surface text-${size}`);
      expect(result, `text-${size} evicted text-surface`).toContain("text-surface");
      expect(result, `text-surface evicted text-${size}`).toContain(`text-${size}`);
    }
  });
});

describe("cn — themeFontSizes stays in step with globals.css", () => {
  it("registers exactly the --text-* tokens declared in the @theme block", () => {
    const css = readFileSync(
      fileURLToPath(new URL("../../app/globals.css", import.meta.url)),
      "utf8"
    );
    // `--text-lg: …` but not the paired `--text-lg--line-height: …`
    const declared = [...css.matchAll(/^\s*--text-([a-z0-9-]+):/gm)]
      .map((m) => m[1])
      .filter((name) => !name.includes("--"));

    expect(new Set(declared)).toEqual(new Set(themeFontSizes));
  });
});
