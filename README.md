# i-Fare 基金會網站

> 社會福利資訊整合平台，提供民眾查詢福利政策、閱讀文章與最新消息，並提供後台管理系統供基金會人員維護內容。

---

## 專案架構

本專案由四個子項目組成，分為「前台」與「後台」兩套完整系統：

```
基金會網站/
├── iFare_Frontend/         # 前台官方網站（公開給民眾）
├── iFare_Frontend_API/     # 前台 API 服務
├── iFare_Backend/          # 後台管理系統（內部人員）
└── iFare_Backend_API/      # 後台 API 服務
```

---

## 各子項目說明

### `iFare_Frontend` — 前台官方網站

| 項目 | 說明 |
|---|---|
| **框架** | Nuxt 3（Vue 3 + SSR） |
| **樣式** | SCSS（模組化，含 RWD） |
| **HTTP** | Axios |
| **部署** | IIS（iis_node） |
| **SEO** | nuxt-simple-sitemap + Google Analytics |

**頁面路由：**
- `/` — 首頁
- `/about` — 關於基金會
- `/news` — 最新消息
- `/articles` — 文章專區（福利文章 / 懶人包）
- `/collaborator` — 公益夥伴
- `/ifare` — i-Fare 福利查詢（結果 / 詳細 / 洽辦）

**啟動方式：**
```bash
cd iFare_Frontend
npm install
npm run dev        # 開發模式
npm run build      # 正式建置
```

---

### `iFare_Frontend_API` — 前台 API

| 項目 | 說明 |
|---|---|
| **框架** | ASP.NET Core + ABP Framework v7.3 |
| **資料庫** | SQL Server + Entity Framework Core |
| **認證** | JWT Bearer Token |
| **架構** | DDD（領域驅動設計）Clean Architecture |

**主要模組：**
- 文章（懶人包、福利文章）查詢
- 福利政策多條件篩選
- 洽辦單位、常見問答、最新消息
- 公益夥伴、圖片管理、訪客紀錄

**啟動方式：**
```bash
cd iFare_Frontend_API
# 使用 Visual Studio 開啟 IFare_API.sln
# 設定 appsettings.json 資料庫連線字串
# 執行 IFare_API.Web.Host 專案
```

---

### `iFare_Backend` — 後台管理系統

| 項目 | 說明 |
|---|---|
| **框架** | Vue 3 + Vite + TypeScript |
| **UI 元件** | Element Plus |
| **狀態管理** | Pinia（含持久化） |
| **樣式** | SCSS |
| **富文字編輯** | TinyMCE |
| **圖表** | ApexCharts |
| **部署** | IIS |

**功能模組（需登入）：**
- 資料分析 Dashboard
- 最新消息 / 福利文章 / 懶人包 維護
- 福利政策 / 常見問答 / 洽辦單位 維護
- 代碼管理（政策類別、受助者、關鍵字、經濟條件、特殊身分、戶籍地）
- 帳戶管理 / 個人資料 / 圖片管理

**權限說明：**
- `管理者` — 全功能，含帳戶管理
- `編輯者` — 可維護所有內容
- `檢視者` — 僅能瀏覽文章與政策

**啟動方式：**
```bash
cd iFare_Backend
npm install
npm run dev        # 開發模式（Vite）
npm run build      # 正式建置
```

---

### `iFare_Backend_API` — 後台 API

| 項目 | 說明 |
|---|---|
| **框架** | ASP.NET Core + ABP Framework v7.3 |
| **資料庫** | SQL Server + Entity Framework Core |
| **認證** | JWT Bearer Token |
| **架構** | DDD Clean Architecture |

與前台 API 共用同一資料庫，但後台 API 包含完整 CRUD 操作（新增、編輯、刪除），前台 API 以唯讀查詢為主。

**啟動方式：**
```bash
cd iFare_Backend_API
# 使用 Visual Studio 開啟 IFare_BDAPI.sln
# 設定 appsettings.json 資料庫連線字串
# 執行 IFare_BDAPI.Web.Host 專案
```

---

## 資料庫模型

```
ArticleLazy          — 懶人包文章
ArticleWelfare       — 福利文章
IfarePolicy          — 福利政策（關聯身分、收入、關鍵字、受助者）
IfareOfficeUnit      — 洽辦單位（含戶籍地）
IfareQa              — 常見問答
Collaborator         — 公益夥伴
News                 — 最新消息
Image / ImgManage    — 圖片管理
VisitorRecord        — 訪客紀錄
Code 系列            — 各類代碼（政策、受助者、關鍵字、收入、身分、戶籍）
```

---

## 協作分支策略（Feature Branch）

```
main                    ← 正式穩定版（不直接 push）
├── develop             ← 整合開發分支
│   ├── feature/xxx     ← 各功能開發分支
│   ├── fix/xxx         ← 修正 Bug 分支
│   └── hotfix/xxx      ← 緊急修正分支
```

**開發流程：**
1. 從 `develop` 切出新分支：`git checkout -b feature/你的功能名稱`
2. 完成開發後，推送分支：`git push origin feature/你的功能名稱`
3. 在 GitHub 發起 **Pull Request** → `develop`
4. 請另一位成員 Code Review 後合併
5. 測試無誤後，從 `develop` → `main` 發 PR 正式上線

**命名規範：**
- 新功能：`feature/login-page`、`feature/news-api`
- 修 Bug：`fix/article-list-crash`
- 緊急修正：`hotfix/header-broken`

---

## 環境設定

請在各子項目根目錄建立本地設定檔（不納入版控）：

| 子項目 | 設定檔 |
|---|---|
| iFare_Frontend | `.env`（參考 `.env.example`） |
| iFare_Frontend_API | `appsettings.json` → 填入 DB 連線字串 |
| iFare_Backend | `.env.local` |
| iFare_Backend_API | `appsettings.json` → 填入 DB 連線字串 |

---

## 聯繫

官方網站：[https://www.i-fare.org.tw](https://www.i-fare.org.tw)
