import Link from "next/link";
import { fa } from "@/lib/i18n/fa";

/**
 * Server Component — the logged-in state comes from the presence of the
 * httpOnly `customer_token` cookie, resolved by Header. No client store and
 * therefore no hydration guard to get wrong: the server already knows.
 */
export function HeaderAuthStatus({ loggedIn }: { loggedIn: boolean }) {
  return (
    <Link
      href={loggedIn ? "/account" : "/login"}
      className="j-hdr-ctl hidden rounded-pill px-4.5 py-2.5 text-sm lg:inline-flex"
    >
      {loggedIn ? fa.header.account : fa.header.login}
    </Link>
  );
}
