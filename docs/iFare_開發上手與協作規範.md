# iFare 基金會網站 — 開發上手與協作規範

> 版本：v2.0（整併版）
> 建立日期：2026-04-14
> 整併日期：2026-04-28
> 負責人：昀臻
>
> **檔案來源**：本檔由以下兩份文件整併而成：
> - `iFare_新人上手指南.md`（環境建置、帳號權限、專案結構導覽、業務熟悉路徑、FAQ）
> - `iFare_開發規範.md`（Git 流程、前/後台開發規範、Code Review）
>
> 整併原因：新人實務上會把這兩份一起看，分太開會來回跳。整併後依「新人入職時間軸」（第一天 → 第一週 → 持續性規範）重新排列。

---

## 目錄

### 一、專案簡介
- 1.1 iFare 是什麼（一段話說明）
- 1.2 系統組成（前台 / 後台 / 兩組 API / 資料庫）
- 1.3 你會接觸到的技術棧

### 二、第一天：環境建置
- 2.1 必要工具
  - Node.js（版本）
  - Git / GitHub CLI
  - VS Code（建議擴充套件清單）
  - SSMS（SQL Server Management Studio）
  - .NET 6 SDK（API 開發者必裝）
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
- 2.5 後端 API 啟動（iFare_Frontend_API / iFare_Backend_API）
  - dotnet restore
  - dotnet run（localhost:44311 / 44321）
  - 連線字串設定
- 2.6 常見啟動問題排除（→ 第十一章 FAQ）

### 三、第一天：帳號與權限申請
- 3.1 需要申請的帳號清單
  - GitHub 帳號 & repo 權限
  - 後台管理系統帳號
  - 遠端伺服器（VM）存取
  - SSMS 資料庫連線
- 3.2 找誰申請
- 3.3 帳號取得後的初次設定

### 四、第一週：認識專案結構
- 4.1 資料夾結構速覽（4 個子專案）
- 4.2 前台重點檔案導覽（10 個必看的檔案）
- 4.3 後台重點檔案導覽（10 個必看的檔案）
- 4.4 程式碼修改 → 畫面變化的對應關係
- 4.5 補充：技術細節請參閱 `iFare_專案總覽與系統架構.md`

### 五、Git 工作流程
- 5.1 分支策略
  - master（正式版，僅從 develop 合併）
  - develop（整合分支）
  - feature/* / fix/* / hotfix/*（功能/修復分支）
- 5.2 分支命名規範（含範例）
- 5.3 Commit 訊息格式
  - feat / fix / refactor / style / docs / chore / hotfix
  - 範例與反例
- 5.4 PR 流程與審核要點
- 5.5 合併策略（squash merge / rebase）
- 5.6 不可 commit 的本地修改
  - AjaxRef.ts 本地 baseURL 修改（assume-unchanged）
  - auto-imports.d.ts / components.d.ts 換行符差異處理

### 六、前台開發規範（Nuxt 3）
- 6.1 檔案命名慣例（pages / components / assets）
- 6.2 元件開發模式（Composition API + script setup）
- 6.3 Props / Emits 定義規範
- 6.4 API 呼叫方式（使用 `$WebApiGet` / `$WebApiPost`）
- 6.5 樣式撰寫規範
  - SCSS 檔案放置位置
  - 色彩/字型/間距使用變數
  - RWD 斷點使用方式
- 6.6 圖片/圖示新增流程
- 6.7 新增頁面的 checklist

### 七、後台開發規範（Vue 3）
- 7.1 新增 CRUD 模組的標準流程
  - 建立 4 個 view 檔案
  - 註冊路由（router/index.ts）
  - 新增 API 方法（WebAPI.ts）
  - 新增選單項目（AsideMenu.json）
  - 新增型別定義（interface/MTable.ts）
- 7.2 元件使用規範（Element Plus + 自訂元件）
- 7.3 狀態管理規範（何時用 Pinia / 何時用元件 state）
- 7.4 表格資料結構規範（TbDataInfo 繼承模式）
- 7.5 錯誤處理規範

### 八、共用規範
- 8.1 TypeScript 使用原則
- 8.2 console.log 清理（不可殘留）
- 8.3 註解撰寫原則
- 8.4 不可 commit 的檔案清單（AjaxRef.ts 等，詳見 5.6）
- 8.5 環境變數管理

### 九、Code Review Checklist
- 9.1 功能正確性
- 9.2 RWD 是否正常
- 9.3 無障礙基本檢查
- 9.4 效能考量
- 9.5 安全性檢查

### 十、第二週：熟悉業務
- 10.1 前台頁面巡覽指南（每頁功能說明）
- 10.2 後台管理功能操作指南
- 10.3 資料流程：使用者操作 → API → 資料庫 → 畫面
- 10.4 補充：完整業務邏輯請參閱 `iFare_功能與業務流程說明.md`

### 十一、常見問題 FAQ
- 11.1 npm install 失敗
- 11.2 dev server 啟動後白畫面
- 11.3 後台登入失敗
- 11.4 API 連線錯誤
- 11.5 git push 被拒絕
- 11.6 dotnet restore 失敗

---

## 變更紀錄

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| v1.0 | 2026-04-14 | 初版（新人上手指南 + 開發規範各自獨立） |
| v2.0 | 2026-04-28 | 整併兩份骨架成單一文件，依入職時間軸重排章節 |
