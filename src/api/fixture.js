/* fixture.js — the catalog, shaped like the API contract in the master prompt §4
   (snake_case, description as a paragraph array, specs flat with `group`,
   category tree exactly two levels). This is the same fixture the Design Component
   shipped; the endpoint modules read it when USE_LIVE_API is off or the network
   is unreachable, and the live API drops in behind the same endpoint signatures
   with nothing else changing (DESIGN.md §9).

   Frontend-owned, not in the live contract, kept for parity with the prototype:
   `category.blurb` (mega-panel copy) lives in fa.js instead; `image.pos`
   (object-position hint) and product `sub_slug` are marked below. */

const ASSET = (p) => new URL(`../assets/${p}`, import.meta.url).href;

// Stable ids so `category_id` links resolve and breadcrumbs work.
const CAT_ID = {
  diagnostics:  "c1a11111-0000-4000-8000-000000000001",
  consumables:  "c2a22222-0000-4000-8000-000000000002",
  rehab:        "c3a33333-0000-4000-8000-000000000003",
  homecare:     "c4a44444-0000-4000-8000-000000000004",
  clinic:       "c5a55555-0000-4000-8000-000000000005",
  accessories:  "c6a66666-0000-4000-8000-000000000006",
};

/** CategoryTree[] — active top-level categories, each with one level of children. */
export const CATEGORIES = [
  {
    id: CAT_ID.diagnostics, slug: "diagnostics", name: "تجهیزات تشخیصی",
    icon: "stethoscope", sort_order: 1, is_active: true,
    children: [
      { id: CAT_ID.diagnostics + "-1", slug: "bp", name: "فشارسنج", icon: "gauge", sort_order: 1, is_active: true, parent_id: CAT_ID.diagnostics },
      { id: CAT_ID.diagnostics + "-2", slug: "oximeter", name: "پالس اکسیمتر", icon: "pulse", sort_order: 2, is_active: true, parent_id: CAT_ID.diagnostics },
      { id: CAT_ID.diagnostics + "-3", slug: "thermometer", name: "تب‌سنج", icon: "thermometer", sort_order: 3, is_active: true, parent_id: CAT_ID.diagnostics },
    ],
  },
  {
    id: CAT_ID.consumables, slug: "consumables", name: "مصرفی و بهداشتی",
    icon: "gloves", sort_order: 2, is_active: true,
    children: [
      { id: CAT_ID.consumables + "-1", slug: "gloves", name: "دستکش معاینه", icon: "gloves", sort_order: 1, is_active: true, parent_id: CAT_ID.consumables },
      { id: CAT_ID.consumables + "-2", slug: "masks", name: "ماسک", icon: "mask", sort_order: 2, is_active: true, parent_id: CAT_ID.consumables },
      { id: CAT_ID.consumables + "-3", slug: "disinfectant", name: "محلول ضدعفونی", icon: "bottle", sort_order: 3, is_active: true, parent_id: CAT_ID.consumables },
    ],
  },
  {
    id: CAT_ID.rehab, slug: "rehab", name: "توان‌بخشی و ارتوپدی",
    icon: "walker", sort_order: 3, is_active: true,
    children: [
      { id: CAT_ID.rehab + "-1", slug: "walker", name: "واکر", icon: "walker", sort_order: 1, is_active: true, parent_id: CAT_ID.rehab },
      { id: CAT_ID.rehab + "-2", slug: "cane", name: "عصا", icon: "cane", sort_order: 2, is_active: true, parent_id: CAT_ID.rehab },
      { id: CAT_ID.rehab + "-3", slug: "knee-brace", name: "بریس زانو", icon: "brace", sort_order: 3, is_active: true, parent_id: CAT_ID.rehab },
    ],
  },
  {
    id: CAT_ID.homecare, slug: "homecare", name: "مراقبت در منزل",
    icon: "bed", sort_order: 4, is_active: true,
    children: [
      { id: CAT_ID.homecare + "-1", slug: "wheelchair", name: "ویلچر", icon: "wheelchair", sort_order: 1, is_active: true, parent_id: CAT_ID.homecare },
      { id: CAT_ID.homecare + "-2", slug: "hospital-bed", name: "تخت بیمار", icon: "bed", sort_order: 2, is_active: true, parent_id: CAT_ID.homecare },
      { id: CAT_ID.homecare + "-3", slug: "nebulizer", name: "نبولایزر", icon: "lungs", sort_order: 3, is_active: true, parent_id: CAT_ID.homecare },
    ],
  },
  {
    id: CAT_ID.clinic, slug: "clinic", name: "تجهیزات مطب و کلینیک",
    icon: "clinic", sort_order: 5, is_active: true,
    children: [
      { id: CAT_ID.clinic + "-1", slug: "exam-bed", name: "تخت معاینه", icon: "bed", sort_order: 1, is_active: true, parent_id: CAT_ID.clinic },
      { id: CAT_ID.clinic + "-2", slug: "autoclave", name: "اتوکلاو", icon: "autoclave", sort_order: 2, is_active: true, parent_id: CAT_ID.clinic },
      { id: CAT_ID.clinic + "-3", slug: "dressing-trolley", name: "ترالی پانسمان", icon: "trolley", sort_order: 3, is_active: true, parent_id: CAT_ID.clinic },
    ],
  },
  {
    id: CAT_ID.accessories, slug: "accessories", name: "لوازم جانبی",
    icon: "parts", sort_order: 6, is_active: true,
    children: [
      { id: CAT_ID.accessories + "-1", slug: "glove-cover", name: "کاور دستکش", icon: "gloves", sort_order: 1, is_active: true, parent_id: CAT_ID.accessories },
      { id: CAT_ID.accessories + "-2", slug: "battery", name: "باتری", icon: "battery", sort_order: 2, is_active: true, parent_id: CAT_ID.accessories },
      { id: CAT_ID.accessories + "-3", slug: "carry-case", name: "کیف حمل", icon: "case", sort_order: 3, is_active: true, parent_id: CAT_ID.accessories },
    ],
  },
];

// slug -> which product photo, and its object-position (prototype PNUM / POS).
const PNUM = {
  "omron-hem-6232t": 1, "beurer-po-30": 7, "microlife-mt-500": 4,
  "nitrile-gloves-m": 6, "surgical-mask-3ply": 6, "alcohol-solution-1l": 6,
  "walker-folding": 5, "cane-adjustable": 5, "knee-brace-hinged": 5,
  "wheelchair-standard": 5, "hospital-bed-2crank": 0, "nebulizer-compressor": 3,
  "exam-bed-3section": 4, "autoclave-18l": 4, "dressing-trolley": 6,
  "aaa-battery-pack": 2, "carry-case-bp": 2,
};
const POS = { 0: "58% 62%", 1: "52% 58%", 2: "68% 62%", 3: "54% 55%", 4: "76% 60%", 5: "46% 58%", 6: "72% 58%", 7: "56% 62%" };

const TECH = "مشخصات فنی", DIM = "ابعاد و وزن", CARE = "نگهداری و ایمنی";

function make(id, slug, name, brand, catSlug, subSlug, price, compare, stock, sku, rating, rc, featured, short, desc, specs) {
  const n = PNUM[slug] ?? 4;
  return {
    id, slug, name, brand,
    category_slug: catSlug,            // prototype helper; the live param is `category_slug`
    category_id: CAT_ID[catSlug],
    sub_slug: subSlug,                 // frontend-only: live API filters via child `category_slug`
    price, compare_at_price: compare, stock, sku,
    is_active: true, is_featured: featured,
    rating_avg: rating, rating_count: rc,
    short_desc: short,
    description: desc,
    images: [{ id: slug + "-img-0", url: ASSET(`products/product-${n}.jpg`), alt: name, sort_order: 0, pos: POS[n] }],
    specs: specs.map((s, i) => ({ id: slug + "-spec-" + i, group: s.group, key: s.key, value: s.value, sort_order: i })),
  };
}

export const PRODUCTS = [
  make("p1", "omron-hem-6232t", "فشارسنج مچی امرون مدل HEM-6232T", "Omron", "diagnostics", "bp", 1250000, 1490000, 3, "KMT-BP-0001", 4.6, 38, true,
    "فشارسنج مچی با حافظه ۱۰۰ اندازه‌گیری و اتصال بلوتوث به اپلیکیشن.",
    ["فشارسنج مچی امرون برای پیگیری روزانه فشار خون در منزل ساخته شده است. بازوبند مچی با یک دست بسته می‌شود و اندازه‌گیری در حدود سی ثانیه کامل می‌شود.",
     "دستگاه ضربان نامنظم قلب را تشخیص می‌دهد و نتیجه را با نشانگر جداگانه گزارش می‌کند. حافظه دستگاه صد اندازه‌گیری آخر را با تاریخ نگه می‌دارد.",
     "برای بیمارانی که پزشک پیگیری روزانه تجویز کرده، امکان انتقال داده‌ها به تلفن همراه و ساختن نمودار هفتگی فراهم است."],
    [{ group: TECH, key: "روش اندازه‌گیری", value: "اسیلومتریک" }, { group: TECH, key: "محدوده فشار", value: "۰ تا ۲۹۹ میلی‌متر جیوه" }, { group: TECH, key: "دقت", value: "± ۳ میلی‌متر جیوه" }, { group: TECH, key: "حافظه", value: "۱۰۰ اندازه‌گیری" }, { group: TECH, key: "منبع تغذیه", value: "دو باتری قلمی AAA" },
     { group: DIM, key: "دور مچ قابل استفاده", value: "۱۳٫۵ تا ۲۱٫۵ سانتی‌متر" }, { group: DIM, key: "وزن", value: "۱۱۰ گرم" }, { group: DIM, key: "ابعاد", value: "۹۰ × ۶۰ × ۲۰ میلی‌متر" },
     { group: CARE, key: "دمای نگهداری", value: "منفی ۲۰ تا ۶۰ درجه سلسیوس" }, { group: CARE, key: "کد IRC", value: "۱۲۸۹۷۶۵۴۳۲۱۰" }]),

  make("p2", "beurer-po-30", "پالس اکسیمتر انگشتی بیورر PO 30", "Beurer", "diagnostics", "oximeter", 890000, null, 12, "KMT-OX-0002", 4.4, 52, true,
    "اندازه‌گیری اشباع اکسیژن خون و ضربان قلب با نمایشگر رنگی.",
    ["پالس اکسیمتر انگشتی بیورر درصد اشباع اکسیژن خون و ضربان قلب را در چند ثانیه نشان می‌دهد و برای پیگیری بیماران تنفسی در منزل مناسب است.",
     "نمایشگر رنگی چهار جهت چرخش دارد تا خواندن عدد برای فرد اندازه‌گیرنده و همراه او آسان باشد."],
    [{ group: TECH, key: "محدوده SpO₂", value: "۷۰ تا ۱۰۰ درصد" }, { group: TECH, key: "محدوده ضربان", value: "۳۰ تا ۲۵۰ ضربه در دقیقه" }, { group: TECH, key: "نمایشگر", value: "OLED رنگی" },
     { group: DIM, key: "وزن", value: "۵۶ گرم با باتری" }, { group: CARE, key: "کد IRC", value: "۱۲۸۹۷۶۵۴۴۱۰۲" }]),

  make("p3", "microlife-mt-500", "تب‌سنج دیجیتال مایکرولایف MT 500", "Microlife", "diagnostics", "thermometer", 320000, null, 0, "KMT-TH-0003", 4.2, 17, false,
    "تب‌سنج دیجیتال با نوک انعطاف‌پذیر و هشدار صوتی تب.",
    ["تب‌سنج دیجیتال مایکرولایف اندازه‌گیری را در حدود شصت ثانیه کامل می‌کند و پایان کار را با بوق اعلام می‌کند.",
     "نوک انعطاف‌پذیر برای استفاده در کودکان طراحی شده و بدنه ضد آب است."],
    [{ group: TECH, key: "محدوده اندازه‌گیری", value: "۳۲ تا ۴۳٫۹ درجه سلسیوس" }, { group: TECH, key: "دقت", value: "± ۰٫۱ درجه سلسیوس" }, { group: CARE, key: "ضد آب", value: "بله، قابل شست‌وشو" }]),

  make("p4", "nitrile-gloves-m", "دستکش معاینه نیتریل بدون پودر سایز M — جعبه ۱۰۰ عددی", "ChoiceMMed", "consumables", "gloves", 420000, 480000, 40, "KMT-GL-0004", 4.5, 64, true,
    "دستکش نیتریل بدون پودر، بسته صد عددی برای مصرف روزانه مطب.",
    ["دستکش نیتریل بدون پودر برای معاینه و کارهای درمانی روزمره مناسب است و حساسیت لاتکس ایجاد نمی‌کند.",
     "ضخامت یکنواخت و کشش مناسب، حس لامسه را در کارهای دقیق حفظ می‌کند."],
    [{ group: TECH, key: "جنس", value: "نیتریل بدون پودر" }, { group: TECH, key: "تعداد در بسته", value: "۱۰۰ عدد" }, { group: TECH, key: "سایز", value: "M" },
     { group: CARE, key: "وضعیت سترون", value: "غیر سترون — مخصوص معاینه" }, { group: CARE, key: "تاریخ انقضا", value: "۳۶ ماه از تاریخ تولید" }, { group: CARE, key: "شرایط نگهداری", value: "دور از نور مستقیم، زیر ۳۰ درجه" }]),

  make("p5", "surgical-mask-3ply", "ماسک سه‌لایه جراحی — بسته ۵۰ عددی", "ChoiceMMed", "consumables", "masks", 180000, null, 120, "KMT-MK-0005", 4.1, 89, false,
    "ماسک سه‌لایه با گیره بینی و کشش گوشی نرم.",
    ["ماسک سه‌لایه جراحی با لایه میانی ملت‌بلون، برای استفاده روزانه در محیط درمانی ساخته شده است."],
    [{ group: TECH, key: "تعداد لایه", value: "سه لایه" }, { group: TECH, key: "تعداد در بسته", value: "۵۰ عدد" }, { group: CARE, key: "وضعیت سترون", value: "غیر سترون" }, { group: CARE, key: "مصرف", value: "یک‌بار مصرف" }]),

  make("p6", "alcohol-solution-1l", "محلول ضدعفونی سطوح — گالن یک لیتری", "ChoiceMMed", "consumables", "disinfectant", 260000, null, 25, "KMT-DS-0006", 4.3, 31, false,
    "محلول آماده مصرف برای ضدعفونی سطوح و تجهیزات.",
    ["محلول ضدعفونی سطوح، آماده مصرف و بدون نیاز به رقیق‌سازی، برای تجهیزات و سطوح اتاق درمان."],
    [{ group: TECH, key: "حجم", value: "۱۰۰۰ میلی‌لیتر" }, { group: TECH, key: "ماده مؤثر", value: "اتانول ۷۰ درصد" }, { group: CARE, key: "شرایط نگهداری", value: "دور از شعله و حرارت" }, { group: CARE, key: "تاریخ انقضا", value: "۲۴ ماه" }]),

  make("p7", "walker-folding", "واکر تاشو بزرگسال با پایه لاستیکی", "Microlife", "rehab", "walker", 1850000, 2100000, 6, "KMT-WK-0007", 4.7, 23, true,
    "واکر آلومینیومی تاشو با ارتفاع قابل تنظیم در هشت پله.",
    ["واکر تاشو آلومینیومی برای دوره بازتوانی پس از جراحی و راه‌رفتن با تکیه‌گاه طراحی شده است.",
     "ارتفاع در هشت پله تنظیم می‌شود و پایه‌های لاستیکی روی سطوح صیقلی سُر نمی‌خورند."],
    [{ group: TECH, key: "جنس بدنه", value: "آلومینیوم آنودایز" }, { group: TECH, key: "تنظیم ارتفاع", value: "۸ پله" }, { group: TECH, key: "حداکثر وزن تحمل", value: "۱۰۰ کیلوگرم" },
     { group: DIM, key: "ارتفاع", value: "۸۰ تا ۹۵ سانتی‌متر" }, { group: DIM, key: "وزن", value: "۲٫۴ کیلوگرم" }]),

  make("p8", "cane-adjustable", "عصای دستی قابل تنظیم با دسته ارگونومیک", "Microlife", "rehab", "cane", 560000, null, 14, "KMT-CN-0008", 4.0, 19, false,
    "عصای سبک با ارتفاع قابل تنظیم و دسته ضد لغزش.",
    ["عصای دستی آلومینیومی با دسته ارگونومیک، برای پشتیبانی سبک در راه‌رفتن روزانه."],
    [{ group: TECH, key: "جنس", value: "آلومینیوم" }, { group: TECH, key: "حداکثر وزن تحمل", value: "۹۰ کیلوگرم" }, { group: DIM, key: "ارتفاع", value: "۷۵ تا ۹۸ سانتی‌متر" }, { group: DIM, key: "وزن", value: "۴۲۰ گرم" }]),

  make("p9", "knee-brace-hinged", "بریس زانو مفصل‌دار سایز L", "Beurer", "rehab", "knee-brace", 1320000, null, 2, "KMT-KB-0009", 4.4, 27, false,
    "بریس زانو با مفصل فلزی و بندهای قابل تنظیم.",
    ["بریس زانو مفصل‌دار برای دوره پس از آسیب رباط و کنترل دامنه حرکت زانو استفاده می‌شود.",
     "بندهای قابل تنظیم فشار را روی ساق و ران پخش می‌کنند تا در استفاده طولانی آزار ندهد."],
    [{ group: TECH, key: "نوع مفصل", value: "فلزی دو طرفه" }, { group: TECH, key: "سایز", value: "L — دور زانو ۴۰ تا ۴۵ سانتی‌متر" }, { group: CARE, key: "شست‌وشو", value: "با دست، آب سرد" }]),

  make("p10", "wheelchair-standard", "ویلچر استاندارد تاشو با تشک ضد زخم", "Microlife", "homecare", "wheelchair", 6800000, 7600000, 4, "KMT-WC-0010", 4.6, 41, true,
    "ویلچر تاشو با چرخ بزرگ عقب و ترمز دستی دو طرفه.",
    ["ویلچر استاندارد تاشو برای جابه‌جایی روزانه بیمار در منزل و بیرون از خانه ساخته شده است.",
     "تشک ضد زخم فشار را روی نشیمن پخش می‌کند و برای نشستن طولانی مناسب‌تر است.",
     "ویلچر تاشو در صندوق خودروی سواری جا می‌گیرد."],
    [{ group: TECH, key: "جنس بدنه", value: "فولاد رنگ‌شده" }, { group: TECH, key: "حداکثر وزن تحمل", value: "۱۰۰ کیلوگرم" }, { group: TECH, key: "ترمز", value: "دستی دو طرفه" },
     { group: DIM, key: "عرض نشیمن", value: "۴۵ سانتی‌متر" }, { group: DIM, key: "وزن", value: "۱۵٫۵ کیلوگرم" }]),

  make("p11", "hospital-bed-2crank", "تخت بیمار دو شکن با جک مکانیکی", "Microlife", "homecare", "hospital-bed", 24500000, null, 1, "KMT-HB-0011", 4.8, 12, true,
    "تخت بیمار دو شکن با نرده کنار و چرخ ترمزدار.",
    ["تخت بیمار دو شکن با جک مکانیکی، برای نگهداری بلندمدت بیمار در منزل. زاویه سر و پا جداگانه تنظیم می‌شود.",
     "نرده‌های کنار جمع می‌شوند و چرخ‌های ترمزدار جابه‌جایی تخت را ممکن می‌کنند."],
    [{ group: TECH, key: "تعداد شکن", value: "دو شکن" }, { group: TECH, key: "مکانیزم", value: "جک مکانیکی دستی" }, { group: TECH, key: "حداکثر وزن تحمل", value: "۱۵۰ کیلوگرم" },
     { group: DIM, key: "ابعاد تشک", value: "۱۹۰ × ۹۰ سانتی‌متر" }, { group: DIM, key: "وزن", value: "۷۸ کیلوگرم" }]),

  make("p12", "nebulizer-compressor", "نبولایزر کمپرسوری خانگی", "Omron", "homecare", "nebulizer", 2350000, 2690000, 8, "KMT-NB-0012", 4.5, 35, false,
    "نبولایزر کمپرسوری با ماسک بزرگسال و کودک.",
    ["نبولایزر کمپرسوری دارو را به ذرات ریز تبدیل می‌کند و برای درمان تنفسی کودکان و بزرگسالان در منزل کاربرد دارد.",
     "ماسک بزرگسال و کودک همراه دستگاه ارائه می‌شود."],
    [{ group: TECH, key: "اندازه ذرات", value: "میانگین ۳ میکرون" }, { group: TECH, key: "سرعت نبولیزاسیون", value: "۰٫۳ میلی‌لیتر در دقیقه" }, { group: TECH, key: "ظرفیت مخزن", value: "۷ میلی‌لیتر" },
     { group: CARE, key: "شست‌وشوی مخزن", value: "پس از هر استفاده با آب جوش" }]),

  make("p13", "exam-bed-3section", "تخت معاینه سه تکه با روکش چرم طبی", "Microlife", "clinic", "exam-bed", 18900000, null, 2, "KMT-EB-0013", 4.7, 9, true,
    "تخت معاینه سه تکه با تنظیم پشتی و پایه فولادی.",
    ["تخت معاینه سه تکه با روکش چرم طبی قابل ضدعفونی، برای اتاق معاینه پزشک عمومی و متخصص.",
     "پشتی و بخش پا جداگانه تنظیم می‌شوند و اسکلت فولادی برای استفاده روزانه دوام دارد."],
    [{ group: TECH, key: "تعداد بخش", value: "سه تکه" }, { group: TECH, key: "روکش", value: "چرم طبی ضد آب" }, { group: DIM, key: "ابعاد", value: "۱۸۵ × ۶۰ سانتی‌متر" }, { group: DIM, key: "وزن", value: "۴۲ کیلوگرم" },
     { group: CARE, key: "ضدعفونی روکش", value: "با محلول الکلی، بدون سایش" }]),

  make("p14", "autoclave-18l", "اتوکلاو رومیزی ۱۸ لیتری کلاس B", "Beurer", "clinic", "autoclave", 89000000, null, 1, "KMT-AC-0014", 4.9, 7, true,
    "اتوکلاو کلاس B با پیش‌خلأ سه مرحله‌ای و چاپگر گزارش.",
    ["اتوکلاو رومیزی هجده لیتری کلاس B برای سترون‌سازی ابزار بسته‌بندی‌شده و توخالی در مطب دندان‌پزشکی و درمانگاه.",
     "پیش‌خلأ سه مرحله‌ای هوا را از محفظه و لومن ابزار خارج می‌کند تا بخار به تمام سطوح برسد.",
     "گزارش هر سیکل چاپ می‌شود و برای مستندسازی کنترل عفونت نگه‌داشتنی است."],
    [{ group: TECH, key: "کلاس", value: "B — مطابق EN 13060" }, { group: TECH, key: "حجم محفظه", value: "۱۸ لیتر" }, { group: TECH, key: "دمای سیکل", value: "۱۲۱ و ۱۳۴ درجه سلسیوس" }, { group: TECH, key: "توان", value: "۲۲۰ ولت — ۲۰۰۰ وات" },
     { group: DIM, key: "ابعاد", value: "۴۵ × ۶۰ × ۴۰ سانتی‌متر" }, { group: DIM, key: "وزن", value: "۵۵ کیلوگرم" },
     { group: CARE, key: "وضعیت سترون", value: "سترون‌ساز — تأیید سیکل با نشانگر شیمیایی" }, { group: CARE, key: "کد IRC", value: "۱۲۸۹۷۶۵۵۰۹۸۷" }]),

  make("p15", "dressing-trolley", "ترالی پانسمان دو طبقه استیل", "Microlife", "clinic", "dressing-trolley", 7400000, 8200000, 3, "KMT-DT-0015", 4.4, 11, false,
    "ترالی استیل دو طبقه با چرخ ترمزدار و سطل ضایعات.",
    ["ترالی پانسمان دو طبقه از استیل ضد زنگ، برای حمل ابزار و مواد پانسمان بین تخت‌ها."],
    [{ group: TECH, key: "جنس", value: "استیل ضد زنگ ۳۰۴" }, { group: TECH, key: "تعداد طبقه", value: "دو طبقه" }, { group: DIM, key: "ابعاد", value: "۷۵ × ۴۵ × ۸۵ سانتی‌متر" }, { group: CARE, key: "ضدعفونی", value: "قابل شست‌وشو با محلول کلره" }]),

  make("p16", "aaa-battery-pack", "باتری قلمی AAA آلکالاین — بسته ۴ عددی", "Omron", "accessories", "battery", 95000, null, 60, "KMT-BT-0016", 3.9, 44, false,
    "باتری آلکالاین مخصوص فشارسنج و تب‌سنج دیجیتال.",
    ["باتری آلکالاین AAA برای فشارسنج، تب‌سنج و پالس اکسیمتر دیجیتال؛ بسته چهار عددی."],
    [{ group: TECH, key: "نوع", value: "آلکالاین AAA" }, { group: TECH, key: "ولتاژ", value: "۱٫۵ ولت" }, { group: TECH, key: "تعداد در بسته", value: "۴ عدد" }, { group: CARE, key: "تاریخ انقضا", value: "۵ سال از تاریخ تولید" }]),

  make("p17", "carry-case-bp", "کیف حمل فشارسنج با فوم ضربه‌گیر", "Omron", "accessories", "carry-case", 185000, null, 22, "KMT-CC-0017", 4.0, 15, false,
    "کیف نیم‌سخت با فوم داخلی برای حمل فشارسنج.",
    ["کیف حمل نیم‌سخت با فوم ضربه‌گیر، برای جابه‌جایی فشارسنج بازویی و مچی بین منزل و مطب."],
    [{ group: TECH, key: "جنس", value: "پارچه پلی‌استر با قاب EVA" }, { group: DIM, key: "ابعاد داخلی", value: "۲۰ × ۱۴ × ۸ سانتی‌متر" }, { group: DIM, key: "وزن", value: "۲۱۰ گرم" }]),
];

/** GET /settings/ */
export const SETTINGS = {
  shipping: { mode: "flat", cost: 50000, free_over: 1000000 },
  contact: {
    phone: "021-88776655",
    whatsapp: "989121234567",
    telegram: "karamadmed",
    address: "تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۲۴۱۰، طبقه سوم، واحد ۹",
  },
  social: { telegram: "karamadmed", instagram: "karamadmed", youtube: null, aparat: "karamadmed" },
  hero_slides: [
    {
      id: "s1",
      kicker: "تجهیزات مطب و کلینیک",          // frontend-only: live hero_slides has no `kicker`
      title: "یک اتاق درمان را کامل تجهیز کنید",
      highlight: "تخت معاینه، اتوکلاو کلاس B و ترالی پانسمان — با فاکتور رسمی و نصب.",
      cta_label: "دیدن تجهیزات مطب", cta_href: "clinic",
      image_alt: "ابزار معاینه، گوشی پزشکی، تب‌سنج و دستکش روی میز اتاق درمان",
      image: ASSET("hero/hero-1.png"),        // frontend-owned, keyed by slide id
    },
    {
      id: "s2",
      kicker: "مراقبت در منزل",
      title: "مراقبت از پدر و مادر، در خانه",
      highlight: "ویلچر، تخت بیمار و نبولایزر با مشاوره تلفنی پیش از خرید.",
      cta_label: "دیدن کالاهای مراقبت در منزل", cta_href: "homecare",
      image_alt: "فشارسنج، پالس اکسیمتر و لوازم مراقبت روی میز اتاق خواب",
      image: ASSET("hero/hero-2.jpg"),
    },
    {
      id: "s3",
      kicker: "مصرفی و بهداشتی",
      title: "مصرفی ماه بعد را امروز بخرید",
      highlight: "دستکش، ماسک و محلول ضدعفونی به قیمت جعبه‌ای برای مطب و درمانگاه.",
      cta_label: "دیدن کالاهای مصرفی", cta_href: "consumables",
      image_alt: "دستکش نیتریل، ماسک، گاز و سرنگ چیده‌شده روی سطح روشن",
      image: ASSET("hero/hero-3.jpg"),
    },
  ],
};

export const PLACEHOLDER_IMG = ASSET("products/product-4.jpg");
