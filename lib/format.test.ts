import { describe, expect, it } from "vitest";
import { formatJalali, formatToman, toPersianDigits } from "./format";

describe("toPersianDigits", () => {
  it("converts each Latin digit to its Persian counterpart", () => {
    expect(toPersianDigits("0123456789")).toBe("۰۱۲۳۴۵۶۷۸۹");
  });

  it("leaves non-digit characters untouched", () => {
    expect(toPersianDigits("قیمت: 100 تومان")).toBe("قیمت: ۱۰۰ تومان");
  });
});

describe("formatToman", () => {
  it("groups thousands with the Persian separator and appends the currency label", () => {
    expect(formatToman(1250000)).toBe("۱٬۲۵۰٬۰۰۰ تومان");
  });

  it("formats small numbers without a separator", () => {
    expect(formatToman(500)).toBe("۵۰۰ تومان");
  });

  it("rounds fractional input before formatting", () => {
    expect(formatToman(1999.6)).toBe("۲٬۰۰۰ تومان");
  });
});

describe("formatJalali", () => {
  it("converts the known Nowruz 1403 date (2024-03-20) with Persian digits and month name", () => {
    const result = formatJalali(new Date("2024-03-20T09:05:00"));
    expect(result).toContain("۱۴۰۳");
    expect(result).toContain("فروردین");
    expect(result).toContain("۰۹:۰۵");
    expect(result).not.toMatch(/[0-9]/);
  });
});
