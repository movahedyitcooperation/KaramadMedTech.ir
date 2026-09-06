import { describe, expect, it } from "vitest";
import {
  formatJalali,
  formatRating,
  formatToman,
  parseFaDigits,
  stars,
  toPersianDigits,
  toPersianNumber,
} from "./format";

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

describe("toPersianNumber", () => {
  it("groups thousands without the currency label", () => {
    expect(toPersianNumber(1250000)).toBe("۱٬۲۵۰٬۰۰۰");
  });
});

describe("parseFaDigits", () => {
  it("folds Persian digits back to Latin", () => {
    expect(parseFaDigits("۰۹۱۲۱۲۳۴۵۶۷")).toBe("09121234567");
  });

  it("strips anything that is not a digit, so a typed separator is harmless", () => {
    expect(parseFaDigits("۱٬۲۵۰٬۰۰۰ تومان")).toBe("1250000");
  });

  it("accepts a mixed-numeral string, which forms genuinely receive", () => {
    expect(parseFaDigits("۰۹12۳")).toBe("09123");
  });
});

describe("stars", () => {
  it("rounds to the nearest whole star and always returns five glyphs", () => {
    expect(stars(4.6)).toBe("★★★★★");
    expect(stars(4.4)).toBe("★★★★☆");
    expect(stars(0)).toBe("☆☆☆☆☆");
  });

  it("clamps out-of-range input rather than producing a short string", () => {
    expect(stars(9)).toBe("★★★★★");
    expect(stars(-3)).toBe("☆☆☆☆☆");
  });
});

describe("formatRating", () => {
  it("renders one decimal with the Persian decimal separator", () => {
    expect(formatRating(4.6)).toBe("۴٫۶");
    expect(formatRating(4)).toBe("۴٫۰");
  });
});
