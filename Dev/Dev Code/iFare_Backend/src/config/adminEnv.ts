const DEV_BACKEND_API_BASE_URL = 'https://localhost:44311';
const PROD_BACKEND_API_BASE_URL = '/ifare_bdapi';
const DEV_FRONTEND_BASE_URL = 'http://localhost:3000';

function readEnv(name: string): string {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  return String(env[name] || '').trim();
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function urlEnv(name: string, fallback: string): string {
  const value = readEnv(name);
  if (value) return trimTrailingSlash(value);
  return trimTrailingSlash(fallback);
}

function optionalUrlEnv(name: string, devFallback = ''): string {
  const value = readEnv(name);
  if (value) return trimTrailingSlash(value);

  if (import.meta.env.DEV && devFallback) {
    return trimTrailingSlash(devFallback);
  }

  return '';
}

function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return '';
  return `${trimTrailingSlash(baseUrl)}/${path.replace(/^\/+/, '')}`;
}

export const BACKEND_API_BASE_URL = urlEnv(
  'VITE_BACKEND_API_BASE_URL',
  import.meta.env.PROD ? PROD_BACKEND_API_BASE_URL : DEV_BACKEND_API_BASE_URL,
);

export const FRONTEND_BASE_URL = optionalUrlEnv(
  'VITE_FRONTEND_BASE',
  DEV_FRONTEND_BASE_URL,
);

export const FRONTEND_SYNC_URL =
  optionalUrlEnv('VITE_FRONTEND_SYNC_URL') ||
  joinUrl(FRONTEND_BASE_URL, '/api/dynamic-pages');

export const FRONTEND_ASSET_LIST_URL =
  optionalUrlEnv('VITE_FRONTEND_ASSET_LIST_URL') ||
  joinUrl(FRONTEND_BASE_URL, '/api/dynamic-assets');

export const FRONTEND_ASSET_UPLOAD_URL =
  optionalUrlEnv('VITE_FRONTEND_ASSET_UPLOAD_URL') ||
  joinUrl(FRONTEND_BASE_URL, '/api/dynamic-assets');

export const FRONTEND_DYNAMIC_API_TOKEN = readEnv('VITE_FRONTEND_DYNAMIC_API_TOKEN');

export const AGENT_RUNNER_URL = optionalUrlEnv(
  'VITE_AGENT_RUNNER_URL',
  'http://127.0.0.1:4873',
);
