"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { requestOtp, verifyOtp } from "@/lib/mock/auth";
import { useAuthStore } from "@/lib/stores/auth-store";

const RESEND_SECONDS = 120;

export function OtpLoginFlow() {
  const [step, setStep] = useState<"contact" | "otp">("contact");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const loginSuccess = useAuthStore((s) => s.loginSuccess);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== "otp") return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [step]);

  async function onSubmitContact(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await requestOtp({ contact });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCode("");
    setSecondsLeft(RESEND_SECONDS);
    setStep("otp");
  }

  async function onSubmitCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await verifyOtp({ contact, code });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    loginSuccess(result.data.contact);
    router.push("/");
  }

  async function onResend() {
    if (secondsLeft > 0) return;
    setLoading(true);
    await requestOtp({ contact });
    setLoading(false);
    setSecondsLeft(RESEND_SECONDS);
  }

  return (
    <Card className="w-full max-w-sm p-6">
      <h1 className="text-center text-lg font-bold text-ink-900">{fa.auth.loginTitle}</h1>
      <p className="mt-1 text-center text-sm text-ink-500">
        {step === "contact" ? fa.auth.loginSubtitle : fa.auth.otpSubtitle(contact)}
      </p>

      {step === "contact" ? (
        <form onSubmit={onSubmitContact} className="mt-6 space-y-4">
          <Input
            label={fa.auth.phoneOrEmailLabel}
            placeholder={fa.auth.phoneOrEmailPlaceholder}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            error={error ?? undefined}
            autoComplete="tel"
            required
          />
          <Button type="submit" variant="coral" size="lg" className="w-full" loading={loading}>
            {fa.auth.continueButton}
          </Button>
        </form>
      ) : (
        <form onSubmit={onSubmitCode} className="mt-6 space-y-4">
          <Input
            label={fa.auth.otpTitle}
            placeholder={fa.auth.otpPlaceholder}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            error={error ?? undefined}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            className="text-center tracking-[0.5em]"
          />
          <Button type="submit" variant="coral" size="lg" className="w-full" loading={loading}>
            {fa.auth.verifyButton}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setStep("contact")}
              className="cursor-pointer text-brand-600 hover:underline"
            >
              {fa.auth.editNumber}
            </button>
            <button
              type="button"
              onClick={onResend}
              disabled={secondsLeft > 0}
              className="cursor-pointer text-brand-600 hover:underline disabled:cursor-not-allowed disabled:text-ink-500 disabled:no-underline"
            >
              {secondsLeft > 0
                ? fa.auth.resendIn(toPersianDigits(secondsLeft))
                : fa.auth.resendCode}
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 rounded-input bg-brand-50 p-3 text-center text-xs text-brand-700">
        {fa.auth.demoNotice}
      </p>
    </Card>
  );
}
