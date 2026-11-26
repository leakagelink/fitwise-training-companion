// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  react: { jsxImportSource: '@/features/language' },
  vite: {
    // Keep the runtime on the same app context instead of duplicating it in a prebundle.
    optimizeDeps: { exclude: ['@/features/language/jsx-runtime', '@/features/language/jsx-dev-runtime'] },
    plugins: [{
      name: 'app-language-runtime-context',
      configResolved(config) {
        // The React plugin explicitly includes its JSX runtime; local runtimes must remain source modules.
        config.optimizeDeps.include = config.optimizeDeps.include?.filter(name => !name.startsWith('@/features/language/')) ?? [];
      },
    }],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
