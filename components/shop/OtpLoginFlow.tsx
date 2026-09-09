"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { requestOtpAction, verifyOtpAction } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/Button";
import { parseFaDigits, toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { useToastStore } from "@/lib/stores/toast-store";

/** Matches OTP_RESEND_COOLDOWN_SECONDS in backend/.env — if either changes,
 * change both, or the resend button either 429s or feels artificially slow. */
const RESEND_COOLDOWN = 120;
const CODE_LENGTH = 6;

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return toPersianDigits(`${m}:${s}`);
}

/**
 * Two steps in one card: contact, then the six-digit code.
 *
 * Nothing about the OTP is decided here. The backend classifies phone vs
 * email from the single `contact` field, generates and hashes the code,
 * enforces the TTL, the five-attempt cap and the per-contact/per-IP rate
 * limits, and dispatches it. Every failure comes back as a `code` that
 * lib/i18n/errors.ts turns into one Persian sentence — including
 * «۳ تلاش دیگر دارید», whose count comes from the server, not a local tally.
 *
 * The card states plainly that phone and email are separate identities,
 * because they are: verifying by one and later by the other creates two
 * unrelated accounts with separate carts and addresses, and there is no
 * cross-channel merge.
 */
export function OtpLoginFlow({ nextPath }: { nextPath: string }) {
  const [step, setStep] = useState<"contact" | "code">("contact");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);
  const [pending, startTransition] = useTransition();
  const pushToast = useToastStore((s) => s.push);
  const router = useRouter();

  useEffect(() => {
    if (step !== "code" || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondsLeft]);

  function submitContact() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await requestOtpAction(contact);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Use the server's normalised contact (trimmed, lower-cased email) so
      // verify-otp is asked about exactly the identity the code was sent to.
      setContact(result.contact);
      setCode("");
      setSecondsLeft(RESEND_COOLDOWN);
      setStep("code");
    });
  }

  function submitCode() {
    if (pending) return;
    if (code.length < CODE_LENGTH) {
      setError(fa.login.codeShort(CODE_LENGTH - code.length));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await verifyOtpAction(contact, code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      pushToast(fa.login.welcomeToast);
      router.push(nextPath);
      // The session cookie was set server-side; refresh so the shop layout
      // re-renders with the logged-in header and the merged cart count.
      router.refresh();
    });
  }

  function resend() {
    if (secondsLeft > 0 || pending) return;
    startTransition(async () => {
      const result = await requestOtpAction(contact);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSecondsLeft(RESEND_COOLDOWN);
      pushToast(fa.login.resentToast);
    });
  }

  const inputBorder = error ? "border-danger" : "border-ink/18";

  return (
    <div className="mx-auto grid max-w-[1280px] place-items-center px-5 pt-14 pb-24 lg:px-8">
      <div className="w-full max-w-[452px] overflow-hidden rounded-7 border border-ink/10 bg-surface p-8.5">
        {/* Keyed by step so contact -> code settles in as its own beat. */}
        <div key={step} className="km-note">
          {step === "contact" ? (
            <div>
              <h1 className="text-[25px] font-extrabold tracking-[-0.012em]">
                {fa.login.contactTitle}
              </h1>
              <p className="mt-3 mb-6.5 text-15 leading-[1.9] text-ink/65">
                {fa.login.contactBody}
              </p>

              <label className="flex flex-col gap-2.25 text-sm text-ink/70">
                {fa.login.contactLabel}
                <input
                  type="text"
                  value={contact}
                  autoComplete="username"
                  dir="ltr"
                  placeholder={fa.login.contactPlaceholder}
                  onChange={(e) => setContact(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitContact();
                  }}
                  className={`rounded-4 border ${inputBorder} bg-white p-3.75 text-start text-base text-ink`}
                />
              </label>

              <div
                aria-live="polite"
                className="min-h-5.5 pt-2 text-13 leading-[1.7] text-danger"
              >
                {error && (
                  <span key={error} className="km-note">
                    {error}
                  </span>
                )}
              </div>

              <Button
                type="button"
                onClick={submitContact}
                loading={pending}
                className="mt-2 w-full rounded-4 py-4 text-base font-bold"
              >
                {pending ? fa.login.requesting : fa.login.request}
              </Button>

              <p className="mt-4.5 text-12 leading-[1.85] text-ink/68">{fa.login.twoIdentities}</p>
            </div>
          ) : (
            <div>
              <h1 className="text-[25px] font-extrabold tracking-[-0.012em]">
                {fa.login.codeTitle}
              </h1>
              <p className="mt-3 mb-1.5 text-15 leading-[1.9] text-ink/65">
                {fa.login.codeSentToPre}
                <span dir="ltr" className="inline-block font-bold text-ink">
                  {contact}
                </span>
                {fa.login.codeSentToPost}
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep("contact");
                  setError(null);
                }}
                className="mb-6 cursor-pointer text-13 text-emerald transition-colors hover:text-emerald-live"
              >
                {fa.login.editContact}
              </button>

              <label className="flex flex-col gap-2.25 text-sm text-ink/70">
                {fa.login.codeLabel}
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={CODE_LENGTH}
                  dir="ltr"
                  placeholder="------"
                  value={code}
                  onChange={(e) => setCode(parseFaDigits(e.target.value).slice(0, CODE_LENGTH))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCode();
                  }}
                  className={`rounded-4 border ${inputBorder} bg-white p-3.75 text-center text-[23px] font-bold tracking-[0.42em] text-ink`}
                />
              </label>

              <div
                aria-live="assertive"
                className="min-h-5.5 pt-2 text-13 leading-[1.7] text-danger"
              >
                {error && (
                  <span key={error} className="km-note">
                    {error}
                  </span>
                )}
              </div>

              <Button
                type="button"
                onClick={submitCode}
                loading={pending}
                className="mt-2 w-full rounded-4 py-4 text-base font-bold"
              >
                {pending ? fa.login.verifying : fa.login.verify}
              </Button>

              <div className="mt-4.5 flex items-center justify-between gap-3 text-13 text-ink/70">
                <span>
                  {secondsLeft > 0 ? fa.login.resendIn(mmss(secondsLeft)) : fa.login.resendPrompt}
                </span>
                <button
                  type="button"
                  onClick={resend}
                  disabled={secondsLeft > 0 || pending}
                  className="cursor-pointer text-13 font-semibold text-emerald disabled:cursor-not-allowed disabled:text-ink/35"
                >
                  {fa.login.resend}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
