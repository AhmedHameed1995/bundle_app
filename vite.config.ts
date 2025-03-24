import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals({ nativeFetch: true });

// Fix for HOST vs SHOPIFY_APP_URL issue
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost").hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT!) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  server: {
    host: "localhost",
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      strict: false,
      allow: [".", "../node_modules"],
    },
  },
  resolve: {
    preserveSymlinks: true,
  },
  build: {
    assetsInlineLimit: 0,
    sourcemap: true,
    minify: "esbuild",
    target: "es2020",
    rollupOptions: {
      // Ensure that optional packages are external
      external: [
        // External packages that should not be bundled
        /^node:.*/,
      ],
      // Remove the index.html input which doesn't exist in Remix apps
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("@shopify/polaris") || 
                id.includes("@shopify/app-bridge")) {
              return "vendor-shopify";
            }
            return "vendor";
          }
        },
      },
    },
  },
  optimizeDeps: {
    // Include dependencies that need to be pre-bundled
    include: [
      "@shopify/app-bridge-react",
      "@shopify/polaris",
    ],
    // Exclude dependencies that cause problems when optimized
    exclude: [
      "@remix-run/node",
      "@shopify/shopify-app-remix/adapters/node",
      "@shopify/shopify-app-remix/server",
      "@shopify/shopify-app-session-storage-prisma",
      "@prisma/client",
      "@shopify/shopify-app-remix/react",
      // Add all other server-only packages here
    ],
    esbuildOptions: {
      target: "es2020",
      // Fix the "define" problem in various packages
      define: {
        global: "globalThis",
      },
      // Avoid platform-specific optimizations
      platform: "browser",
    },
  },
  plugins: [
    // Special error handling for failed builds
    {
      name: "handle-build-errors",
      enforce: "pre",
      apply: "build",
      buildStart() {
        process.on("unhandledRejection", (err) => {
          console.warn("Build warning: Unhandled promise rejection", err);
        });
      },
    },
    remix({
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: false,
        v3_routeConfig: true,
      },
    }),
    tsconfigPaths(),
    {
      name: "skip-prisma-errors",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Skip middleware processing for Prisma errors
          if (req.url?.includes("prisma-error")) {
            res.statusCode = 200;
            res.end("Prisma error endpoint handled");
            return;
          }
          next();
        });
      },
    },
  ],
  ssr: {
    noExternal: ['@remix-run/*', '@shopify/*'],
    external: [
      // These need to be marked as external
      '@prisma/client',
      'prisma',
    ],
  },
  // Avoid sourcemap warnings
  clearScreen: false,
}) satisfies UserConfig;
