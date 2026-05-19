import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@nitor-skillhub/schemas": new URL("../schemas/src", import.meta.url).pathname,
    },
  },
});
