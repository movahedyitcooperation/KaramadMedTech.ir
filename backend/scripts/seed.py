"""Idempotent seed script — transcribes the Next.js frontend's mock catalog
(lib/mock/{categories,products,settings}.ts) into Postgres via the real
SQLAlchemy models. Safe to re-run any time: every row is upserted by its
natural key (slug for categories/products, key for settings), so re-running
never mints new UUIDs for existing rows and just refreshes their fields.

Not run automatically by anything — invoke explicitly with:
    uv run python scripts/seed.py
"""

import asyncio
import uuid
from typing import Any

from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.category import Category
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_spec import ProductSpec
from app.models.settings import Setting


def _images(prefix: str, alt: str) -> list[dict[str, Any]]:
    """Mirrors the frontend's images(prefix, alt) helper in lib/mock/products.ts."""
    return [
        {"url": f"/images/placeholders/{prefix}-1.svg", "alt": alt, "sort_order": 1},
        {"url": f"/images/placeholders/{prefix}-2.svg", "alt": alt, "sort_order": 2},
    ]


# --- source data, transcribed 1:1 from lib/mock/categories.ts ------------------
# `old_id`/`parent_old_id` are the frontend's string ids (e.g. "cat-diagnostic"),
# kept here purely as an in-script lookup key — they are never persisted, since
# Category.id is a server-generated UUID.
CATEGORIES: list[dict[str, Any]] = [
    {"old_id": "cat-diagnostic", "slug": "tajhizat-tashkhisi", "name": "تجهیزات تشخیصی",
     "icon": "Stethoscope", "parent_old_id": None, "sort_order": 1, "is_active": True},
    {"old_id": "cat-diagnostic-bp", "slug": "fesharsanj", "name": "فشارسنج",
     "icon": "Heartbeat", "parent_old_id": "cat-diagnostic", "sort_order": 1, "is_active": True},
    {"old_id": "cat-diagnostic-oximeter", "slug": "pulse-oximeter", "name": "پالس اکسیمتر",
     "icon": "Pulse", "parent_old_id": "cat-diagnostic", "sort_order": 2, "is_active": True},
    {"old_id": "cat-diagnostic-thermometer", "slug": "tabsanj", "name": "تب‌سنج",
     "icon": "Thermometer", "parent_old_id": "cat-diagnostic", "sort_order": 3, "is_active": True},

    {"old_id": "cat-consumables", "slug": "masrafi-behdashti", "name": "مصرفی و بهداشتی",
     "icon": "FirstAidKit", "parent_old_id": None, "sort_order": 2, "is_active": True},
    {"old_id": "cat-consumables-gloves", "slug": "dastkesh-moayene", "name": "دستکش معاینه",
     "icon": "HandPalm", "parent_old_id": "cat-consumables", "sort_order": 1, "is_active": True},
    {"old_id": "cat-consumables-masks", "slug": "mask", "name": "ماسک",
     "icon": "MaskHappy", "parent_old_id": "cat-consumables", "sort_order": 2, "is_active": True},
    {"old_id": "cat-consumables-antiseptic", "slug": "mahlol-zedeofooni", "name": "محلول ضدعفونی",
     "icon": "Drop", "parent_old_id": "cat-consumables", "sort_order": 3, "is_active": True},

    {"old_id": "cat-rehab", "slug": "tavanbakhshi-ortopedi", "name": "توانبخشی و ارتوپدی",
     "icon": "PersonSimpleWalk", "parent_old_id": None, "sort_order": 3, "is_active": True},
    {"old_id": "cat-rehab-walker", "slug": "walker", "name": "واکر",
     "icon": "PersonSimpleWalk", "parent_old_id": "cat-rehab", "sort_order": 1, "is_active": True},
    {"old_id": "cat-rehab-cane", "slug": "asa", "name": "عصا",
     "icon": "Umbrella", "parent_old_id": "cat-rehab", "sort_order": 2, "is_active": True},
    {"old_id": "cat-rehab-knee-brace", "slug": "bris-zanoo", "name": "بریس زانو",
     "icon": "Bandaids", "parent_old_id": "cat-rehab", "sort_order": 3, "is_active": True},

    {"old_id": "cat-home-care", "slug": "moraghebat-dar-manzel", "name": "مراقبت در منزل",
     "icon": "House", "parent_old_id": None, "sort_order": 4, "is_active": True},
    {"old_id": "cat-home-care-wheelchair", "slug": "vilchair", "name": "ویلچر",
     "icon": "Wheelchair", "parent_old_id": "cat-home-care", "sort_order": 1, "is_active": True},
    {"old_id": "cat-home-care-bed", "slug": "takht-bimar", "name": "تخت بیمار خانگی",
     "icon": "Bed", "parent_old_id": "cat-home-care", "sort_order": 2, "is_active": True},
    {"old_id": "cat-home-care-nebulizer", "slug": "nebulizer", "name": "نبولایزر",
     "icon": "Wind", "parent_old_id": "cat-home-care", "sort_order": 3, "is_active": True},

    {"old_id": "cat-clinic", "slug": "tajhizat-matb-clinic", "name": "تجهیزات مطب و کلینیک",
     "icon": "Buildings", "parent_old_id": None, "sort_order": 5, "is_active": True},
    {"old_id": "cat-clinic-table", "slug": "takht-moayene", "name": "تخت معاینه",
     "icon": "Bed", "parent_old_id": "cat-clinic", "sort_order": 1, "is_active": True},
    {"old_id": "cat-clinic-autoclave", "slug": "autoclave", "name": "اتوکلاو",
     "icon": "Cube", "parent_old_id": "cat-clinic", "sort_order": 2, "is_active": True},
    {"old_id": "cat-clinic-trolley", "slug": "trolley-pansman", "name": "ترالی پانسمان",
     "icon": "Toolbox", "parent_old_id": "cat-clinic", "sort_order": 3, "is_active": True},

    {"old_id": "cat-accessories", "slug": "lavazem-janebi", "name": "لوازم جانبی",
     "icon": "Package", "parent_old_id": None, "sort_order": 6, "is_active": True},
    {"old_id": "cat-accessories-glove-cover", "slug": "cover-dastkesh", "name": "کاور دستکش",
     "icon": "HandPalm", "parent_old_id": "cat-accessories", "sort_order": 1, "is_active": True},
    {"old_id": "cat-accessories-battery", "slug": "batri-dastgah", "name": "باتری دستگاه",
     "icon": "BatteryFull", "parent_old_id": "cat-accessories", "sort_order": 2, "is_active": True},
    {"old_id": "cat-accessories-case", "slug": "kif-haml", "name": "کیف حمل",
     "icon": "Bag", "parent_old_id": "cat-accessories", "sort_order": 3, "is_active": True},
]

# --- source data, transcribed 1:1 from lib/mock/products.ts --------------------
PRODUCTS: list[dict[str, Any]] = [
    {
        "old_id": "prod-bp-omron", "slug": "fesharsanj-digital-mochi-omron",
        "name": "فشارسنج دیجیتال مچی امرن", "brand": "Omron",
        "short_desc": "فشارسنج دیجیتال مچی با نمایشگر بزرگ و حافظه دوکاربره",
        "description": [
            "فشارسنج دیجیتال مچی امرن با استفاده از فناوری اندازه‌گیری اسیلومتریک، فشار خون و ضربان قلب را با دقت بالا نمایش می‌دهد.",
            "مناسب برای استفاده روزانه در منزل، دارای حافظه ذخیره‌سازی برای دو کاربر و هشدار آریتمی قلبی است.",
        ],
        "price": 1250000, "compare_at_price": 1450000, "stock": 24, "sku": "KMT-BP-0001",
        "is_active": True, "is_featured": True, "category_old_id": "cat-diagnostic-bp",
        "rating_avg": 4.6, "rating_count": 128,
        "images": _images("diagnostic", "فشارسنج دیجیتال مچی امرن"),
        "specs": [
            {"group": "مشخصات فنی", "key": "روش اندازه‌گیری", "value": "اسیلومتریک", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "محدوده اندازه‌گیری فشار", "value": "۰ تا ۲۹۹ میلی‌متر جیوه", "sort_order": 2},
            {"group": "مشخصات فنی", "key": "حافظه", "value": "دو کاربره، ۳۰ رکورد", "sort_order": 3},
            {"group": "ابعاد و وزن", "key": "منبع تغذیه", "value": "۲ عدد باتری AAA", "sort_order": 4},
            {"group": "ابعاد و وزن", "key": "وزن", "value": "۱۱۰ گرم", "sort_order": 5},
        ],
    },
    {
        "old_id": "prod-bp-beurer", "slug": "fesharsanj-digital-bazoo-beurer",
        "name": "فشارسنج دیجیتال بازویی بیورر", "brand": "Beurer",
        "short_desc": "فشارسنج بازویی با کاف بزرگ و تشخیص فشار خون بالا",
        "description": [
            "فشارسنج بازویی بیورر با کاف قابل تنظیم برای بازوهای ۲۲ تا ۴۲ سانتی‌متر، مناسب استفاده خانگی و کلینیکی.",
            "دارای نمایشگر بزرگ و سیستم هشدار در صورت ثبت فشار خون بالا.",
        ],
        "price": 2180000, "compare_at_price": None, "stock": 12, "sku": "KMT-BP-0002",
        "is_active": True, "is_featured": False, "category_old_id": "cat-diagnostic-bp",
        "rating_avg": 4.4, "rating_count": 64,
        "images": _images("diagnostic", "فشارسنج دیجیتال بازویی بیورر"),
        "specs": [
            {"group": "مشخصات فنی", "key": "روش اندازه‌گیری", "value": "اسیلومتریک", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "اندازه کاف", "value": "۲۲ تا ۴۲ سانتی‌متر", "sort_order": 2},
            {"group": "مشخصات فنی", "key": "حافظه", "value": "دو کاربره، ۶۰ رکورد", "sort_order": 3},
            {"group": "ابعاد و وزن", "key": "منبع تغذیه", "value": "آداپتور یا ۴ باتری AA", "sort_order": 4},
        ],
    },
    {
        "old_id": "prod-oximeter", "slug": "pulse-oximeter-angoshti-choicemmed",
        "name": "پالس اکسیمتر انگشتی چوسان", "brand": "Choicemmed",
        "short_desc": "اندازه‌گیری اشباع اکسیژن خون و ضربان قلب در چند ثانیه",
        "description": [
            "پالس اکسیمتر انگشتی چوسان با صفحه نمایش OLED، درصد اشباع اکسیژن (SpO2) و ضربان قلب را به سرعت نمایش می‌دهد.",
            "طراحی سبک و جمع‌وجور، مناسب استفاده در منزل و مراکز درمانی.",
        ],
        "price": 650000, "compare_at_price": 780000, "stock": 40, "sku": "KMT-OX-0001",
        "is_active": True, "is_featured": True, "category_old_id": "cat-diagnostic-oximeter",
        "rating_avg": 4.7, "rating_count": 212,
        "images": _images("diagnostic", "پالس اکسیمتر انگشتی چوسان"),
        "specs": [
            {"group": "مشخصات فنی", "key": "محدوده SpO2", "value": "۰ تا ۱۰۰ درصد", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "محدوده ضربان قلب", "value": "۳۰ تا ۲۵۰ ضربه در دقیقه", "sort_order": 2},
            {"group": "مشخصات فنی", "key": "نمایشگر", "value": "OLED رنگی", "sort_order": 3},
            {"group": "ابعاد و وزن", "key": "منبع تغذیه", "value": "۲ عدد باتری AAA", "sort_order": 4},
        ],
    },
    {
        "old_id": "prod-thermometer", "slug": "tabsanj-gheyre-tamasi-microlife",
        "name": "تب‌سنج غیرتماسی مایکرولایف", "brand": "Microlife",
        "short_desc": "اندازه‌گیری دمای بدن در یک ثانیه بدون تماس",
        "description": [
            "تب‌سنج غیرتماسی مایکرولایف با فناوری اینفرارد، دمای بدن، اشیا و محیط را در کمتر از یک ثانیه اندازه‌گیری می‌کند.",
            "مناسب برای نوزادان، کودکان و بزرگسالان با هشدار صوتی تب بالا.",
        ],
        "price": 890000, "compare_at_price": None, "stock": 18, "sku": "KMT-TH-0001",
        "is_active": True, "is_featured": False, "category_old_id": "cat-diagnostic-thermometer",
        "rating_avg": 4.5, "rating_count": 96,
        "images": _images("diagnostic", "تب‌سنج غیرتماسی مایکرولایف"),
        "specs": [
            {"group": "مشخصات فنی", "key": "زمان اندازه‌گیری", "value": "کمتر از ۱ ثانیه", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "حالت‌ها", "value": "بدن / اشیا / محیط", "sort_order": 2},
            {"group": "مشخصات فنی", "key": "حافظه", "value": "۳۰ رکورد", "sort_order": 3},
        ],
    },
    {
        "old_id": "prod-gloves", "slug": "dastkesh-moayene-nitril-venix-100",
        "name": "دستکش معاینه نیتریل ونیکس (بسته ۱۰۰ عددی)", "brand": "Venix",
        "short_desc": "دستکش معاینه نیتریل بدون پودر، مقاوم و ضدحساسیت",
        "description": [
            "دستکش معاینه نیتریل ونیکس، بدون پودر و بدون لاتکس، مناسب برای مراکز درمانی و استفاده شخصی.",
            "مقاومت بالا در برابر پارگی و مواد شیمیایی رایج.",
        ],
        "price": 185000, "compare_at_price": 210000, "stock": 200, "sku": "KMT-GL-0001",
        "is_active": True, "is_featured": True, "category_old_id": "cat-consumables-gloves",
        "rating_avg": 4.3, "rating_count": 341,
        "images": _images("consumables", "دستکش معاینه نیتریل ونیکس"),
        "specs": [
            {"group": "مشخصات فنی", "key": "جنس", "value": "نیتریل، بدون پودر", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "تعداد در بسته", "value": "۱۰۰ عدد", "sort_order": 2},
            {"group": "مشخصات فنی", "key": "سایزبندی", "value": "S, M, L", "sort_order": 3},
        ],
    },
    {
        "old_id": "prod-masks", "slug": "mask-se-laye-jarrahi-50",
        "name": "ماسک سه‌لایه جراحی (بسته ۵۰ عددی)", "brand": "MedShield",
        "short_desc": "ماسک سه‌لایه یکبار مصرف با فیلتراسیون بالا",
        "description": [
            "ماسک سه‌لایه جراحی با لایه فیلتر ملت‌بلون، مناسب استفاده روزانه و مراکز درمانی.",
            "بند کشی نرم و بدون آلرژی، تنفس راحت.",
        ],
        "price": 95000, "compare_at_price": None, "stock": 500, "sku": "KMT-MS-0001",
        "is_active": True, "is_featured": False, "category_old_id": "cat-consumables-masks",
        "rating_avg": 4.2, "rating_count": 189,
        "images": _images("consumables", "ماسک سه‌لایه جراحی"),
        "specs": [
            {"group": "مشخصات فنی", "key": "تعداد لایه", "value": "۳ لایه", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "تعداد در بسته", "value": "۵۰ عدد", "sort_order": 2},
            {"group": "مشخصات فنی", "key": "نوع بند", "value": "گوشی، کشی", "sort_order": 3},
        ],
    },
    {
        "old_id": "prod-antiseptic", "slug": "mahlol-zedeofooni-dast-setascrub-500",
        "name": "محلول ضدعفونی دست ست‌اسکراب (۵۰۰ میلی‌لیتر)", "brand": "SetaScrub",
        "short_desc": "ضدعفونی‌کننده الکلی دست با فرمول مرطوب‌کننده",
        "description": [
            "محلول ضدعفونی دست بر پایه الکل، از رشد باکتری و ویروس جلوگیری کرده و پوست دست را مرطوب نگه می‌دارد.",
        ],
        "price": 120000, "compare_at_price": None, "stock": 150, "sku": "KMT-AS-0001",
        "is_active": True, "is_featured": False, "category_old_id": "cat-consumables-antiseptic",
        "rating_avg": 4.4, "rating_count": 87,
        "images": _images("consumables", "محلول ضدعفونی دست ست‌اسکراب"),
        "specs": [
            {"group": "مشخصات فنی", "key": "حجم", "value": "۵۰۰ میلی‌لیتر", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "درصد الکل", "value": "۷۰ درصد", "sort_order": 2},
        ],
    },
    {
        "old_id": "prod-walker", "slug": "walker-tashi-charkhdar-bozorgsal",
        "name": "واکر تاشو چرخ‌دار بزرگسال", "brand": "KaramadCare",
        "short_desc": "واکر تاشو با دو چرخ جلو و ارتفاع قابل تنظیم",
        "description": [
            "واکر تاشو چرخ‌دار مناسب سالمندان و بیماران در دوره نقاهت، با قابلیت تاشدن سریع برای حمل و نقل آسان.",
            "ارتفاع قابل تنظیم در ۶ سطح متناسب با قد کاربر.",
        ],
        "price": 1650000, "compare_at_price": 1890000, "stock": 15, "sku": "KMT-WK-0001",
        "is_active": True, "is_featured": True, "category_old_id": "cat-rehab-walker",
        "rating_avg": 4.6, "rating_count": 73,
        "images": _images("rehab", "واکر تاشو چرخ‌دار بزرگسال"),
        "specs": [
            {"group": "مشخصات فنی", "key": "جنس بدنه", "value": "آلومینیوم", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "حداکثر وزن قابل تحمل", "value": "۱۳۰ کیلوگرم", "sort_order": 2},
            {"group": "ابعاد و وزن", "key": "ارتفاع قابل تنظیم", "value": "۶ سطح", "sort_order": 3},
            {"group": "ابعاد و وزن", "key": "وزن دستگاه", "value": "۳.۲ کیلوگرم", "sort_order": 4},
        ],
    },
    {
        "old_id": "prod-cane", "slug": "asa-zir-baghal-aluminiomi",
        "name": "عصا زیر بغل آلومینیومی", "brand": "KaramadCare",
        "short_desc": "عصای زیر بغل سبک با ارتفاع قابل تنظیم",
        "description": [
            "عصای زیر بغل آلومینیومی با دسته اسفنجی راحت و تنظیم ارتفاع در چند سطح، مناسب دوران نقاهت پس از جراحی.",
        ],
        "price": 420000, "compare_at_price": None, "stock": 60, "sku": "KMT-CN-0001",
        "is_active": True, "is_featured": False, "category_old_id": "cat-rehab-cane",
        "rating_avg": 4.1, "rating_count": 45,
        "images": _images("rehab", "عصا زیر بغل آلومینیومی"),
        "specs": [
            {"group": "مشخصات فنی", "key": "جنس", "value": "آلومینیوم", "sort_order": 1},
            {"group": "ابعاد و وزن", "key": "حداکثر وزن قابل تحمل", "value": "۱۰۰ کیلوگرم", "sort_order": 2},
        ],
    },
    {
        "old_id": "prod-knee-brace", "slug": "bris-zanoo-neopren-tanzimpazir",
        "name": "بریس زانو نئوپرن تنظیم‌پذیر", "brand": "OrthoFit",
        "short_desc": "بریس زانو با پشتیبانی جانبی برای ثبات مفصل",
        "description": [
            "بریس زانو نئوپرن با بست‌های قابل تنظیم، مناسب حمایت از زانو در فعالیت‌های روزانه و ورزشی و دوران بهبودی.",
        ],
        "price": 590000, "compare_at_price": 650000, "stock": 35, "sku": "KMT-KB-0001",
        "is_active": True, "is_featured": False, "category_old_id": "cat-rehab-knee-brace",
        "rating_avg": 4.3, "rating_count": 58,
        "images": _images("rehab", "بریس زانو نئوپرن تنظیم‌پذیر"),
        "specs": [
            {"group": "مشخصات فنی", "key": "جنس", "value": "نئوپرن", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "سایزبندی", "value": "S تا XL", "sort_order": 2},
        ],
    },
    {
        "old_id": "prod-wheelchair", "slug": "vilchair-hamrah-tashi-steel",
        "name": "ویلچر همراه تاشو استیل", "brand": "KaramadCare",
        "short_desc": "ویلچر تاشو با نشیمنگاه راحت و ترمز دستی",
        "description": [
            "ویلچر همراه با بدنه استیل مقاوم، قابلیت تاشدن سریع برای حمل در خودرو، و ترمز دستی دوطرفه برای ایمنی بیشتر.",
            "مناسب استفاده در منزل، سفر و مراکز درمانی.",
        ],
        "price": 3450000, "compare_at_price": 3800000, "stock": 8, "sku": "KMT-WC-0001",
        "is_active": True, "is_featured": True, "category_old_id": "cat-home-care-wheelchair",
        "rating_avg": 4.5, "rating_count": 39,
        "images": _images("home-care", "ویلچر همراه تاشو استیل"),
        "specs": [
            {"group": "مشخصات فنی", "key": "جنس بدنه", "value": "استیل رنگ‌شده", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "حداکثر وزن قابل تحمل", "value": "۱۲۰ کیلوگرم", "sort_order": 2},
            {"group": "ابعاد و وزن", "key": "عرض نشیمنگاه", "value": "۴۶ سانتی‌متر", "sort_order": 3},
            {"group": "ابعاد و وزن", "key": "وزن دستگاه", "value": "۱۸ کیلوگرم", "sort_order": 4},
        ],
    },
    {
        "old_id": "prod-nebulizer", "slug": "nebulizer-khanegi-compressori",
        "name": "نبولایزر خانگی کامپرسوری", "brand": "Omron",
        "short_desc": "دستگاه بخور استنشاقی برای درمان تنفسی در منزل",
        "description": [
            "نبولایزر کامپرسوری برای تبدیل دارو به ذرات ریز قابل استنشاق، مناسب درمان آسم و مشکلات تنفسی در منزل.",
            "عملکرد کم‌صدا و مناسب استفاده برای کودکان و بزرگسالان.",
        ],
        "price": 1180000, "compare_at_price": None, "stock": 22, "sku": "KMT-NB-0001",
        "is_active": True, "is_featured": False, "category_old_id": "cat-home-care-nebulizer",
        "rating_avg": 4.5, "rating_count": 61,
        "images": _images("home-care", "نبولایزر خانگی کامپرسوری"),
        "specs": [
            {"group": "مشخصات فنی", "key": "نوع", "value": "کامپرسوری", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "میزان ذرات دارویی", "value": "کمتر از ۵ میکرون", "sort_order": 2},
            {"group": "ابعاد و وزن", "key": "سطح صدا", "value": "زیر ۵۵ دسی‌بل", "sort_order": 3},
        ],
    },
    {
        "old_id": "prod-exam-table", "slug": "takht-moayene-do-shekan-charm",
        "name": "تخت معاینه دو شکن روکش چرم", "brand": "ClinicPro",
        "short_desc": "تخت معاینه دو شکن با روکش چرم مصنوعی بادوام",
        "description": [
            "تخت معاینه دو شکن مناسب مطب و کلینیک، با بدنه فلزی مقاوم و روکش چرم مصنوعی قابل شست‌وشو.",
        ],
        "price": 8900000, "compare_at_price": None, "stock": 0, "sku": "KMT-ET-0001",
        "is_active": True, "is_featured": False, "category_old_id": "cat-clinic-table",
        "rating_avg": 4.2, "rating_count": 14,
        "images": _images("clinic", "تخت معاینه دو شکن روکش چرم"),
        "specs": [
            {"group": "مشخصات فنی", "key": "جنس بدنه", "value": "فلزی رنگ‌شده", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "روکش", "value": "چرم مصنوعی", "sort_order": 2},
            {"group": "ابعاد و وزن", "key": "ابعاد", "value": "۱۹۰×۶۰ سانتی‌متر", "sort_order": 3},
        ],
    },
    {
        "old_id": "prod-autoclave", "slug": "autoclave-romizi-18-litri",
        "name": "اتوکلاو رومیزی ۱۸ لیتری", "brand": "SteriMed",
        "short_desc": "دستگاه استریل رومیزی برای مطب و کلینیک",
        "description": [
            "اتوکلاو رومیزی ۱۸ لیتری برای استریل کردن ابزار پزشکی و دندانپزشکی، با کنترل دیجیتال دما و فشار.",
        ],
        "price": 24500000, "compare_at_price": None, "stock": 3, "sku": "KMT-AC-0001",
        "is_active": True, "is_featured": False, "category_old_id": "cat-clinic-autoclave",
        "rating_avg": 4.7, "rating_count": 9,
        "images": _images("clinic", "اتوکلاو رومیزی ۱۸ لیتری"),
        "specs": [
            {"group": "مشخصات فنی", "key": "ظرفیت محفظه", "value": "۱۸ لیتر", "sort_order": 1},
            {"group": "مشخصات فنی", "key": "کنترل", "value": "دیجیتال", "sort_order": 2},
            {"group": "ابعاد و وزن", "key": "وزن دستگاه", "value": "۲۸ کیلوگرم", "sort_order": 3},
        ],
    },
    {
        "old_id": "prod-carrying-case", "slug": "kif-haml-tajhizat-zedab",
        "name": "کیف حمل تجهیزات پزشکی ضدآب", "brand": "KaramadCare",
        "short_desc": "کیف محافظ ضدآب برای حمل تجهیزات تشخیصی",
        "description": [
            "کیف حمل ضدآب با پارچه مقاوم و جاسازی داخلی، مناسب نگهداری و حمل فشارسنج، پالس اکسیمتر و سایر تجهیزات کوچک.",
        ],
        "price": 340000, "compare_at_price": 390000, "stock": 45, "sku": "KMT-BG-0001",
        "is_active": True, "is_featured": True, "category_old_id": "cat-accessories-case",
        "rating_avg": 4.4, "rating_count": 52,
        "images": _images("accessories", "کیف حمل تجهیزات پزشکی ضدآب"),
        "specs": [
            {"group": "مشخصات فنی", "key": "جنس", "value": "پارچه ضدآب", "sort_order": 1},
            {"group": "ابعاد و وزن", "key": "ابعاد", "value": "۲۰×۱۵×۸ سانتی‌متر", "sort_order": 2},
        ],
    },
]

# --- source data, transcribed 1:1 from lib/mock/settings.ts --------------------
SETTINGS: dict[str, Any] = {
    "shipping": {"mode": "flat", "cost": 50000, "free_over": 1000000},
    "contact": {
        "phone": "021-91234567",
        "whatsapp": "989121234567",
        "telegram": "karamadmedtech",
        "address": "تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۴",
    },
    "social": {
        "telegram": "https://t.me/karamadmedtech",
        "instagram": "https://instagram.com/karamadmedtech",
        "aparat": "https://aparat.com/karamadmedtech",
    },
    "hero_slides": [
        {
            "id": "slide-1",
            "title": "تجهیزات پزشکی با تضمین اصالت و بهترین قیمت",
            "highlight": "تضمین اصالت",
            "cta_label": "مشاهده محصولات",
            "cta_href": "/category/tajhizat-tashkhisi",
            "image_alt": "تجهیزات تشخیصی پزشکی",
        },
        {
            "id": "slide-2",
            "title": "مراقبت در منزل، ساده و مطمئن برای خانواده شما",
            "highlight": "مراقبت در منزل",
            "cta_label": "خرید تجهیزات مراقبتی",
            "cta_href": "/category/moraghebat-dar-manzel",
            "image_alt": "تجهیزات مراقبت در منزل",
        },
        {
            "id": "slide-3",
            "title": "تجهیزات مطب و کلینیک با فاکتور رسمی و مشاوره تخصصی",
            "highlight": "فاکتور رسمی",
            "cta_label": "مشاوره خرید",
            "cta_href": "/category/tajhizat-matb-clinic",
            "image_alt": "تجهیزات مطب و کلینیک",
        },
    ],
}


async def _upsert_category(
    db: AsyncSession, *, slug: str, name: str, icon: str | None,
    parent_new_id: uuid.UUID | None, sort_order: int, is_active: bool,
) -> uuid.UUID:
    stmt = (
        pg_insert(Category)
        .values(
            id=uuid.uuid4(), slug=slug, name=name, icon=icon,
            parent_id=parent_new_id, sort_order=sort_order, is_active=is_active,
        )
        .on_conflict_do_update(
            index_elements=[Category.slug],
            set_={"name": name, "icon": icon, "parent_id": parent_new_id,
                  "sort_order": sort_order, "is_active": is_active},
        )
        .returning(Category.id)
    )
    return (await db.execute(stmt)).scalar_one()


async def seed_categories(db: AsyncSession) -> dict[str, uuid.UUID]:
    """Two passes so every parent's new UUID is known before its children are
    inserted. Returns the old_id -> new UUID map, needed by seed_products."""
    old_id_to_new_id: dict[str, uuid.UUID] = {}

    for c in CATEGORIES:
        if c["parent_old_id"] is None:
            old_id_to_new_id[c["old_id"]] = await _upsert_category(
                db, slug=c["slug"], name=c["name"], icon=c["icon"],
                parent_new_id=None, sort_order=c["sort_order"], is_active=c["is_active"],
            )

    for c in CATEGORIES:
        if c["parent_old_id"] is not None:
            parent_new_id = old_id_to_new_id[c["parent_old_id"]]
            old_id_to_new_id[c["old_id"]] = await _upsert_category(
                db, slug=c["slug"], name=c["name"], icon=c["icon"],
                parent_new_id=parent_new_id, sort_order=c["sort_order"], is_active=c["is_active"],
            )

    return old_id_to_new_id


async def _upsert_product(db: AsyncSession, p: dict[str, Any], category_id: uuid.UUID) -> uuid.UUID:
    fields = {
        "name": p["name"], "brand": p["brand"], "short_desc": p["short_desc"],
        "description": p["description"], "price": p["price"],
        "compare_at_price": p["compare_at_price"], "stock": p["stock"], "sku": p["sku"],
        "is_active": p["is_active"], "is_featured": p["is_featured"], "category_id": category_id,
        "rating_avg": p["rating_avg"], "rating_count": p["rating_count"],
    }
    stmt = (
        pg_insert(Product)
        .values(id=uuid.uuid4(), slug=p["slug"], **fields)
        .on_conflict_do_update(index_elements=[Product.slug], set_=fields)
        .returning(Product.id)
    )
    return (await db.execute(stmt)).scalar_one()


async def seed_products(db: AsyncSession, old_id_to_new_id: dict[str, uuid.UUID]) -> None:
    for p in PRODUCTS:
        if p["category_old_id"] not in old_id_to_new_id:
            raise RuntimeError(
                f"Product {p['slug']!r} references unknown category id "
                f"{p['category_old_id']!r} — check for a typo in scripts/seed.py."
            )
        category_id = old_id_to_new_id[p["category_old_id"]]
        product_id = await _upsert_product(db, p, category_id)

        # images/specs have no natural per-row unique key, so re-sync by full
        # replace on every run — simple and correct given this script is the
        # sole authority over them pre-admin-panel.
        await db.execute(delete(ProductImage).where(ProductImage.product_id == product_id))
        await db.execute(delete(ProductSpec).where(ProductSpec.product_id == product_id))
        db.add_all(ProductImage(product_id=product_id, **img) for img in p["images"])
        db.add_all(ProductSpec(product_id=product_id, **s) for s in p["specs"])


async def seed_settings(db: AsyncSession) -> None:
    for key, value in SETTINGS.items():
        stmt = (
            pg_insert(Setting)
            .values(key=key, value=value)
            .on_conflict_do_update(index_elements=[Setting.key], set_={"value": value})
        )
        await db.execute(stmt)


async def main() -> None:
    async with AsyncSessionLocal() as db:
        old_id_to_new_id = await seed_categories(db)  # 1. parents, then children
        await seed_products(db, old_id_to_new_id)  # 2. products (needs category ids)
        await seed_settings(db)  # 3. settings (independent)
        await db.commit()

    print(
        f"Seeded {len(CATEGORIES)} categories, {len(PRODUCTS)} products, "
        f"{len(SETTINGS)} settings."
    )


if __name__ == "__main__":
    asyncio.run(main())
