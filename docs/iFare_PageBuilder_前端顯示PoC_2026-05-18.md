# iFare PageBuilder — 前端顯示 PoC

**建立日期**：2026-05-18
**狀態**：PoC（概念驗證）
**對應 xlsx 條目**：sheet2「後臺優化」新增條目

---

## 為什麼做這個

後台 PageManagement 的 PageBuilder（commit `cea8433` 大改後）已經能新增、編輯、儲存動態頁面，並在後台 iframe 預覽。但**新增完的頁面無法在前端正式網站看到** — 後台與前端是兩個獨立 app（後台 Vue / 前端 Nuxt），生產環境跨域 localStorage 不共享，且前端原本就沒有讀取動態頁面的路由。

本 PoC 目標：**走通「後台新增 → 前端顯示」整條渲染鏈路**，把缺的部分補齊。資料同步暫時用「手動貼 JSON 到 localStorage」代替後端 API，後續再切換到真正的 API。

---

## 改了什麼

### 後台（iFare_Backend）

- `src/views/PageManagement/PageManagement_DataListView.vue`
  - 每列操作新增「複製 JSON」按鈕，把該頁的 JSON 複製到剪貼簿，方便貼到前端 devtools

### 前端（iFare_Frontend）

- `composables/useDynamicPages.ts`（新增）
  - 從 `localStorage['iFare_dynamic_pages_v2']` 讀取頁面陣列
  - `getPageBySlug(slug)`：依 slug 找頁
  - `isPublishable(page)`：判斷 status 是否 published + 是否在 publishTime / unpublishTime 區間內
- `pages/[slug].vue`（新增）
  - 動態路由（單段 slug，不會跟現有 `about` / `news` 等具名路由衝突）
  - 在 `<ClientOnly>` 內讀 localStorage，可發布的話用 `DynamicPageRenderer` 渲染，否則顯示「找不到頁面」+ 回首頁連結
  - `useHead` 設定 title / description

### 重用，沒改

- 後台 `composables/useDynamicPages.ts` — 既有 `exportJson` / `importJson`
- 前端 `components/DynamicPage/DynamicPageRenderer.vue` 與 5 個 SectionXxx 元件
- 前端 `types/dynamic-page.ts`（與後台 schema 對齊）
- 前端 `pages/preview.vue`（後台 iframe 預覽通道照舊）

---

## demo 流程

需要同時跑後台與前端兩個 dev server。

1. **啟動後台**
   - 切到 `Dev/Dev Code/iFare_Backend`
   - `npm run dev`（預設 `http://localhost:5173`）
2. **啟動前端**
   - 切到 `Dev/Dev Code/iFare_Frontend`
   - `npm run dev`（預設 `http://localhost:3000`）
3. **後台新增一個頁面**
   - 開 `http://localhost:5173/`，登入 → 進「頁面管理」
   - 點「快速新增頁面」→ 選一個範本（例如「介紹頁」）→ 輸入名稱（例如「Demo 頁」、slug 自動帶 `demo-page`）→ 進編輯
   - 必填欄位填一填，**狀態切到「已發布」**，存檔
4. **複製單筆 JSON**
   - 回頁面清單，那筆 row 點「複製 JSON」→ 提示「已複製到剪貼簿」
5. **貼進前端 localStorage**
   - 開 `http://localhost:3000/`
   - F12 開 devtools → Console，執行：
     ```js
     localStorage.setItem('iFare_dynamic_pages_v2', JSON.stringify([<貼上後台複製的 JSON>]));
     ```
     注意是**陣列**（即使只有一筆，外面也要 `[ ]`）。
6. **訪問前端動態頁**
   - 瀏覽 `http://localhost:3000/demo-page`（slug 換成你剛建的）→ 看到 PageBuilder 編出來的內容
7. **驗證邊界**
   - 把後台同一頁狀態改回「草稿」，重新「複製 JSON」→ 貼進前端 localStorage → 再訪問 `/demo-page` → 應顯示「找不到頁面」
   - 訪問不存在的 slug（例如 `/not-exists`）→ 顯示「找不到頁面」

---

## PoC 範圍與限制

| 項目 | 狀態 | 說明 |
|------|------|------|
| 渲染鏈路 | ✅ 走通 | DynamicPageRenderer 在前端正式路由可用 |
| 跨應用同步 | ⚠️ 手動 | 後台複製 JSON → 前端貼 localStorage；非自動 |
| 發布排程 | ⚠️ 弱版 | 用 `publishTime` / `unpublishTime` 做即時 client 判斷，**無 worker** 自動切換 |
| SEO / SSR | ❌ 不支援 | `<ClientOnly>` 包覆，crawler 看不到頁面內容 |
| slug 衝突 | ❌ 未檢查 | 後台新增時沒擋 slug 跟現有靜態路由（about / news 等）撞 |
| 404 真正回傳 | ❌ 走客端 | 不存在的 slug 仍回 HTTP 200，只在前端 render 顯示找不到 |

---

## 後續工程化路徑

PoC 之後要做的事，依優先序：

1. **後端 API**（必要）
   - 新增 `.NET` 端 endpoint：`GET/POST/PUT/DELETE /api/dynamic-pages`、`GET /api/dynamic-pages/{slug}`
   - 後台 `useDynamicPages.ts` 把 localStorage 改成打 API
   - 前端 `composables/useDynamicPages.ts` 把 localStorage 改成 `useFetch('/api/dynamic-pages/${slug}')`
2. **SSR + SEO**
   - 改用 `useAsyncData` 在 server-side 取資料，移除 `<ClientOnly>`
   - 不存在或未發布的 slug 用 `throw createError({ statusCode: 404 })` 回真正 404
3. **發布排程 worker**
   - 後端 cron job 依 `publishTime` / `unpublishTime` 自動切 status
   - 或前端用 cache + TTL 重新驗證
4. **slug 衝突檢查**
   - 後台新增/編輯時擋掉跟既有靜態路由（`about`、`news`、`articles`、`collaborator`、`future`、`ifare`、`preview`、`index`）撞的 slug
   - 對應 `docs/iFare_新增頁面優化建議_2026-05-12.md` B 項
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
| 後台 資料層 | `Dev/Dev Code/iFare_Backend/src/composables/useDynamicPages.ts` |
| 後台 預覽 | `Dev/Dev Code/iFare_Backend/src/components/PageBuilder/PreviewPane.vue` |
| 前端 動態路由 | `Dev/Dev Code/iFare_Frontend/pages/[slug].vue` |
| 前端 資料層 | `Dev/Dev Code/iFare_Frontend/composables/useDynamicPages.ts` |
| 前端 渲染器 | `Dev/Dev Code/iFare_Frontend/components/DynamicPage/DynamicPageRenderer.vue` |
| 前端 預覽 | `Dev/Dev Code/iFare_Frontend/pages/preview.vue` |
| 共用型別 | `Dev/Dev Code/iFare_Frontend/types/dynamic-page.ts` |
