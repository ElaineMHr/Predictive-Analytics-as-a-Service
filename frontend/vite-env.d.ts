/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // to add more if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
