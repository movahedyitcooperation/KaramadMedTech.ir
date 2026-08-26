"use client";

import { Bell, Heart, MagnifyingGlass, ShoppingCart } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pill";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Rating } from "@/components/ui/Rating";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { formatJalali, formatToman } from "@/lib/format";

const colorTokens = [
  ["brand-50", "bg-brand-50"],
  ["brand-100", "bg-brand-100"],
  ["brand-500", "bg-brand-500"],
  ["brand-600", "bg-brand-600"],
  ["brand-700", "bg-brand-700"],
  ["teal-500", "bg-teal-500"],
  ["teal-600", "bg-teal-600"],
  ["coral-500", "bg-coral-500"],
  ["coral-600", "bg-coral-600"],
  ["ink-900", "bg-ink-900"],
  ["ink-500", "bg-ink-500"],
  ["line", "bg-line"],
  ["bg", "bg-bg"],
  ["surface", "bg-surface"],
  ["danger", "bg-danger"],
] as const;

export default function TokensPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-12 p-8">
      <section>
        <h1 className="mb-6 text-2xl font-bold">تجهیزات پزشکی کارآمد — نمایش دیزاین سیستم</h1>
        <Logo />
        <Logo variant="icon" className="mt-4" />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">رنگ‌ها</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {colorTokens.map(([name, cls]) => (
            <div key={name} className="space-y-2">
              <div className={`h-16 rounded-card border border-line ${cls}`} />
              <p className="text-xs text-ink-500">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">دکمه‌ها</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">اصلی</Button>
          <Button variant="teal">تیل</Button>
          <Button variant="coral">مرجانی</Button>
          <Button variant="outline">خط دور</Button>
          <Button variant="ghost">شبح</Button>
          <Button variant="primary" loading>
            در حال بارگذاری
          </Button>
          <Button variant="primary" disabled>
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
          <Badge variant="brand">برند</Badge>
          <Badge variant="success">موجود</Badge>
          <Badge variant="danger">ناموجود</Badge>
          <Badge variant="coral">ویژه</Badge>
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
        <h2 className="mb-4 text-lg font-bold">کارت‌ها و اسکلتون</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <Heart size={20} className="text-coral-500" aria-hidden="true" />
            <p className="mt-2 text-sm">کارت نمونه</p>
          </Card>
          <Card className="space-y-2 p-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
          <Card className="p-4">
            <Bell size={20} className="text-brand-600" aria-hidden="true" />
          </Card>
          <Card className="p-4">
            <MagnifyingGlass size={20} className="text-teal-600" aria-hidden="true" />
          </Card>
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
