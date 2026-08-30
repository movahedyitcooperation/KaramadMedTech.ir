import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  // AdminLoginForm uses useSearchParams() (to read ?next=) — that requires
  // a Suspense boundary or Next.js bails out of prerendering this page.
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
