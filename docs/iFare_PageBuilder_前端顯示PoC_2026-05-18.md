# iFare PageBuilder — 前端顯示 PoC

**建立日期**：2026-05-18
**狀態**：PoC v4（2026-05-25：同步 token + CORS 白名單 + 圖片上傳防護）
**對應 xlsx 條目**：sheet2「後臺優化」#66

---

## 為什麼做這個

後台 PageManagement 的 PageBuilder（commit `cea8433` 大改後）已經能新增、編輯、儲存動態頁面，並在後台 iframe 預覽。但**新增完的頁面無法在前端正式網站看到** — 後台與前端是兩個獨立 app（後台 Vue / 前端 Nuxt），生產環境跨域 localStorage 不共享，且前端原本就沒有讀取動態頁面的路由。

**v1（commit 20dcad6）** 走通整條渲染鏈路，資料同步用「手動貼 JSON 到 localStorage」代替後端 API。
**v2（本次升級）** 改用 Nuxt server routes 當中介層自動同步：後台儲存 → fire-and-forget PUT 到 `/api/dynamic-pages` → 寫進 `server/data/dynamic-pages.json` → 前端 useAsyncData 讀取，達成「後台按下儲存 → 前端重整就看得到」端到端體驗。
**v3（2026-05-19）** 補齊圖片與預覽穩定性：後台可把本機圖片上傳到 Nuxt server route，前端正式路由可解析 `/api/dynamic-assets/...`；同時修正預覽裝置切換 class、儲存錯誤卡住 loading、`IPv4://` 圖片路徑等問題。
**v4（2026-05-25）** 補上 Nuxt bridge 寫入防護：`PUT /api/dynamic-pages`、`POST /api/dynamic-assets`、媒體庫清單需通過同步 token；CORS 改為 localhost 白名單或 `NUXT_DYNAMIC_API_ALLOWED_ORIGINS`；圖片上傳 MIME 白名單移除 SVG。

---

## 改了什麼

### v1（commit 20dcad6 — 渲染鏈路 PoC）

**後台（iFare_Backend）**

- `src/views/PageManagement/PageManagement_DataListView.vue`
  - 每列操作原本的「複製 JSON」按鈕在 Day2-fix 之後拿掉，改成「發布 / 下架」直接切 status（呼叫 update() 觸發 writeAll → 自動 sync）

**前端（iFare_Frontend）**

- `composables/useDynamicPages.ts`（新增，v2 已改寫成 async）
- `pages/[slug].vue`（新增，v2 已改寫成 SSR）

### v2（本次升級 — 自動同步 + SSR）

**後台（iFare_Backend）**

- `src/utils/frontendSync.ts`（新增）
  - `syncPagesToFrontend(pages)`：fetch wrapper，PUT 整批到前端 server
  - URL 從 `import.meta.env.VITE_FRONTEND_SYNC_URL` 取，預設 `http://localhost:3000/api/dynamic-pages`
  - fire-and-forget，失敗 console.warn 不打擾儲存體驗
- `src/composables/useDynamicPages.ts`（line 180-186 改動）
  - `writeAll()` 在 localStorage.setItem 後加 `syncPagesToFrontend(pages)` — 不 await
  - 所有 mutation（insert/update/remove/importJson）共用此函式，**改一處全 cover**
- `src/composables/useDynamicPages.ts:271 createDefaultPage()`（Day2-fix）
  - 預設 `status: 'draft'` → `'published'`
  - 符合「按下新增就到前端」直覺體驗
  - 想當草稿仍可主動切「草稿」儲存（toast 會 warning 提示不會在前端顯示）
- `src/composables/useFeedback.ts`
  - 新增 `successWithLink(options)` — 用 ElNotification + h() 渲染可點擊連結
- `src/views/PageManagement/PageManagement_AddEditView.vue`
  - 新增/更新成功的 toast 改用 `successWithLink`，附「前往前端預覽」連結
  - 點連結開新分頁 `${FRONTEND_PREVIEW_BASE}/${form.slug}`

**前端（iFare_Frontend）**

- `server/utils/cors.ts`（新增）
  - `applyCors(event)`：dev 環境 wildcard CORS
- `server/api/dynamic-pages.get.ts`（新增）
  - 讀 `server/data/dynamic-pages.json`，檔案不存在回 `[]`
- `server/api/dynamic-pages.put.ts`（新增）
  - readBody → 寫入 `server/data/dynamic-pages.json`（recursive mkdir）
  - 驗證是陣列，否則回 400
- `server/api/dynamic-pages.options.ts`（新增）
  - 處理 PUT 的 preflight，回 204 + CORS headers
- `server/data/.gitignore`（新增）
  - 忽略 `dynamic-pages.json`（測試資料不該 commit）
- `composables/useDynamicPages.ts`（改寫）
  - 移除 localStorage 讀取
  - 改用 `$fetch<DynamicPage[]>('/api/dynamic-pages')`
  - `getPageBySlug(slug)` 變 async，`isPublishable(page)` 保留 sync
- `pages/[slug].vue`（改寫）
  - 移除 `<ClientOnly>`、`onMounted`、`watch(slug, refresh)`、手寫 fallback UI
  - 改用 `useAsyncData('dynamic-page', fetcher, { watch: [slug] })`
  - 不存在或未發布 → `throw createError({ statusCode: 404, fatal: false })` 走 Nuxt 預設 404

### v3（2026-05-19 — 圖片上傳 + 預覽穩定性）

**後台（iFare_Backend）**

- `src/components/PageBuilder/PreviewPane.vue`
  - 修正 iframe 裝置切換 class，桌機 / 平板 / 手機會依選取版面切換寬度。
- `src/components/PageBuilder/SectionEditor.vue`
  - 圖文區塊新增「選擇本機圖片」，上傳到 `VITE_FRONTEND_ASSET_UPLOAD_URL`，預設 `http://localhost:3000/api/dynamic-assets`。
  - 阻擋直接貼 Windows 本機路徑（例如 `C:\Users\...\image.png`），避免前端正式站無法讀取本機檔。
- `src/views/PageManagement/PageManagement_AddEditView.vue`
  - 儲存流程補上 try/catch/finally，避免圖片或 sync 發生例外時按鈕一直 loading。
  - 偵測 `data:image/...` 與 localStorage quota 風險，提示使用者改用圖片上傳。

**前端（iFare_Frontend）**

- `server/api/dynamic-assets.post.ts` / `server/api/dynamic-assets.options.ts`
  - 提供 dev/staging 用圖片上傳 API；v3 原支援 `avif/gif/jpeg/png/svg/webp` 並限制 8MB，v4 起新上傳已移除 SVG。
- `server/api/dynamic-assets/[name].get.ts`
  - 以 API route 回傳圖片檔，避免直接暴露伺服器檔案路徑。
- `utils/dynamicImage.ts`
  - 統一解析 PageBuilder 圖片來源，修正 `IPv4://` / `IPv6://` 這類錯誤 scheme。
- `components/DynamicPage/SectionImageText.vue`
  - 圖片載入失敗時顯示明確 fallback，不再只留下破圖 icon。
- `server/utils/cors.ts`
  - CORS method 補齊 `POST` / `PUT`，讓後台同步與圖片上傳都能通過 preflight。

### v4（2026-05-25 — bridge hardening）

**後台（iFare_Backend）**

- `src/utils/frontendSync.ts`
  - 後台同步 PageBuilder JSON 與圖片上傳時，會從 `VITE_FRONTEND_DYNAMIC_API_TOKEN` 帶入 `X-iFare-Sync-Token`。
  - 若正式環境未設定 token，前台寫入 API 應視為未完成部署，不可放行內容異動。
- `src/components/PageBuilder/SectionEditor.vue`
  - 圖片上傳仍走 `VITE_FRONTEND_ASSET_UPLOAD_URL`，但前台 API 已要求 token 與 MIME 白名單。

**前端（iFare_Frontend）**

- `nuxt.config.ts`
  - 新增 `NUXT_DYNAMIC_API_TOKEN`：Nuxt server route 驗證後台同步與圖片上傳。
  - 新增 `NUXT_DYNAMIC_API_ALLOWED_ORIGINS`：正式環境明確列出允許跨域來源，逗號分隔。
- `server/utils/cors.ts`
  - 不再使用 wildcard CORS；開發預設只允許 localhost / 127.0.0.1 的 `3000`、`3001`、`4173`、`5173`。
  - production 若未設定 token，寫入 API 回 503；token 不符回 401。
- `server/api/dynamic-assets.post.ts`
  - 圖片上傳限制 8MB。
  - 允許 MIME：`image/avif`、`image/gif`、`image/jpeg`、`image/png`、`image/webp`。
  - SVG 不再允許新上傳；既有 SVG 檔即使被媒體庫列到，也不會被 `[name].get.ts` 當圖片送出。

### 重用，沒改

- 前端 `components/DynamicPage/DynamicPageRenderer.vue` 與 5 個 SectionXxx 元件
- 前端 `types/dynamic-page.ts`（與後台 schema 對齊）
- 前端 `pages/preview.vue`（後台 iframe 預覽通道照舊）

---

## demo 流程（v3）

需要同時跑後台與前端兩個 dev server。

1. **啟動後台**：`Dev/Dev Code/iFare_Backend` → `npm run dev`（預設 `http://localhost:5173`）
2. **啟動前端**：`Dev/Dev Code/iFare_Frontend` → `npm run dev`（預設 `http://localhost:3000`）
3. **後台新增**：開後台 → 「頁面管理」→ 「快速新增頁面」→ 選範本 → 進編輯
   - 必填欄位填妥，**狀態預設「已發布」直接存檔**（PoC v2 Day2-fix 起改的預設）
   - 圖文區塊如需圖片，使用「選擇本機圖片」上傳；不要直接貼 `C:\...` 本機路徑
   - 儲存成功 toast 顯示「頁面已新增 · 已同步到前端 · 前往前端預覽」
   - 若把狀態主動切「草稿」儲存 → toast 顯示 warning「前端不會顯示」
4. **前往前端**：點 toast 的「前往前端預覽」連結（或自己訪問 `http://localhost:3000/<slug>`）
   - 直接看到 PageBuilder 編出來的內容（**不需要再手動貼 localStorage**）
   - 圖片會以 `/api/dynamic-assets/<filename>` 載入；若顯示 fallback，先確認前端 dev server 與 `server/data/dynamic-assets/` 是否存在
5. **驗證邊界**：
   - 把該頁狀態改回「草稿」存檔 → 重整前端 `/<slug>` → 走 Nuxt 預設 404 頁
   - 訪問不存在的 slug `/not-exists` → 同樣走 404
   - 在 browser 看 `view-source:http://localhost:3000/<slug>` → HTML 內已含內容（SSR 渲染成功）

### 離線備援（前端 server 沒啟動時）

- 後台仍可儲存（localStorage 依然寫入）
- 後台 devtools console 看到 `[frontend-sync] 同步到前端失敗`，不影響儲存體驗
- 啟動前端後若要把現有資料補進去：對任一筆 page 點「發布」或「下架」（或進編輯頁存一次），會觸發 writeAll 重新整批 sync

---

## PoC 範圍與限制（v3）

| 項目 | v1 | v2 | v3 | 說明 |
|------|----|----|----|------|
| 渲染鏈路 | ✅ | ✅ | ✅ | DynamicPageRenderer 在前端正式路由可用 |
| 跨應用同步 | ⚠️ 手動 | ✅ 自動 | ✅ 自動 | 後台 writeAll() fire-and-forget PUT 到 Nuxt server，寫進 JSON 檔；dev/staging 可用，prod 建議改 .NET API |
| SEO / SSR | ❌ | ✅ | ✅ | useAsyncData，crawler 看得到 HTML |
| 404 真正回傳 | ❌ | ✅ | ✅ | useAsyncData + throw createError(404) 回真 HTTP 404 |
| 圖片上傳 | ❌ | ❌ | ✅ dev bridge | 目前由 Nuxt `/api/dynamic-assets` 收檔並存在 `server/data/dynamic-assets/`；正式環境仍建議換成後端或物件儲存 |
| 預覽裝置切換 | ❌ | ⚠️ class 未完整套用 | ✅ | 後台前台預覽可切桌機 / 平板 / 手機 |
| 發布排程 | ⚠️ 弱版 | ⚠️ 弱版 | ⚠️ 弱版 | 仍用 status + publishTime/unpublishTime 即時判斷，**無 worker** 自動切換 |
| slug 衝突 | ❌ | ❌ | ❌ | 後台沒擋 slug 跟靜態路由（about / news 等）撞 |
| 多人協作 | ❌ | ❌ | ❌ | PUT 是整批覆蓋，後台多開分頁同時編輯會互蓋 |
| prod 後端 | ❌ | ❌ | ⚠️ 可先跑 Nuxt route | Nuxt server JSON / assets 是中介層，上主機時要保留 runtime 資料並設定可寫入；長期仍建議 .NET API |
| 預設 status | draft | published | published | PoC v2 Day2-fix：新增頁面預設「已發布」配合 Emma「按下新增就到前端」期望。工程化時應改回 draft + 加審核流程 |

---

## 後續工程化路徑

v3 之後剩下的，依優先序：

1. **prod 後端 API**（必要）
   - 新增 `.NET` 端 endpoint：`GET/POST/PUT/DELETE /api/dynamic-pages`、`GET /api/dynamic-pages/{slug}`
   - 後台 `frontendSync.ts` 把 URL 改成 .NET endpoint（已預留 `VITE_FRONTEND_SYNC_URL` env var）
   - 前端 `composables/useDynamicPages.ts` 把 `$fetch` URL 改成 .NET（或保留 Nuxt server route 作 BFF proxy）
   - prod 環境關閉 Nuxt server route 的 wildcard CORS
   - 圖片 endpoint 也應一併工程化，避免正式環境只依賴 Nuxt server 本機資料夾
2. **發布排程 worker**
   - 後端 cron job 依 `publishTime` / `unpublishTime` 自動切 status
   - 或前端用 cache + TTL 重新驗證
3. **slug 衝突檢查**
   - 後台新增/編輯時擋掉跟既有靜態路由（`about`、`news`、`articles`、`collaborator`、`future`、`ifare`、`preview`、`index`）撞的 slug
   - 對應 `docs/iFare_新增頁面優化建議_2026-05-12.md` B 項
4. **多人協作避免互蓋**
   - 目前 PUT 整批覆蓋，後台多開分頁同時編輯會互蓋
   - 改成單筆 PUT/PATCH + optimistic locking（updateDate 比對）
5. **版本與審核**（`docs/iFare_後台內容治理規劃_2026-05-18.md`）
   - 草稿/已發布雙版本
   - 編輯歷史與回復
   - 多人協作的審核流程

---

## 相關檔案

| 角色 | 檔案 |
|------|------|
| 後台 列表 | `Dev/Dev Code/iFare_Backend/src/views/PageManagement/PageManagement_DataListView.vue` |
| 後台 編輯 | `Dev/Dev Code/iFare_Backend/src/views/PageManagement/PageManagement_AddEditView.vue` |
| 後台 資料層 + dual write | `Dev/Dev Code/iFare_Backend/src/composables/useDynamicPages.ts` (line 180-186) |
| 後台 sync wrapper | `Dev/Dev Code/iFare_Backend/src/utils/frontendSync.ts` |
| 後台 feedback composable | `Dev/Dev Code/iFare_Backend/src/composables/useFeedback.ts` |
| 後台 預覽 | `Dev/Dev Code/iFare_Backend/src/components/PageBuilder/PreviewPane.vue` |
| 後台 區塊編輯 / 圖片上傳 | `Dev/Dev Code/iFare_Backend/src/components/PageBuilder/SectionEditor.vue` |
| 前端 動態路由 (SSR) | `Dev/Dev Code/iFare_Frontend/pages/[slug].vue` |
| 前端 資料層 (async) | `Dev/Dev Code/iFare_Frontend/composables/useDynamicPages.ts` |
| 前端 API GET | `Dev/Dev Code/iFare_Frontend/server/api/dynamic-pages.get.ts` |
| 前端 API PUT | `Dev/Dev Code/iFare_Frontend/server/api/dynamic-pages.put.ts` |
| 前端 API OPTIONS | `Dev/Dev Code/iFare_Frontend/server/api/dynamic-pages.options.ts` |
| 前端 圖片 API POST | `Dev/Dev Code/iFare_Frontend/server/api/dynamic-assets.post.ts` |
| 前端 圖片 API GET | `Dev/Dev Code/iFare_Frontend/server/api/dynamic-assets/[name].get.ts` |
| 前端 CORS helper | `Dev/Dev Code/iFare_Frontend/server/utils/cors.ts` |
| 前端 資料檔（gitignored） | `Dev/Dev Code/iFare_Frontend/server/data/dynamic-pages.json` |
| 前端 圖片資料夾（gitignored） | `Dev/Dev Code/iFare_Frontend/server/data/dynamic-assets/` |
| 前端 渲染器 | `Dev/Dev Code/iFare_Frontend/components/DynamicPage/DynamicPageRenderer.vue` |
| 前端 預覽 | `Dev/Dev Code/iFare_Frontend/pages/preview.vue` |
| 前端 圖片路徑工具 | `Dev/Dev Code/iFare_Frontend/utils/dynamicImage.ts` |
| 共用型別 | `Dev/Dev Code/iFare_Frontend/types/dynamic-page.ts` |
