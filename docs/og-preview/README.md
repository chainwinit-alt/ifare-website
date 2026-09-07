# 分享縮圖更新：2026-09-03

## 最新更新：全站分享標籤

實際檢查正式站 `/news`，當時仍回傳舊的 `og-logo.png`，且缺少 `og:title`、`og:description`、`og:url`。首頁、i-Fare、福利專欄也仍回傳舊圖片網址。

DEV、PRD 現在都由 `composables/useSiteSocialMeta.ts` 統一補齊 OG 標題、描述、類型、網站名稱、語系、完整分享網址、圖片規格，以及 Twitter 標籤與 canonical。

- 涵蓋首頁、關於長穩、最新消息列表與內容、福利專欄列表與內容、懶人包、公益夥伴、i-Fare 主頁／搜尋結果／政策內容／洽辦單位，以及後台建立的動態頁面。
- 保留頁面已有的精確標題與摘要；使用既有載入資料更新文章標題。資料尚未取得時，以該分頁的明確標題與描述作為保底，不額外增加 API 查詢。
- 分享網址保留政策／文章 ID 與搜尋條件，排除 `reload`、`preview`、`utm_*`、`fbclid`、`gclid` 等控制或追蹤參數及頁面錨點。
- 動態頁面沿用後台的標題與 SEO 描述，圖片仍固定為指定 Logo。
- `/preview` 保持預覽用途並標記 `noindex, nofollow`；`/future` 原本刻意停用的 404 行為不變；`/ifare/compare` 仍依原設定轉到 `/ifare`。
- 只更新本機部署成品，未直接部署或重啟正式站。

## 圖片

- 採用既有 `assets/img/Mobile-Menu-Logo.svg`，與使用者指定的 Logo 相同。DEV、PRD 原始向量檔 SHA-256 相同；未重新繪製圖樣或文字。
- 對外分享圖：`og-logo-safe-20260903.png`，1200 × 630 PNG，31,811 bytes。
- Logo 寬 560px、置中，完整圖樣位於中央 630 × 630 的方形裁切範圍內。
- 圖片 SHA-256：`2947415efc1bb5747ffbbdb4b4c1ce29da9866604b426d2b576ef3bd7f07a12b`。
- `index.html` 可直接開啟，查看橫式與手機方形裁切模擬。
- 方形圖僅為本機裁切預覽；實際 Facebook App 版型與快取須於部署後確認，不能保證所有平台採用相同裁切方式。

## 調整範圍

- DEV、PRD `app.vue` 呼叫共用分享標籤邏輯，OG、Twitter 圖片採新檔名。
- 有 `siteUrl` 時沿用設定；DEV 未設定時，圖片與預設分享網址採本次請求來源。各頁既有精確網址設定仍可覆寫共用預設值。API 位址不變。
- DEV 政策頁取消 `og-ifare.png` 覆寫，沿用全站 Logo。
- 保留原有圖片檔，避免既有圖片網址失效。
- 本次未調整 API、資料庫、後台、IIS、環境設定檔與既有啟動批次檔。
- DEV 先前「關鍵字建議最多 3 筆」的原始碼調整已包含於本次重新建置。

[Open Graph 規範](https://ogp.me/#structured) 沒有提供手機專用的圖片 media 條件；多張圖片也不是按裝置尺寸選擇，因此採用一張同時適用橫式與方形裁切的主圖。

## 已完成驗證

- DEV、PRD 皆以 Node 18.20.8 建置，結束碼為 0。
- 部署副本已將 Nitro 的目錄連結轉成實體套件檔，並在獨立暫存資料夾啟動，避免借用原始碼目錄的 `node_modules`。
- 最新全站標籤版以 DEV Node 18.20.8、PRD Node 18.18.2 通過獨立啟動驗證。
- 最終部署資料夾與通過測試的副本逐檔核對 SHA-256；兩份皆無目錄連結，且啟動入口存在。
- 每版 18 種網址情境，以爬蟲與手機 User-Agent 執行，共 36 項檢查。啟用頁面回傳 HTTP 200，各必要標籤僅一份、非空白、網址正確；原本停用的 `/future` 兩項測試維持 HTTP 404。
- 已檢查圖片 HTTP 200、PNG MIME、1200 × 630 尺寸、檔案 SHA-256、Twitter 圖片與 OG 圖片一致。
- 前一輪縮圖版本另驗證過 DEV 未設定 `siteUrl` 時的圖片網址回退；該回退行為保留。
- API 使用本機測試資料，沒有查詢或更動正式 API／資料庫。本次不是資料庫、登入或其他業務流程回歸測試。
- 最新完整結果見 `verification-all-pages-dev-v18.20.8-configured.json`、`verification-all-pages-prd-v18.18.2-configured.json`。其他 `verification-*.json` 是前一輪縮圖檢查紀錄。

## 部署成品

- 正式環境：`Prd/i-fare/.output`
- 測試環境：`Dev/i-fare/.output`

請搬部署成品，不要搬 `Dev Code`／`Prd Code` 下 Nuxt 原始建置的 `.output`，因為原始建置內含指向本機路徑的套件目錄連結。

## 上機後確認

1. 沿用既有前端更新流程，先備份、以空閒測試埠確認新版，再切換正式 Node 程序；不要直接覆蓋執行中的 `.output`。
2. 不需覆蓋 API、Backend、外層 `web.config` 或資料庫設定。
3. 確認網站的 `/og-logo-safe-20260903.png` 可以開啟。PRD 預期網址為 `https://www.i-fare.org.tw/og-logo-safe-20260903.png`。
4. 使用 [Facebook 分享偵錯工具](https://developers.facebook.com/tools/debug/) 檢查要分享的頁面，重新擷取後再用手機測試新分享。舊貼文、留言的圖片不保證立即更新。
