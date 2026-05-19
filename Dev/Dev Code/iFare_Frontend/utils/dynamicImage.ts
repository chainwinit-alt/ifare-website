const imageModules = import.meta.glob('../assets/img/**/*.{avif,gif,jpeg,jpg,png,svg,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const imageLookup = new Map<string, string>();

function normalizeLookupKey(value: string) {
  return value
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .toLowerCase();
}

function registerImageKey(key: string, resolvedUrl: string) {
  const normalized = normalizeLookupKey(key);
  if (normalized && !imageLookup.has(normalized)) {
    imageLookup.set(normalized, resolvedUrl);
  }
}

for (const [modulePath, resolvedUrl] of Object.entries(imageModules)) {
  const assetPath = modulePath.replace(/^\.\.\//, '');
  const fileName = assetPath.split('/').pop();

  registerImageKey(assetPath, resolvedUrl);
  if (fileName) registerImageKey(fileName, resolvedUrl);
}

function stripQueryAndHash(value: string) {
  const [path, suffix = ''] = value.split(/([?#].*)/, 2);
  return { path, suffix };
}

function extractAssetImageKey(path: string) {
  const normalizedPath = path.replace(/\\/g, '/');
  const marker = '/assets/img/';
  const lowerPath = normalizedPath.toLowerCase();
  const markerIndex = lowerPath.lastIndexOf(marker);

  if (markerIndex >= 0) {
    return normalizedPath.slice(markerIndex + 1);
  }

  return normalizedPath.replace(/^[@~]?\/*assets\/img\//i, 'assets/img/');
}

export function resolveDynamicImageSrc(src?: string | null) {
  const raw = (src || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^IPv[46]:\/\//i, 'http://');
  if (!raw) return '';

  if (/^(https?:)?\/\//i.test(raw) || /^(data|blob):/i.test(raw) || raw.startsWith('/_nuxt/')) {
    return raw;
  }

  const { path, suffix } = stripQueryAndHash(raw);
  const assetKey = extractAssetImageKey(path);
  const normalizedAssetKey = normalizeLookupKey(assetKey);
  const fileName = normalizedAssetKey.split('/').pop() || '';
  const resolved = imageLookup.get(normalizedAssetKey) || imageLookup.get(fileName);

  if (resolved) return `${resolved}${suffix}`;

  if (raw.startsWith('/')) return raw;

  return raw;
}
