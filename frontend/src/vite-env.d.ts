/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PROGRESS_MODE: "sse" | "poll";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
