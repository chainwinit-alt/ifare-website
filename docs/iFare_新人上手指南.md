# iFare 基金會網站 — 新人上手指南

> 版本：v1.0（草案）  
> 建立日期：2026-04-14  
> 負責人：昀臻  

---

## 目錄

### 一、專案簡介
- 1.1 iFare 是什麼（一段話說明）
- 1.2 系統組成（前台 / 後台 / 兩組 API / 資料庫）
- 1.3 你會接觸到的技術棧

### 二、第一天：環境建置
- 2.1 需要安裝的工具
  - Node.js（版本）
  - Git
  - VS Code（建議擴充套件清單）
  - SSMS（SQL Server Management Studio）
- 2.2 取得程式碼
  - git clone 指令
  - 分支說明（master / frontend / develop）
- 2.3 前台啟動（iFare_Frontend）
  - npm install
  - npm run dev → localhost:3000
  - 預期畫面截圖
- 2.4 後台啟動（iFare_Backend）
  - npm install
  - npm run dev → localhost:5173
  - 登入帳密取得方式
  - 預期畫面截圖
- 2.5 常見啟動問題排除

### 三、第一天：帳號與權限
- 3.1 需要申請的帳號清單
  - GitHub 帳號 & repo 權限
  - 後台管理系統帳號
  - 遠端伺服器（VM）存取
  - SSMS 資料庫連線
- 3.2 找誰申請

### 四、第一週：認識專案結構
- 4.1 資料夾結構速覽
- 4.2 前台重點檔案導覽（10 個必看的檔案）
- 4.3 後台重點檔案導覽（10 個必看的檔案）
- 4.4 程式碼修改 → 畫面變化的對應關係

### 五、第一週：開發流程
- 5.1 分支策略與命名規範
- 5.2 寫 code → commit → PR 的完整流程
- 5.3 AjaxRef.ts 本地修改不可 commit（assume-unchanged）
- 5.4 auto-imports.d.ts / components.d.ts 換行符處理

### 六、第二週：熟悉業務
- 6.1 前台頁面巡覽指南（每頁功能說明）
- 6.2 後台管理功能操作指南
- 6.3 資料流程：使用者操作 → API → 資料庫 → 畫面

### 七、常見問題 FAQ
- 7.1 npm install 失敗
- 7.2 dev server 啟動後白畫面
- 7.3 後台登入失敗
- 7.4 API 連線錯誤
- 7.5 git push 被拒絕
