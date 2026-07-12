/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAME_WORKER_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
