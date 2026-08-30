import { Package, Tag } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { fa } from "@/lib/i18n/fa";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-60 shrink-0 border-e border-line bg-surface sm:block">
        <div className="p-5">
          <p className="font-bold text-ink-900">{fa.brand.name}</p>
          <p className="text-xs text-ink-500">پنل مدیریت</p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          <Link
            href="/admin/products"
            className="flex items-center gap-2 rounded-input px-3 py-2 text-sm text-ink-900 hover:bg-bg"
          >
            <Package size={18} aria-hidden="true" />
            {fa.admin.sidebarProducts}
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center gap-2 rounded-input px-3 py-2 text-sm text-ink-900 hover:bg-bg"
          >
            <Tag size={18} aria-hidden="true" />
            {fa.admin.sidebarCategories}
          </Link>
        </nav>
        <div className="px-3 pt-4">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
