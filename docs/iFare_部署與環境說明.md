# iFare 基金會網站 — 部署與環境說明

> 版本：v1.0（草案）  
> 建立日期：2026-04-14  
> 負責人：昀臻  

---

## 目錄

### 一、環境總覽
- 1.1 環境對照表（本地開發 vs 正式環境）
- 1.2 架構拓撲圖（網路 / 伺服器 / 服務關係）
- 1.3 Port 與 URL 對照表

### 二、本地開發環境
- 2.1 必要工具安裝
  - 2.1.1 Node.js（版本需求）
  - 2.1.2 Git / GitHub CLI
  - 2.1.3 VS Code（建議擴充套件）
  - 2.1.4 SSMS（SQL Server Management Studio）
- 2.2 專案初始化
  - 2.2.1 git clone & 分支說明
  - 2.2.2 前台 npm install & dev server（localhost:3000）
  - 2.2.3 後台 npm install & dev server（localhost:5173）
- 2.3 環境設定
  - 2.3.1 前台 API 位址設定（WebAPI.ts）
  - 2.3.2 後台 API 位址設定（AjaxRef.ts — isDevMode）
  - 2.3.3 資料庫連線設定
- 2.4 開發注意事項
  - 2.4.1 AjaxRef.ts 本地修改不可 commit（assume-unchanged）
  - 2.4.2 auto-imports.d.ts / components.d.ts 換行符差異處理

### 三、正式伺服器環境
- 3.1 伺服器資訊（IP / OS / 規格）
- 3.2 IIS 設定
  - 3.2.1 前台站點（i-fare.org.tw — Nuxt SSR + IIS Node）
  - 3.2.2 後台站點（/ifare_backend — 靜態檔案）
  - 3.2.3 前台 API（/ifare_api — Kestrel 反向代理）
  - 3.2.4 後台 API（/ifare_bdapi — Kestrel 反向代理）
- 3.3 SQL Server 設定
  - 3.3.1 實體名稱與連線字串
  - 3.3.2 Windows 驗證 / Trusted Connection
- 3.4 SSL 憑證

### 四、部署流程
- 4.1 前台部署
  - 4.1.1 npm run build（Nitro SSR 建置）
  - 4.1.2 輸出目錄與檔案說明
  - 4.1.3 上傳至 IIS 站點
  - 4.1.4 IIS Node 設定（web.config）
- 4.2 後台部署
  - 4.2.1 npm run build（Vite 靜態建置）
  - 4.2.2 base path 設定（/ifare_backend/）
  - 4.2.3 輸出目錄與檔案說明
  - 4.2.4 上傳至 IIS 靜態站點
- 4.3 API 部署
  - 4.3.1 .NET Core 發佈指令
  - 4.3.2 appsettings.json 設定
  - 4.3.3 Kestrel + IIS 反向代理設定
  - 4.3.4 連線字串與資料庫遷移

### 五、Git 工作流程
- 5.1 分支策略（master / frontend / develop）
- 5.2 Commit 規範
- 5.3 PR 流程與範本
- 5.4 CI/CD（目前狀態與未來規劃）

### 六、監控與維護
- 6.1 Log 管理（log4net / IIS Log）
- 6.2 錯誤排查流程
- 6.3 效能監控
- 6.4 定期維護項目

### 七、常見問題
- 7.1 本地 dev server 無法啟動
- 7.2 API 連線失敗
- 7.3 資料庫連線問題
- 7.4 部署後頁面空白 / 404
- 7.5 Token 過期 / 登入問題
