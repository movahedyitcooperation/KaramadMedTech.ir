"use client";

import { Bell, Heart, MagnifyingGlass, ShoppingCart } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/brand/Logo";
import { Watermark } from "@/components/brand/Watermark";
import { DepartmentMark } from "@/components/shop/DepartmentMark";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { HighlightCard } from "@/components/ui/HighlightCard";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Rating } from "@/components/ui/Rating";
import { RuleBox } from "@/components/ui/RuleBox";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { Toaster } from "@/components/ui/Toaster";
import { formatJalali, formatToman } from "@/lib/format";
import { useToastStore } from "@/lib/stores/toast-store";
import { resolveDepartment, type DepartmentKey } from "@/lib/utils/department";

const colorTokens = [
  ["ink", "bg-ink"],
  ["emerald", "bg-emerald"],
  ["emerald-deep", "bg-emerald-deep"],
  ["emerald-live", "bg-emerald-live"],
  ["emerald-live-deep", "bg-emerald-live-deep"],
  ["emerald-hi", "bg-emerald-hi"],
  ["page", "bg-page"],
  ["surface", "bg-surface"],
  ["bone", "bg-bone"],
  ["img-bg", "bg-img-bg"],
  ["warn", "bg-warn"],
  ["warn-bg", "bg-warn-bg"],
  ["danger", "bg-danger"],
  ["info", "bg-info"],
  ["info-bg", "bg-info-bg"],
] as const;

// Real seeded top-level slugs (backend/scripts/seed.py) — see
// lib/utils/department.ts's own comment for why these aren't the design's
// English department keys.
const DEPARTMENT_DEMO: { slug: string; label: string }[] = [
  { slug: "tajhizat-tashkhisi", label: "تجهیزات تشخیصی" },
  { slug: "masrafi-behdashti", label: "مصرفی و بهداشتی" },
  { slug: "tavanbakhshi-ortopedi", label: "توانبخشی و ارتوپدی" },
  { slug: "moraghebat-dar-manzel", label: "مراقبت در منزل" },
  { slug: "tajhizat-matb-clinic", label: "تجهیزات مطب و کلینیک" },
  { slug: "lavazem-janebi", label: "لوازم جانبی" },
];

export default function TokensPage() {
  const pushToast = useToastStore((s) => s.push);

  return (
    <main className="mx-auto max-w-6xl space-y-12 p-8">
      <Toaster />

      <section>
        <h1 className="mb-6 text-2xl font-bold">تجهیزات پزشکی کارآمد — نمایش دیزاین سیستم v2</h1>
        <Logo />
        <Logo variant="icon" className="mt-4" />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">رنگ‌ها</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {colorTokens.map(([name, cls]) => (
            <div key={name} className="space-y-2">
              <div className={`h-16 rounded-4 border border-line ${cls}`} />
              <p className="text-xs text-ink/60">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">طیف رنگ دپارتمان‌ها (فقط با آیکون و برچسب)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {DEPARTMENT_DEMO.map(({ slug, label }) => (
            <DepartmentMark key={slug} department={resolveDepartment(slug)} label={label} size={40} />
          ))}
          {/* Unknown-slug fallback — must render neutral, never guess a color. */}
          <DepartmentMark department={resolveDepartment("unknown-slug" as DepartmentKey)} label="نامشخص" size={40} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">مقیاس گرد کردن گوشه‌ها</h2>
        <div className="flex flex-wrap items-end gap-4">
          {(["1", "2", "3", "4", "5", "6", "7", "pill"] as const).map((r) => (
            <div key={r} className="space-y-2 text-center">
              <div className={`h-16 w-16 border border-line bg-surface rounded-${r}`} />
              <p className="text-xs text-ink/60">{r}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">مقیاس تایپوگرافی</h2>
        <div className="space-y-2">
          <p className="text-display font-extrabold">Display — عنوان اصلی</p>
          <p className="text-h1 font-extrabold">H1 — تجهیزات پزشکی کارآمد</p>
          <p className="text-h2 font-extrabold">H2 — دسته‌بندی محصولات</p>
          <p className="text-lead leading-prose">Lead — متن مقدماتی با ارتفاع خط بیشتر برای متن فارسی</p>
          <p className="text-15 leading-prose text-ink/72">Body — قیمت‌ها و مشخصات با این اندازه نمایش داده می‌شوند</p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">دکمه‌ها</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ink">اصلی (ink)</Button>
          <Button variant="emerald">زمردی</Button>
          <Button variant="outline">خط دور</Button>
          <Button variant="ghost">شبح</Button>
          <Button variant="danger">حذف</Button>
          <Button variant="ink" loading>
            در حال بارگذاری
          </Button>
          <Button variant="ink" disabled>
            غیرفعال
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm">کوچک</Button>
          <Button size="md">متوسط</Button>
          <Button size="lg">بزرگ</Button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">فرم‌ها</h2>
        <div className="grid max-w-md gap-4">
          <Input label="نام و نام خانوادگی" placeholder="مثال: علی رضایی" />
          <Input label="شماره موبایل" error="شماره موبایل معتبر نیست" />
          <Textarea label="توضیحات" placeholder="نظر خود را بنویسید…" />
          <Select label="مرتب‌سازی">
            <option>جدیدترین</option>
            <option>ارزان‌ترین</option>
          </Select>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">نشان‌ها و پیل‌ها</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="neutral">خنثی</Badge>
          <Badge variant="warn">کم موجود</Badge>
          <Badge variant="danger">ناموجود</Badge>
          <Badge variant="info">به‌زودی</Badge>
          <Pill>
            <ShoppingCart size={16} aria-hidden="true" /> سبد خرید
          </Pill>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">امتیاز و شمارنده</h2>
        <div className="flex flex-wrap items-center gap-6">
          <Rating value={4} />
          <Rating value={3.5} readOnly={false} onChange={() => {}} />
          <QuantityStepper value={2} onChange={() => {}} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">چهار سطح کارت</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3 border border-line bg-surface p-4 transition-colors hover:border-ink/30">
            <Heart size={20} className="text-danger" aria-hidden="true" />
            <p className="mt-2 text-15">کارت محصول — بدون سایه، بدون بزرگ‌نمایی</p>
          </div>
          <HighlightCard className="p-4">
            <Bell size={20} aria-hidden="true" />
            <p className="mt-2 text-15">کارت برجسته — زمینه زمردی، متن معکوس</p>
          </HighlightCard>
        </div>
        <div className="mt-4">
          <RuleBox
            items={[
              <div key="1"><MagnifyingGlass size={20} className="text-emerald-live" aria-hidden="true" /><p className="mt-2 text-sm">سلول سرویس ۱</p></div>,
              <div key="2"><MagnifyingGlass size={20} className="text-emerald-live" aria-hidden="true" /><p className="mt-2 text-sm">سلول سرویس ۲</p></div>,
              <div key="3"><MagnifyingGlass size={20} className="text-emerald-live" aria-hidden="true" /><p className="mt-2 text-sm">سلول سرویس ۳</p></div>,
              <div key="4"><MagnifyingGlass size={20} className="text-emerald-live" aria-hidden="true" /><p className="mt-2 text-sm">سلول سرویس ۴</p></div>,
            ]}
            className="grid-cols-2 sm:grid-cols-4"
          />
        </div>
        <div className="mt-4">
          <RuleBox
            tone="emerald"
            items={["نماد اعتماد", "ارسال سریع", "ضمانت اصالت", "پشتیبانی ۲۴ ساعته"].map((t) => (
              <p key={t} className="text-sm font-semibold">{t}</p>
            ))}
            className="grid-cols-2 sm:grid-cols-4"
          />
        </div>
        <div className="mt-4 max-w-md">
          <Panel
            title="سبد خرید شما خالی است"
            body="محصولی برای نمایش وجود ندارد. از دسته‌بندی‌ها شروع کنید."
            actions={<Button variant="ink">دیدن دسته‌بندی‌ها</Button>}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">اسکلتون (شیمر)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-11 w-full" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">پیام کوتاه (Toast)</h2>
        <Button variant="outline" onClick={() => pushToast("فقط ۳ عدد موجود بود؛ همان تعداد به سبد اضافه شد.")}>
          نمایش پیام آزمایشی
        </Button>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">علامت آبدار (Watermark)</h2>
        <div className="relative h-32 w-full overflow-hidden rounded-6 border border-line bg-surface">
          <Watermark />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">تب‌ها</h2>
        <Tabs
          items={[
            { id: "a", label: "نقد و بررسی", content: <p>محتوای نقد و بررسی</p> },
            { id: "b", label: "مشخصات فنی", content: <p>محتوای مشخصات فنی</p> },
            { id: "c", label: "نظرات", content: <p>محتوای نظرات</p> },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">قالب‌بندی اعداد و تاریخ</h2>
        <p>{formatToman(1250000)}</p>
        <p>{formatJalali(new Date())}</p>
      </section>
    </main>
  );
}
