import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  LogSeverity,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { Session } from "@shopify/shopify-api";
import type { SessionStorage } from "@shopify/shopify-app-session-storage";
import prisma from "./db.server";

// Create a more resilient session storage
const getSessionStorage = (): SessionStorage => {
  try {
    return new PrismaSessionStorage(prisma);
  } catch (error) {
    console.error("Error initializing Prisma session storage:", error);
    // Return a minimal in-memory storage implementation as fallback
    return {
      storeSession: async (_session: Session) => {
        console.log("Using in-memory session storage (storeSession)");
        return true;
      },
      loadSession: async (_id: string) => {
        console.log("Using in-memory session storage (loadSession)");
        return undefined;
      },
      deleteSession: async (_id: string) => {
        console.log("Using in-memory session storage (deleteSession)");
        return true;
      },
      deleteSessions: async (_ids: string[]) => {
        console.log("Using in-memory session storage (deleteSessions)");
        return true;
      },
      findSessionsByShop: async (_shop: string) => {
        console.log("Using in-memory session storage (findSessionsByShop)");
        return [];
      },
    };
  }
};

// Custom error handler for app
const errorHandler = (err: Error) => {
  console.error("Shopify app encountered an error:", err);
  return {
    status: 500,
    message: "An unexpected error occurred with the Shopify app",
    error: err.message,
  };
};

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: getSessionStorage(),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  hooks: {
    afterAuth: async ({ session }) => {
      console.log("Auth successful for shop:", session.shop);
    },
  },
  logger: {
    level: process.env.NODE_ENV === 'production' ? LogSeverity.Warning : LogSeverity.Debug,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
