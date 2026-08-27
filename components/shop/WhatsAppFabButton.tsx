"use client";

import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

/**
 * The product and cart pages carry a fixed action bar on small screens; on
 * those routes the FAB rides above it. Everywhere else it sits at the normal
 * bottom offset.
 */
export function WhatsAppFabButton({ href }: { href: string }) {
  const pathname = usePathname();
  const aboveActionBar = pathname === "/cart" || pathname.startsWith("/product/");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="گفتگو در واتساپ"
      className={cn(
        "fixed end-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95",
        "bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
        aboveActionBar && "max-md:bottom-[calc(6rem+env(safe-area-inset-bottom))]"
      )}
    >
      <WhatsappLogo size={28} weight="fill" aria-hidden="true" />
    </a>
  );
}
