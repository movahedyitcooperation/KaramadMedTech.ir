/* format.js — the sole formatting authority. No component prints a raw number.
   Numeral policy (DESIGN.md §1.2): Persian digits in prose, prices and spec values;
   Latin left as-is in SKU / phone / postal code (callers simply don't pass those here). */

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** "1250" -> "۱۲۵۰" (digits only, punctuation untouched). */
export function toPersianDigits(input) {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);
}

/** 1250000 -> "۱٬۲۵۰٬۰۰۰"  (Persian digits, U+066C thousands separator). */
export function toPersianNumber(n) {
  const grouped = Number(n).toLocaleString("en-US").replace(/,/g, "٬");
  return toPersianDigits(grouped);
}

/** 1250000 -> "۱٬۲۵۰٬۰۰۰ تومان" */
export function formatToman(n) {
  return toPersianNumber(n) + " تومان";
}

/** "۰۹۱۲" or "12ab" -> "0912" (strip to Latin digits). Mirrors the server's parse. */
export function parseFaDigits(s) {
  let out = "";
  for (const ch of String(s)) {
    const i = FA_DIGITS.indexOf(ch);
    out += i >= 0 ? String(i) : ch;
  }
  return out.replace(/[^0-9]/g, "");
}

/** Rounded-to-nearest 5-star string, e.g. 4.6 -> "★★★★★" (5) sliced to filled + hollow. */
export function stars(rating) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return "★★★★★".slice(0, filled) + "☆☆☆☆☆".slice(0, 5 - filled);
}

/** Jalali date via the browser's own Persian calendar — zero bytes, no dayjs. */
export function formatJalali(date) {
  const d = date instanceof Date ? date : new Date(date);
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric", month: "long", day: "numeric",
    }).format(d);
  } catch {
    return toPersianDigits(d.toISOString().slice(0, 10));
  }
}

/** One decimal, Persian digits: 4.6 -> "۴٫۶" (U+066B decimal separator). */
export function formatRating(r) {
  return toPersianDigits(Number(r).toFixed(1)).replace(".", "٫");
}
