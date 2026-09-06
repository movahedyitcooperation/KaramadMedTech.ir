import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest runs the source directly, without Next's compiler, so the `@/*` path
 * alias from tsconfig.json has to be repeated here — otherwise any test that
 * imports a module which itself imports `@/...` fails to resolve.
 *
 * No jsdom environment: these are pure unit tests over formatting and
 * request-building. A component test would need one, and would be the moment
 * to add @testing-library/react.
 */
export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
