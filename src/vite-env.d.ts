// Extend ImportMeta with env types
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_KEY: string;
  // Add more environment variables as needed
  readonly VITE_APP_TITLE?: string;
  readonly VITE_NODE_ENV?: 'development' | 'production' | 'staging';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: (registration: ServiceWorkerRegistration) => void;
    onOfflineReady?: (registration: ServiceWorkerRegistration) => void;
    onRegisteredSW?: (swScriptUrl: string, registration: ServiceWorkerRegistration) => void;
    onRegisterError?: (error: any) => void;
  }

  export function registerSW(options?: RegisterSWOptions): {
    update: () => void;
  };
}