"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { fa } from "@/lib/i18n/fa";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? fa.admin.invalidCredentials);
      return;
    }
    router.push(searchParams.get("next") || "/admin/products");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-center text-lg font-bold text-ink-900">{fa.admin.loginTitle}</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label={fa.admin.emailLabel}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            dir="ltr"
            required
          />
          <Input
            label={fa.admin.passwordLabel}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            error={error ?? undefined}
            required
          />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? fa.admin.loggingIn : fa.admin.loginButton}
          </Button>
        </form>
      </Card>
    </div>
  );
}
