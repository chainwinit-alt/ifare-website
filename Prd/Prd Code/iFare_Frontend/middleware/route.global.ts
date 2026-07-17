const RELOAD_CACHE_TTL_MS = 3000;
const RELOAD_DEFER_MS = 10;
const VISITOR_RECORD_TTL_MS = 5 * 60 * 1000;
const VISITOR_RECORD_CACHE_KEY = "ifare:visitor-record-cache";

function shouldSkipVisitorRecord(path: string) {
  return path === "/preview" || path.startsWith("/api/") || path.startsWith("/_");
}

function shouldTrackVisitorRecord(path: string) {
  if (shouldSkipVisitorRecord(path)) {
    return false;
  }

  try {
    const now = Date.now();
    const rawCache = sessionStorage.getItem(VISITOR_RECORD_CACHE_KEY);
    const parsedCache = rawCache ? JSON.parse(rawCache) : {};
    const nextCache: Record<string, number> = {};

    for (const [cachePath, timestamp] of Object.entries(parsedCache)) {
      if (typeof timestamp === "number" && now - timestamp < VISITOR_RECORD_TTL_MS) {
        nextCache[cachePath] = timestamp;
      }
    }

    const trackedAt = nextCache[path];
    if (trackedAt && now - trackedAt < VISITOR_RECORD_TTL_MS) {
      sessionStorage.setItem(VISITOR_RECORD_CACHE_KEY, JSON.stringify(nextCache));
      return false;
    }

    nextCache[path] = now;
    sessionStorage.setItem(VISITOR_RECORD_CACHE_KEY, JSON.stringify(nextCache));
    return true;
  } catch (error) {
    console.warn("[route.global][visitor-cache]", error);
    return true;
  }
}

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server || to.path.startsWith("/api/")) {
    return;
  }

  const router = useRouter();
  const { $WebApiPost } = useNuxtApp();
  const isReload = Object.prototype.hasOwnProperty.call(to.query, "reload");

  if (isReload) {
    delete to.query.reload;
    const nextQuery = JSON.parse(JSON.stringify(to.query));
    router.replace({ path: to.path, query: nextQuery });
    setTimeout(() => {
      window.scrollTo(0, 0);
      reloadNuxtApp({ path: to.path, ttl: RELOAD_CACHE_TTL_MS });
    }, RELOAD_DEFER_MS);
    return;
  }

  if (to.matched.length === 0 || !shouldTrackVisitorRecord(to.path)) {
    return;
  }

  void $WebApiPost("/Visitor/SetVisitorRecord", { router: to.path });
});
