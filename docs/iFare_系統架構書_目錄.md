# iFare 基金會網站 — 系統架構書

> 版本：v1.0（草案）  
> 建立日期：2026-04-14  
> 負責人：昀臻  

---

## 目錄

### 第一章｜專案概述
- 1.1 專案背景與目標
- 1.2 系統範圍（前台官網 / 後台管理 / API 服務 / 資料庫）
- 1.3 利害關係人與角色
- 1.4 名詞定義與縮寫對照

### 第二章｜系統架構總覽
- 2.1 系統架構圖（四層：使用者 → 前端 → API → 資料庫）
- 2.2 技術棧總覽表
- 2.3 環境說明（本地開發 / 正式伺服器）
- 2.4 網路架構與部署拓撲

### 第三章｜前台系統（iFare_Frontend）
- 3.1 架構圖
- 3.2 技術選型（Nuxt 3 / TypeScript / SCSS）
- 3.3 目錄結構說明
- 3.4 頁面路由對照表
- 3.5 共用元件說明
- 3.6 Plugin 與 Middleware
- 3.7 樣式系統（SCSS 架構 / 色彩 / 字型 / 響應式斷點）
- 3.8 資料流程（元件 → Plugin → API → 渲染）
- 3.9 SEO 設定（Sitemap / Meta / Google Analytics）
- 3.10 建置與部署流程（Nitro + IIS Node）

### 第四章｜後台系統（iFare_Backend）
- 4.1 架構圖
- 4.2 技術選型（Vue 3 / Vite / Element Plus / Pinia）
- 4.3 目錄結構說明
- 4.4 路由與頁面模組對照表
- 4.5 CRUD 頁面模式說明（Index / DataList / AddEdit / Detail）
- 4.6 共用元件說明
- 4.7 狀態管理（Pinia User Store）
- 4.8 認證與授權流程（JWT / Token 過期 / Router Guard）
- 4.9 權限模型（管理者 / 編輯者 / 檢視者）
- 4.10 API 通訊層（AjaxRef / WebAPI / CommonLib）
- 4.11 建置與部署流程（Vite build → IIS 靜態站）

### 第五章｜API 服務（ASP.NET Core + ABP）
- 5.1 架構圖（DDD 分層）
- 5.2 前台 API（iFare_Frontend_API）
  - 5.2.1 端點清單
  - 5.2.2 認證方式（JWT 關閉 / 公開讀取）
  - 5.2.3 回應格式
- 5.3 後台 API（iFare_Backend_API）
  - 5.3.1 端點清單
  - 5.3.2 認證方式（JWT 開啟 / Bearer Token）
  - 5.3.3 回應格式
- 5.4 前後台 API 差異對照
- 5.5 部署設定（Kestrel + IIS 反向代理）

### 第六章｜資料庫架構
- 6.1 資料庫清單與用途
  - 6.1.1 IFare（主資料庫 — 共用）
  - 6.1.2 IFare_FDAPIDb（前台 API 專用）
  - 6.1.3 IFare_BDAPIDb（後台 API 專用）
- 6.2 主要資料表說明
- 6.3 資料表關聯圖（ER Diagram）
- 6.4 連線方式（Windows 驗證 / Trusted Connection）

### 第七章｜部署與環境
- 7.1 環境對照表（本地 / 正式）
- 7.2 正式伺服器架構（112.121.114.177 / IIS + SQL Server）
- 7.3 建置指令說明
- 7.4 部署流程（前台 / 後台 / API）
- 7.5 環境變數與設定檔

### 第八章｜安全性
- 8.1 認證機制（JWT Bearer Token）
- 8.2 權限控制（三級角色）
- 8.3 API 存取控制
- 8.4 敏感資訊管理
- 8.5 已知安全風險與改善建議

### 第九章｜已知問題與改善計畫
- 9.1 UI/UX 問題盤點摘要（77 項）
- 9.2 三波改善優先順序
- 9.3 設計系統待建立項目
- 9.4 技術債清單

### 附錄
- A. UI/UX 問題追蹤清單（連結 Excel）
- B. API 端點完整清單
- C. 資料表欄位定義
- D. 架構圖原始檔（draw.io）
- E. 變更紀錄
