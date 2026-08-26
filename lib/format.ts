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
