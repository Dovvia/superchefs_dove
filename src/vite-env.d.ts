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