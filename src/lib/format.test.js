/* format.test.js — run with `node --test src/lib/format.test.js`. No test runner dep. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toPersianDigits, toPersianNumber, formatToman, parseFaDigits, stars, formatRating,
} from "./format.js";

test("toPersianDigits maps only digits", () => {
  assert.equal(toPersianDigits("KMT-BP-0001"), "KMT-BP-۰۰۰۱");
  assert.equal(toPersianDigits(2026), "۲۰۲۶");
});

test("toPersianNumber groups with U+066C", () => {
  assert.equal(toPersianNumber(1250000), "۱٬۲۵۰٬۰۰۰");
  assert.equal(toPersianNumber(95000), "۹۵٬۰۰۰");
});

test("formatToman appends the unit", () => {
  assert.equal(formatToman(89000000), "۸۹٬۰۰۰٬۰۰۰ تومان");
});

test("parseFaDigits strips to Latin digits (mirrors server ^09\\d{9}$ check)", () => {
  assert.equal(parseFaDigits("۰۹۱۲۳۴۵۶۷۸۹"), "09123456789");
  assert.equal(parseFaDigits("0912 345 6789"), "09123456789");
});

test("stars rounds to nearest", () => {
  assert.equal(stars(4.6), "★★★★★");
  assert.equal(stars(4.2), "★★★★☆");
  assert.equal(stars(0), "☆☆☆☆☆");
});

test("formatRating is one decimal with U+066B", () => {
  assert.equal(formatRating(4.6), "۴٫۶");
  assert.equal(formatRating(4), "۴٫۰");
});
