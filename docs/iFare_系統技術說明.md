# iFare 基金會網站 — 系統技術說明

> 版本：v1.0（草案）  
> 建立日期：2026-04-14  
> 負責人：昀臻  

---

## 目錄

### 一、技術棧總覽
- 1.1 前台（iFare_Frontend）— Nuxt 3 / TypeScript / SCSS
- 1.2 後台（iFare_Backend）— Vue 3 / Vite / Element Plus / Pinia
- 1.3 API 服務 — ASP.NET Core / ABP Framework 7.3
- 1.4 資料庫 — SQL Server Express
- 1.5 版本對照表（各套件版本）

### 二、前台技術細節
- 2.1 Nuxt 3 框架設定（nuxt.config.ts）
- 2.2 目錄結構與檔案說明
- 2.3 頁面路由對照表（pages/ 自動路由）
- 2.4 共用元件規格（components/）
- 2.5 Plugin — WebAPI.ts（$WebApiGet / $WebApiPost）
- 2.6 Middleware — route.global.ts（訪客追蹤）
- 2.7 樣式系統架構（SCSS 模組化 / 色彩 / 字型 / RWD 斷點）
- 2.8 Nuxt Modules（nuxt-gtag / nuxt-simple-sitemap）
- 2.9 SEO 設定（Sitemap / Meta / routeRules）
- 2.10 建置指令與開發流程

### 三、後台技術細節
- 3.1 Vue 3 + Vite 框架設定（vite.config.ts）
- 3.2 目錄結構與檔案說明
- 3.3 路由定義與頁面模組對照表（router/index.ts）
- 3.4 CRUD 頁面模式（Index / DataList / AddEdit / Detail）
- 3.5 共用元件規格（components/）
- 3.6 狀態管理 — Pinia User Store（persist / token / permission）
- 3.7 認證流程（JWT Token 取得 → 儲存 → 過期檢查）
- 3.8 權限模型（管理者 / 編輯者 / 檢視者）與 Router Guard
- 3.9 API 通訊層（AjaxRef.ts / WebAPI.ts / CommonLib.ts）
- 3.10 TypeScript 型別定義（interface/）
- 3.11 側邊選單結構（AsideMenu.json）與權限過濾
- 3.12 建置指令與開發流程

### 四、第三方套件說明
- 4.1 前台套件清單與用途
- 4.2 後台套件清單與用途
- 4.3 套件版本風險評估
