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
    // 站內已經沒有任何連結會帶 reload，這條路只剩舊書籤與站外連結會走到。
    //
    // 原本的寫法是 router.replace(...) 再延遲呼叫 reloadNuxtApp：replace 會取消掉
    // 原本那次 push，而它執行的當下網址還停在「來源頁」，於是被覆蓋掉的是來源頁那
    // 一筆歷史紀錄。實測從搜尋結果點進政策明細後，結果頁整個從歷史中消失，按上一頁
    // 直接跳回 /ifare，使用者得重新搜尋一次。
    //
    // 改成一次 location.assign：它是 push 語意（location.replace 才是取代），
    // 來源頁那一筆留得住，也順便消掉原本 setTimeout 與導覽完成之間的競態。
    delete to.query.reload;
    const target = router.resolve({
      path: to.path,
      query: JSON.parse(JSON.stringify(to.query)),
      hash: to.hash,
    }).fullPath;

    // 瀏覽器已經停在帶 reload 的網址上（舊書籤、站外連結）→ 就地換掉這一筆。
    // 用 assign 會把「?reload=」那一筆留在歷史裡，使用者按上一頁又會被這段
    // 程式彈回來，變成退不出去的迴圈；replace 是就地取代，不留痕跡。
    if (window.location.search.includes("reload=")) {
      window.location.replace(target);
      return false;
    }

    // SPA 導覽途中才走到這裡。這時網址還停在來源頁，動 history 會吃掉來源頁
    // 那一筆——那正是「從政策明細按上一頁回不到搜尋結果」的成因。站內連結已經
    // 不再帶 reload，這個參數現在是惰性的（明細頁的 watcher key 在 id），
    // 放行讓導覽照常完成即可。
    return;
  }

  if (to.matched.length === 0 || !shouldTrackVisitorRecord(to.path)) {
    return;
  }

  void $WebApiPost("/Visitor/SetVisitorRecord", { router: to.path });
});
