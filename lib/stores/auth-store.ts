import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  contact: string | null;
  isLoggedIn: boolean;
  loginSuccess: (contact: string) => void;
  logout: () => void;
}

/**
 * Demo-only client auth state — set from the simulated OTP flow in
 * lib/mock/auth.ts. No real session/cookie/JWT is issued.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      contact: null,
      isLoggedIn: false,
      loginSuccess: (contact) => set({ contact, isLoggedIn: true }),
      logout: () => set({ contact: null, isLoggedIn: false }),
    }),
    { name: "karamad-auth" }
  )
);
