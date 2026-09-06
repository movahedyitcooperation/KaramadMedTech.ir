import { formatToman, toPersianDigits } from "@/lib/format";

/**
 * Every user-facing Persian string in the storefront.
 *
 * Catalog and settings *content* — product names, spec values, hero slide
 * copy, contact details — comes from the API, never from here. What lives
 * here is chrome and fixed marketing copy the backend has no endpoint for
 * (services, trust badges, footer labels), plus the Persian sentence for
 * every backend error `code`.
 *
 * Copy is ported verbatim from the design branch's src/i18n/fa.js — the
 * wording is a design decision (see the honesty rules in that branch's
 * BACKEND-GAPS.md: a feature that isn't live says so in words rather than
 * being faked), so don't paraphrase it while refactoring.
 */
export const fa = {
  brand: {
    name: "کارآمد",
    fullName: "تجهیزات پزشکی کارآمد",
    nameLatin: "Karamad MedTech",
    tagline: "تجهیزات پزشکی",
    homeAria: "کارآمد — صفحه اصلی",
    blurb:
      "تأمین تجهیزات تشخیصی، مصرفی و توان‌بخشی برای مطب‌ها، کلینیک‌ها و مراقبت در منزل.",
  },

  common: {
    home: "خانه",
    close: "بستن",
    menu: "منو",
    cancel: "انصراف",
    tryAgain: "تلاش دوباره",
    // Used by the admin panel, which is not part of the storefront design
    // system — keep these here rather than duplicating them under `admin`.
    edit: "ویرایش",
    remove: "حذف",
  },

  wa: {
    label: "واتس‌اپ",
    aria: "گفت‌وگو در واتس‌اپ",
    presetText: "سلام، درباره کالاهای فروشگاه کارآمد سؤال دارم.",
  },

  header: {
    searchPlaceholder: "نام کالا، برند یا کد کالا را بنویسید",
    searchLabel: "جست‌وجوی محصولات",
    searchSubmit: "جست‌وجو",
    finder: "پیدا کردن محصول بر اساس دسته‌بندی و قیمت",
    finderShort: "پیدا کردن محصول",
    phone: "تماس تلفنی",
    login: "ورود / ثبت‌نام",
    account: "حساب من",
    cart: "سبد خرید",
    menu: "منو",
  },

  cartDrawer: {
    title: "سبد خرید شما",
    unit: "کالا",
    empty: "هنوز کالایی انتخاب نکرده‌اید. از دسته‌بندی‌ها شروع کنید.",
    subtotal: "جمع کالاها",
    view: "مشاهده سبد خرید",
  },

  nav: {
    aria: "دسته‌بندی محصولات",
    allOfCategory: "همه کالاهای این دسته",
  },

  mobileNav: {
    title: "دسته‌بندی‌ها",
    close: "بستن",
    search: "جست‌وجوی محصولات",
    finder: "پیدا کردن محصول با دسته و قیمت",
    call: "تماس تلفنی",
  },

  hero: {
    aria: "اسلایدر معرفی",
    consult: "مشاوره پیش از خرید",
    prev: "اسلاید قبلی",
    next: "اسلاید بعدی",
    dot: (n: number) => `اسلاید ${toPersianDigits(n)}`,
    counter: (i: number, total: number) =>
      `${toPersianDigits(i)} از ${toPersianDigits(total)}`,
  },

  finder: {
    aria: "پیدا کردن محصول",
    category: "دسته‌بندی",
    price: "محدوده قیمت",
    sort: "چیدمان",
    allCategories: "همه دسته‌ها",
    submit: "نمایش محصولات",
    note: "دنبال کالای مشخصی هستید؟ از نوار جست‌وجوی بالای صفحه استفاده کنید.",
    bands: [
      { value: "", label: "هر قیمتی" },
      { value: "0-500000", label: "تا ۵۰۰ هزار تومان" },
      { value: "500000-3000000", label: "۵۰۰ هزار تا ۳ میلیون" },
      { value: "3000000-20000000", label: "۳ تا ۲۰ میلیون" },
      { value: "20000000-0", label: "بیش از ۲۰ میلیون" },
    ],
    sorts: [
      { value: "newest", label: "جدیدترین" },
      { value: "cheapest", label: "ارزان‌ترین" },
      { value: "expensive", label: "گران‌ترین" },
      { value: "rating", label: "بیشترین امتیاز" },
    ],
  },

  home: {
    categoriesAria: "دسته‌بندی‌ها",
    countUnit: (n: number) => `${toPersianDigits(n)} کالا`,
    newestHeading: "جدیدترین محصولات",
    newestAria: "جدیدترین محصولات",
    allProducts: "همه محصولات",
    featuredHeading: "پرفروش‌ترین محصولات",
    featuredAria: "پرفروش‌ترین محصولات",
    featuredNote: "بر پایه کالاهای منتخب فروشگاه",
    servicesAria: "خدمات",
    trustAria: "تعهدهای فروشگاه",
  },

  card: {
    inStock: "موجود",
    outOfStock: "ناموجود",
    add: "افزودن به سبد",
    added: "به سبد اضافه شد",
    notify: "اطلاع از موجودی",
    discountShort: (n: number) => `${toPersianDigits(n)}٪`,
    lowStock: (n: number) => `تنها ${toPersianDigits(n)} عدد موجود است`,
  },

  search: {
    title: "جست‌وجو",
    heading: (query: string) => `نتایج جست‌وجو برای «${query}»`,
    headingEmptyQuery: "جست‌وجوی محصولات",
    resultCount: (n: number) => `${toPersianDigits(n)} کالا پیدا شد`,
    placeholder: "نام کالا، برند یا کد کالا را بنویسید",
    submit: "جست‌وجو",
    scopeHeading: "دسته‌بندی‌ها",
    allDepartments: "همه دسته‌ها",
    emptyQueryTitle: "چه کالایی می‌خواهید؟",
    emptyQueryBody:
      "نام کالا، برند یا کد کالا را در نوار بالا بنویسید. می‌توانید از دسته‌بندی‌ها هم شروع کنید.",
    noResultsTitle: (query: string) => `برای «${query}» کالایی پیدا نشد`,
    noResultsBody:
      "املای عبارت را بررسی کنید، واژهٔ کوتاه‌تری بنویسید، یا فیلترها را بردارید. برای سفارش کالای خاص می‌توانید تلفنی تماس بگیرید.",
    noResultsCall: "تماس با فروشگاه",
    browseCategories: "دیدن دسته‌بندی‌ها",
  },

  category: {
    breadcrumbAria: "مسیر",
    home: "خانه",
    resultCount: (n: number) => `${toPersianDigits(n)} کالا`,
    withinSearch: (query: string) => `در نتایج «${query}»`,
    clearScope: "جست‌وجو در همه دسته‌ها",
    filtersButton: "فیلترها",
    filtersHeading: "فیلترها",
    closeFilters: "بستن فیلترها",
    sort: "چیدمان",
    subHeading: "زیردسته‌ها",
    allOf: (name: string) => `همه ${name}`,
    priceHeading: "محدوده قیمت (تومان)",
    from: "از",
    to: "تا",
    priceMinAria: "کمترین قیمت",
    priceMaxAria: "بیشترین قیمت",
    brandHeading: "برند",
    brandNote: "برندهای موجود در نتایج همین دسته",
    inStockOnly: "فقط کالاهای موجود",
    clear: "پاک کردن فیلترها",
    applyMobile: (n: number) => `نمایش ${toPersianDigits(n)} کالا`,
    emptyTitle: "با این فیلترها کالایی پیدا نشد",
    emptyBody:
      "محدوده قیمت را باز کنید یا برندها را بردارید. برای سفارش کالای خاص می‌توانید تلفنی تماس بگیرید.",
    emptyCall: "تماس با فروشگاه",
    loadErrorTitle: "بارگذاری کالاها انجام نشد",
    loadErrorBody:
      "ارتباط با فروشگاه برقرار نشد. اتصال را بررسی کنید و دوباره امتحان کنید.",
    retry: "تلاش دوباره",
    notFound: "این دسته‌بندی پیدا نشد.",
    pagerAria: "صفحه‌بندی",
    prevPage: "صفحه قبل",
    nextPage: "صفحه بعد",
  },

  pdp: {
    breadcrumbAria: "مسیر",
    home: "خانه",
    share: "هم‌رسانی",
    shared: "نشانی صفحه کپی شد.",
    inStock: "موجود در انبار",
    outOfStock: "ناموجود",
    discount: (n: number) => `${toPersianDigits(n)}٪ تخفیف`,
    qtyDown: "کاهش تعداد",
    qty: "تعداد",
    qtyUp: "افزایش تعداد",
    buy: "افزودن به سبد خرید",
    notifyRestock: "اطلاع از زمان تأمین",
    lowStockNote: (n: number) => `تنها ${toPersianDigits(n)} عدد در انبار موجود است.`,
    qtyMaxNote: (n: number) => `بیشتر از ${toPersianDigits(n)} عدد موجود نیست.`,
    qtyClampNote: (n: number) => `حداکثر ${toPersianDigits(n)} عدد موجود است.`,
    compareSoon: "مقایسه — به‌زودی",
    saveSoon: "ذخیره — به‌زودی",
    keySpecs: "مشخصات کلیدی",
    ratingLine: (avg: string) => `امتیاز کارشناسی ${avg} از ۵`,
    consultPhone: "مشاوره تلفنی",
    askWhatsapp: "پرسش در واتس‌اپ",
    sku: "کد کالا:",
    tabsAria: "اطلاعات محصول",
    tabReview: "نقد و بررسی",
    tabSpecs: "مشخصات",
    tabComments: "نظرات",
    safetyHeading: "نکته‌های ایمنی و نگهداری",
    commentsSoonTitle: "ثبت نظر به‌زودی فعال می‌شود",
    commentsSoonBody:
      "امتیاز نمایش‌داده‌شده از ارزیابی کارشناسان فروشگاه است. تا فعال شدن ثبت نظر، تجربه‌تان را تلفنی یا در واتس‌اپ با ما بگویید.",
    commentsSoonCta: "ارسال تجربه در واتس‌اپ",
    relatedHeading: "محصولات جانبی",
    thumb: (n: number) => `تصویر ${toPersianDigits(n)}`,
    notFound: "این کالا پیدا نشد.",
  },

  cart: {
    title: "سبد خرید",
    count: (n: number) => `${toPersianDigits(n)} کالا در سبد شما`,
    emptyTitle: "سبد خرید شما خالی است",
    emptyBody:
      "از دسته‌بندی‌ها شروع کنید یا کالا را با دسته و قیمت پیدا کنید. برای انتخاب تجهیزات مطب می‌توانید مشاوره بگیرید.",
    emptyCta: "دیدن دسته‌بندی‌ها",
    emptyCall: "مشاوره تلفنی",
    unitPrice: "قیمت واحد:",
    qtyDown: "کاهش تعداد",
    qty: "تعداد",
    qtyUp: "افزایش تعداد",
    stockHint: (n: number) => `حداکثر ${toPersianDigits(n)} عدد`,
    remove: "حذف از سبد",
    summaryHeading: "جمع سفارش",
    subtotal: "جمع کالاها",
    shipping: "هزینه ارسال",
    payable: "مبلغ قابل پرداخت",
    free: "رایگان",
    dash: "—",
    freeShipHint: (remaining: number) =>
      `با ${formatToman(remaining)} خرید بیشتر، ارسال رایگان می‌شود.`,
    checkout: "ادامه و پرداخت",
    checkoutLoginNote: "برای تکمیل سفارش وارد حساب خود می‌شوید.",
    helpTitle: "کمک می‌خواهید؟",
    helpBody:
      "اگر درباره انتخاب کالا، موجودی یا زمان ارسال سؤالی دارید، پیش از پرداخت با ما تماس بگیرید. فاکتور رسمی صادر می‌شود.",
    helpWhatsapp: "پرسش در واتس‌اپ",
  },

  checkout: {
    title: "تکمیل سفارش",
    breadcrumbAria: "مسیر",
    breadcrumb: "تکمیل سفارش",
    addressHeading: "آدرس تحویل",
    addressPickOne: "آدرس تحویل را انتخاب کنید.",
    noAddressTitle: "هنوز آدرسی ثبت نکرده‌اید",
    noAddressBody: "برای ادامه، نشانی تحویل سفارش را در حساب خود ثبت کنید.",
    noAddressCta: "ثبت آدرس",
    manageAddresses: "مدیریت آدرس‌ها",
    summaryHeading: "خلاصه سفارش",
    itemsHeading: "کالاهای سفارش",
    place: "ثبت سفارش و پرداخت",
    placing: "در حال ثبت سفارش…",
    redirecting: "در حال انتقال به درگاه پرداخت…",
    emptyCartTitle: "سبد خرید شما خالی است",
    emptyCartBody: "برای تکمیل سفارش ابتدا کالایی به سبد اضافه کنید.",
    emptyCartCta: "دیدن محصولات",
    securityNote:
      "پرداخت در درگاه بانکی انجام می‌شود و اطلاعات کارت شما هرگز در این سایت وارد نمی‌شود.",
  },

  mockPay: {
    title: "درگاه پرداخت آزمایشی",
    body:
      "این صفحه جای درگاه بانکی را در حالت توسعه می‌گیرد. در تنظیمات سرور PAYMENT_PROVIDER روی mock است.",
    approve: "پرداخت موفق",
    cancel: "انصراف از پرداخت",
    missingAuthority: "شناسه پرداخت در نشانی صفحه نیست.",
  },

  order: {
    title: (number: string) => `سفارش ${number}`,
    numberLabel: "شماره سفارش",
    statusLabel: "وضعیت",
    itemsHeading: "کالاهای سفارش",
    addressHeading: "آدرس تحویل",
    summaryHeading: "جمع سفارش",
    subtotal: "جمع کالاها",
    shipping: "هزینه ارسال",
    free: "رایگان",
    payable: "مبلغ قابل پرداخت",
    unitPrice: "قیمت واحد:",
    qty: (n: number) => `${toPersianDigits(n)} عدد`,
    sku: "کد کالا:",
    payNow: "پرداخت سفارش",
    paying: "در حال انتقال…",
    backToOrders: "سفارش‌های من",
    notFoundTitle: "این سفارش پیدا نشد",
    notFoundBody: "ممکن است نشانی اشتباه باشد یا این سفارش متعلق به حساب دیگری باشد.",
    // Payment outcomes, as reported by the backend's redirect. The result is
    // always the server's verdict after server-side verification — the
    // browser never decides that a payment succeeded.
    paidTitle: "پرداخت انجام شد",
    paidBody: "سفارش شما ثبت و پرداخت شد. جزئیات را برایتان پیامک می‌کنیم.",
    failedTitle: "پرداخت ناموفق بود",
    failedBody: "مبلغی از حساب شما کم نشده است. می‌توانید دوباره تلاش کنید.",
    cancelledTitle: "پرداخت لغو شد",
    cancelledBody: "سفارش شما ثبت شده و در انتظار پرداخت است.",
    awaitingPaymentBody: "این سفارش هنوز پرداخت نشده است.",
  },

  orderStatus: {
    pending_payment: "در انتظار پرداخت",
    paid: "پرداخت‌شده",
    processing: "در حال آماده‌سازی",
    shipped: "ارسال‌شده",
    delivered: "تحویل‌شده",
    cancelled: "لغو‌شده",
    unknown: "نامشخص",
  },

  orders: {
    heading: "سفارش‌های من",
    count: (n: number) => `${toPersianDigits(n)} سفارش`,
    itemCount: (n: number) => `${toPersianDigits(n)} کالا`,
    view: "مشاهده سفارش",
    payNow: "پرداخت",
  },

  login: {
    contactTitle: "ورود به حساب",
    contactBody: "شماره موبایل یا ایمیل خود را بنویسید؛ یک کد شش‌رقمی برایتان می‌فرستیم.",
    contactLabel: "موبایل یا ایمیل",
    contactPlaceholder: "۰۹۱۲۳۴۵۶۷۸۹ یا name@mail.com",
    request: "ارسال کد تأیید",
    requesting: "در حال ارسال…",
    twoIdentities:
      "موبایل و ایمیل دو حساب جداگانه می‌سازند؛ برای دیدن سفارش‌ها و آدرس‌هایتان هر بار با همان روش وارد شوید.",
    codeTitle: "کد تأیید را بنویسید",
    codeSentToPre: "کد شش‌رقمی به ",
    codeSentToPost: " فرستاده شد.",
    editContact: "ویرایش شماره یا ایمیل",
    codeLabel: "کد تأیید",
    verify: "تأیید و ورود",
    verifying: "در حال بررسی…",
    resendPrompt: "کد را دریافت نکردید؟",
    resendIn: (mmss: string) => `ارسال دوباره تا ${mmss} دیگر`,
    resend: "ارسال دوباره کد",
    resentToast: "کد تازه فرستاده شد.",
    welcomeToast: "وارد شدید. سبد مهمان به حساب شما منتقل شد.",
    codeShort: (n: number) => `کد شش‌رقمی است. ${toPersianDigits(n)} رقم دیگر بنویسید.`,
  },

  /**
   * Backend error `code` -> Persian sentence. The keys are the exact `code`
   * values raised by backend/app/api/v1/customer_auth.py; anything unmapped
   * falls back to `generic`, and a transport failure to `network`.
   */
  errors: {
    invalid_contact:
      "شماره موبایل با ۰۹ شروع می‌شود و یازده رقم است. ایمیل را هم می‌توانید بنویسید.",
    otp_resend_too_soon: "کد قبلی هنوز اعتبار دارد. تا پایان شمارش صبر کنید.",
    otp_rate_limited_contact:
      "در یک ساعت گذشته چند بار کد خواسته‌اید. یک ساعت دیگر دوباره تلاش کنید.",
    otp_rate_limited_ip: "از این شبکه درخواست‌های زیادی ثبت شده. کمی بعد دوباره امتحان کنید.",
    otp_delivery_failed: "ارسال کد ناموفق بود. چند لحظه دیگر «ارسال دوباره کد» را بزنید.",
    otp_not_found: "کد فعالی برای این شماره نیست. یک بار دیگر کد بخواهید.",
    otp_expired: "این کد منقضی شده است. کد تازه بخواهید.",
    otp_max_attempts: "پنج بار کد نادرست وارد شده. کد تازه بخواهید و با دقت وارد کنید.",
    otp_invalid_code: (left: number) =>
      `کد وارد‌شده درست نیست. ${toPersianDigits(left)} تلاش دیگر دارید.`,
    product_not_found: "این کالا دیگر در فروشگاه نیست.",
    cart_item_not_found: "این کالا در سبد شما نبود.",
    // Order and payment codes (backend/app/api/v1/{orders,payments}.py).
    // "Address not found" and "Order not found" arrive as FastAPI's plain
    // string detail rather than a {code} object, so the sentence itself is
    // the key — see lib/api/client.ts's parseErrorBody.
    cart_empty: "سبد خرید شما خالی است.",
    product_unavailable: "یکی از کالاهای سبد دیگر موجود نیست. سبد را بازبینی کنید.",
    insufficient_stock: "موجودی یکی از کالاهای سبد کافی نیست. تعداد را کم کنید و دوباره تلاش کنید.",
    order_not_payable: "این سفارش قابل پرداخت نیست؛ وضعیت آن تغییر کرده است.",
    payment_request_failed: "ارتباط با درگاه پرداخت برقرار نشد. چند لحظه بعد دوباره تلاش کنید.",
    "Address not found": "این آدرس پیدا نشد. آدرس دیگری انتخاب کنید.",
    "Order not found": "این سفارش پیدا نشد.",
    generic: "انجام نشد. یک لحظه بعد دوباره تلاش کنید.",
    serverError: "مشکلی در سرور پیش آمد. چند لحظه بعد دوباره تلاش کنید یا با ما تماس بگیرید.",
    network: "ارتباط با سرور برقرار نشد. اتصال را بررسی کنید.",
  },

  account: {
    title: "حساب من",
    navAria: "بخش‌های حساب",
    tabs: [
      { id: "profile", label: "اطلاعات حساب" },
      { id: "addresses", label: "آدرس‌ها" },
      { id: "orders", label: "سفارش‌ها" },
    ],
    logout: "خروج از حساب",
    loggedOutToast: "از حساب خارج شدید.",
    profileHeading: "اطلاعات حساب",
    fullName: "نام و نام خانوادگی",
    phone: "موبایل",
    email: "ایمیل",
    identityNote:
      "موبایل و ایمیل شناسه ورود شما هستند و تغییر نمی‌کنند. تنها نام قابل ویرایش است.",
    saveName: "ذخیره نام",
    savedNameToast: "نام حساب ذخیره شد.",
    defaultBadge: "آدرس پیش‌فرض",
    removeAddress: "حذف",
    removedAddressToast: "آدرس حذف شد.",
    postalLabel: "کد پستی",
    makeDefault: "پیش‌فرض کن",
    madeDefaultToast: "این آدرس پیش‌فرض شد.",
    addAddress: "افزودن آدرس تازه",
    addressesEmpty: "هنوز آدرسی ثبت نکرده‌اید.",
    addrForm: {
      title: "عنوان آدرس",
      titlePlaceholder: "خانه، مطب، …",
      fullName: "نام گیرنده",
      phone: "موبایل گیرنده",
      phonePlaceholder: "۰۹۱۲۳۴۵۶۷۸۹",
      province: "استان",
      city: "شهر",
      line: "نشانی کامل",
      linePlaceholder: "خیابان، کوچه، پلاک، طبقه، واحد",
      postal: "کد پستی (اختیاری)",
      isDefault: "این آدرس پیش‌فرض من باشد",
      save: "ذخیره آدرس",
      saving: "در حال ذخیره…",
      cancel: "انصراف",
      savedToast: "آدرس تازه ثبت شد.",
      required: "این بخش را کامل کنید.",
      phoneInvalid: "شماره موبایل با ۰۹ شروع می‌شود و یازده رقم است.",
    },
    ordersEmptyTitle: "هنوز سفارشی ثبت نشده است",
    ordersEmptyBody:
      "هر سفارشی که از طریق سایت ثبت کنید، همراه با وضعیت پرداخت و ارسال، اینجا نگهداری می‌شود. سفارش‌هایی که تلفنی یا در واتس‌اپ نهایی می‌کنید در این فهرست نمی‌آیند.",
    ordersEmptyCta: "دیدن محصولات",
  },

  footer: {
    contactHeading: "تماس با ما",
    categoriesHeading: "دسته‌بندی‌ها",
    servicesHeading: "خدمات",
    enamad: "نماد اعتماد الکترونیکی",
    samandehi: "ساماندهی",
    copyright: "© ۱۴۰۵ تجهیزات پزشکی کارآمد — همه حقوق محفوظ است.",
    returnPolicy:
      "بازگشت کالای سترون تنها با بسته‌بندی پلمب‌نشده و تا ۷ روز پذیرفته می‌شود.",
    serviceLinks: [
      { label: "فروش اقساطی", kind: "category" as const },
      { label: "فاکتور رسمی", kind: "phone" as const },
      { label: "مشاوره پیش از خرید", kind: "phone" as const },
      { label: "شرایط بازگشت کالا", kind: "soon" as const },
    ],
    socialNames: {
      telegram: "تلگرام",
      instagram: "اینستاگرام",
      aparat: "آپارات",
      whatsapp: "واتس‌اپ",
    },
  },

  services: [
    {
      title: "فروش اقساطی",
      body: "تجهیزات سرمایه‌ای مطب را با اقساط شش تا دوازده ماهه بگیرید.",
      action: "شرایط اقساط",
      radius: "3px",
    },
    {
      title: "درخواست مشاوره",
      body: "پیش از خرید با کارشناس ما درباره کاربرد و اندازه کالا صحبت کنید.",
      action: "تماس با کارشناس",
      radius: "50%",
    },
    {
      title: "فاکتور رسمی",
      body: "برای خرید سازمانی و بیمارستانی فاکتور رسمی با کد اقتصادی صادر می‌شود.",
      action: "درخواست فاکتور",
      radius: "2px",
    },
    {
      title: "چرا کارآمد",
      body: "اصالت کالا، موجودی واقعی انبار و پاسخ‌دهی پس از فروش.",
      action: "درباره ما",
      radius: "8px",
    },
  ],

  trust: [
    { title: "ارسال فوری", body: "سفارش تا ساعت ۱۴، همان روز ارسال می‌شود." },
    { title: "پرداخت در محل", body: "برای تهران، پرداخت هنگام تحویل کالا." },
    { title: "بهترین قیمت", body: "قیمت جعبه‌ای برای خرید دوره‌ای مطب." },
    { title: "تضمین اصالت کالا", body: "واردات رسمی با کد IRC قابل استعلام." },
    { title: "مشاوره تخصصی", body: "انتخاب کالا با کارشناس تجهیزات پزشکی." },
    { title: "۷ روز ضمانت برگشت", body: "کالای پلمب‌نشده تا هفت روز برگشت‌پذیر." },
  ],

  toast: {
    addOutOfStock: "این کالا فعلاً موجود نیست. برای زمان تأمین تماس بگیرید.",
    addClamped: (stock: number) =>
      `فقط ${toPersianDigits(stock)} عدد موجود بود؛ همان تعداد به سبد اضافه شد.`,
    added: (name: string) => `${name.slice(0, 34)} به سبد اضافه شد.`,
    setQtyClamped: (stock: number) =>
      `حداکثر ${toPersianDigits(stock)} عدد از این کالا موجود است.`,
    removed: "کالا از سبد حذف شد.",
    aboutSoon: "صفحه درباره ما در نسخه بعد اضافه می‌شود.",
    returnSoon: "صفحه شرایط بازگشت در نسخه بعد اضافه می‌شود.",
  },

  // Shown for any URL that matches no route at all — as opposed to
  // fa.pdp.notFound / fa.category.notFound, which cover a real route whose
  // slug the API did not recognise.
  notFound: {
    title: "این صفحه پیدا نشد",
    body: "ممکن است نشانی را اشتباه وارد کرده باشید یا این صفحه جابه‌جا شده باشد. از دسته‌بندی‌ها شروع کنید یا نام کالا را جست‌وجو کنید.",
    home: "صفحه اصلی",
    search: "جست‌وجوی کالا",
    metaTitle: "صفحه پیدا نشد | تجهیزات پزشکی کارآمد",
  },

  meta: {
    homeTitle: "تجهیزات پزشکی کارآمد | فروش تخصصی تجهیزات مطب، کلینیک و مراقبت در منزل",
    homeDesc:
      "خرید فشارسنج، پالس‌اکسیمتر، ویلچر، تخت بیمار، اتوکلاو و کالای مصرفی درمانی با فاکتور رسمی، اصالت کالا و مشاوره پیش از خرید.",
    categoryTitle: (name: string) => `${name} | تجهیزات پزشکی کارآمد`,
    productTitle: (name: string) => `${name} | تجهیزات پزشکی کارآمد`,
    cartTitle: "سبد خرید | تجهیزات پزشکی کارآمد",
    loginTitle: "ورود به حساب | تجهیزات پزشکی کارآمد",
    accountTitle: "حساب من | تجهیزات پزشکی کارآمد",
    checkoutTitle: "تکمیل سفارش | تجهیزات پزشکی کارآمد",
    orderTitle: (number: string) => `سفارش ${number} | تجهیزات پزشکی کارآمد`,
    mockPayTitle: "درگاه پرداخت آزمایشی",
  },

  admin: {
    loginTitle: "ورود مدیریت",
    emailLabel: "ایمیل",
    passwordLabel: "رمز عبور",
    loginButton: "ورود",
    loggingIn: "در حال بررسی…",
    invalidCredentials: "ایمیل یا رمز عبور نادرست است",
    logout: "خروج",
    sidebarProducts: "محصولات",
    sidebarCategories: "دسته‌بندی‌ها",
    products: {
      title: "محصولات",
      newButton: "محصول جدید",
      searchPlaceholder: "جستجو بر اساس نام یا کد محصول…",
      colName: "نام",
      colSku: "کد محصول",
      colPrice: "قیمت",
      colStock: "موجودی",
      colStatus: "وضعیت",
      colActions: "عملیات",
      statusActive: "فعال",
      statusInactive: "غیرفعال",
      emptyLabel: "محصولی ثبت نشده است",
      createTitle: "افزودن محصول جدید",
      editTitle: "ویرایش محصول",
      fieldSlug: "نامک (Slug)",
      fieldName: "نام محصول",
      fieldBrand: "برند",
      fieldShortDesc: "توضیح کوتاه",
      fieldDescription: "توضیحات",
      fieldDescriptionHint: "هر خط به‌عنوان یک پاراگراف نمایش داده می‌شود",
      fieldPrice: "قیمت (تومان)",
      fieldCompareAtPrice: "قیمت قبل از تخفیف (اختیاری)",
      fieldStock: "موجودی",
      fieldSku: "کد محصول (SKU)",
      fieldCategory: "دسته‌بندی",
      fieldCategoryPlaceholder: "انتخاب دسته‌بندی",
      fieldIsActive: "فعال (در فروشگاه نمایش داده شود)",
      fieldIsFeatured: "ویژه (در صفحه اصلی نمایش داده شود)",
      imagesTitle: "تصاویر محصول",
      specsTitle: "مشخصات فنی",
      specGroupPlaceholder: "گروه (مثال: مشخصات فنی)",
      specKeyPlaceholder: "عنوان (مثال: وزن)",
      specValuePlaceholder: "مقدار (مثال: ۱۱۰ گرم)",
      addSpecRow: "افزودن مشخصه",
      saveButton: "ذخیره محصول",
      saving: "در حال ذخیره…",
      deleteConfirmTitle: "حذف محصول",
      deleteConfirmBody: (name: string) => `آیا از حذف «${name}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`,
    },
    categories: {
      title: "دسته‌بندی‌ها",
      newButton: "دسته‌بندی جدید",
      colName: "نام",
      colSlug: "نامک",
      colStatus: "وضعیت",
      colActions: "عملیات",
      statusActive: "فعال",
      statusInactive: "غیرفعال",
      emptyLabel: "دسته‌بندی‌ای ثبت نشده است",
      createTitle: "افزودن دسته‌بندی جدید",
      editTitle: "ویرایش دسته‌بندی",
      fieldSlug: "نامک (Slug)",
      fieldName: "نام دسته‌بندی",
      fieldIcon: "نام آیکون (Phosphor Icons)",
      fieldIconHint: "مثال: Stethoscope، Heartbeat — از phosphoricons.com",
      fieldParent: "دسته‌بندی والد",
      fieldParentNone: "بدون والد (سطح اول)",
      fieldSortOrder: "ترتیب نمایش",
      fieldIsActive: "فعال",
      saveButton: "ذخیره دسته‌بندی",
      saving: "در حال ذخیره…",
      deleteConfirmTitle: "حذف دسته‌بندی",
      deleteConfirmBody: (name: string) => `آیا از حذف «${name}» مطمئن هستید؟`,
      deleteBlockedByProducts: "این دسته‌بندی دارای محصول است و قابل حذف نیست",
    },
    upload: {
      dropHint: "برای آپلود تصویر بکشید و رها کنید یا کلیک کنید",
      uploading: "در حال آپلود…",
      remove: "حذف تصویر",
      moveUp: "جابجایی به بالا",
      moveDown: "جابجایی به پایین",
      altPlaceholder: "متن جایگزین تصویر",
      tooLarge: "حجم تصویر بیشتر از ۵ مگابایت است",
      unsupportedType: "فرمت تصویر پشتیبانی نمی‌شود (JPEG، PNG یا WebP)",
    },
    common: {
      backToList: "بازگشت به لیست",
      confirmDelete: "حذف",
      cancel: "انصراف",
      unexpectedError: "خطای غیرمنتظره‌ای رخ داد",
      unauthorized: "دسترسی شما منقضی شده است، دوباره وارد شوید",
    },
  },
} as const;
