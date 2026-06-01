/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_API_BASE_URL?: string;
  readonly VITE_FRONTEND_BASE?: string;
  readonly VITE_FRONTEND_SYNC_URL?: string;
  readonly VITE_FRONTEND_ASSET_LIST_URL?: string;
  readonly VITE_FRONTEND_ASSET_UPLOAD_URL?: string;
  readonly VITE_FRONTEND_DYNAMIC_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
