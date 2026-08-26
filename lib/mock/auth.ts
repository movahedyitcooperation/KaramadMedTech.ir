export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: string };

const CONTACT_RE = /^(09\d{9}|[\w.+-]+@[\w-]+\.[\w.-]+)$/;
const CODE_RE = /^\d{6}$/;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Demo-only simulated OTP request/verify — no real SMS is sent. Any
 * syntactically valid 6-digit code succeeds. Shaped like the {ok,data}|
 * {ok,error} result a real server action would return so a future
 * SMS/JWT-backed implementation can swap in behind the same signature.
 */
export async function requestOtp(input: {
  contact: string;
}): Promise<AuthResult<{ contact: string }>> {
  await delay(500);
  if (!CONTACT_RE.test(input.contact.trim())) {
    return { ok: false, error: "شماره موبایل یا ایمیل معتبر نیست" };
  }
  return { ok: true, data: { contact: input.contact.trim() } };
}

export async function verifyOtp(input: {
  contact: string;
  code: string;
}): Promise<AuthResult<{ contact: string }>> {
  await delay(500);
  if (!CODE_RE.test(input.code.trim())) {
    return { ok: false, error: "کد وارد شده صحیح نیست، یک کد ۶ رقمی وارد کنید" };
  }
  return { ok: true, data: { contact: input.contact } };
}
