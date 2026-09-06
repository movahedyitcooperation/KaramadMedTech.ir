import dayjs from "dayjs";
import jalaliday from "jalaliday";
import "dayjs/locale/fa";

dayjs.extend(jalaliday);
dayjs.locale("fa");

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: number | string): string {
  return String(input).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

export function formatToman(amount: number): string {
  const grouped = Math.round(amount)
    .toLocaleString("en-US")
    .replace(/,/g, "٬");
  return `${toPersianDigits(grouped)} تومان`;
}

export function formatJalali(date: Date | string): string {
  const jalaliDate = dayjs(date).calendar("jalali");
  return toPersianDigits(jalaliDate.format("dddd DD MMMM YYYY - HH:mm"));
}

export function jalaliYear(date: Date | string = new Date()): string {
  return toPersianDigits(dayjs(date).calendar("jalali").format("YYYY"));
}

/** 1250000 -> "۱٬۲۵۰٬۰۰۰" — Persian digits, U+066C thousands separator, no unit. */
export function toPersianNumber(amount: number): string {
  return toPersianDigits(Math.round(amount).toLocaleString("en-US").replace(/,/g, "٬"));
}

/**
 * "۰۹۱۲" or "۱۲ab" -> "0912" / "12". Mirrors the backend's own parse: strips
 * everything that isn't a digit after folding Persian digits to Latin, so a
 * quantity or phone field accepts either numeral set.
 */
export function parseFaDigits(input: string): string {
  let out = "";
  for (const ch of String(input)) {
    const i = PERSIAN_DIGITS.indexOf(ch);
    out += i >= 0 ? String(i) : ch;
  }
  return out.replace(/[^0-9]/g, "");
}

/** 4.6 -> "★★★★★" (rounded to nearest whole star, filled + hollow to 5). */
export function stars(rating: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return "★★★★★".slice(0, filled) + "☆☆☆☆☆".slice(0, 5 - filled);
}

/** One decimal, Persian digits and the U+066B decimal separator: 4.6 -> "۴٫۶". */
export function formatRating(rating: number): string {
  return toPersianDigits(Number(rating).toFixed(1)).replace(".", "٫");
}
