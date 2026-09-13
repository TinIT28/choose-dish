interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_BASE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
