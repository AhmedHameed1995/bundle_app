/// <reference types="vite/client" />

// Fix declarations for missing types
interface ImportMeta {
  readonly env: {
    MODE: string;
    BASE_URL: string;
    PROD: boolean;
    DEV: boolean;
    SSR: boolean;
    [key: string]: string | boolean | undefined;
  };
  readonly hot?: {
    readonly data: any;
    accept(): void;
    accept(cb: (mod: any) => void): void;
    accept(dep: string, cb: (mod: any) => void): void;
    accept(deps: string[], cb: (mods: any[]) => void): void;
    dispose(cb: (data: any) => void): void;
    decline(): void;
    invalidate(): void;
    on(event: string, cb: (...args: any[]) => void): void;
  };
}

// Ensure Buffer is available in the global scope
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
  var Buffer: any;
} 