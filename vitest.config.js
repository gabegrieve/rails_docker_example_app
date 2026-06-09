import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  test: {
    // jsdom gives the controller test a DOM to render into.
    environment: "jsdom",
    include: ["test/javascript/**/*.test.js"],
    globals: true
  },
  resolve: {
    alias: {
      // Mirror the importmap pin so the Stimulus controller's
      // `import ... from "lib/reading_time"` resolves under Node too.
      "lib/reading_time": fileURLToPath(
        new URL("./app/javascript/lib/reading_time.js", import.meta.url)
      )
    }
  }
})
