# i-Fare 基金會網站

> 社會福利資訊整合平台，提供民眾查詢福利政策、閱讀文章與最新消息，並提供後台管理系統供基金會人員維護內容。

---

## 專案架構與目錄對應

本專案由四個子項目組成，分為「前台」與「後台」兩套完整系統。
**原始碼在 `Dev/Dev Code/` 底下**——repo 內另有建置產物副本，不要在副本上開發：

```
ifare-website/
├── Dev/
│   ├── Dev Code/               ← ★ 原始碼（開發都在這裡）
│   │   ├── iFare_Frontend/     #    前台官方網站（公開給民眾，Nuxt 3）
│   │   ├── iFare_Frontend_API/ #    前台 API 服務（.NET 6 + ABP）
│   │   ├── iFare_Backend/      #    後台管理系統（內部人員，Vue 3 + Vite）
│   │   └── iFare_Backend_API/  #    後台 API 服務（.NET 6 + ABP）
│   ├── i-fare/                 # 部署副本：前台站台（web.config、web service.bat）
│   ├── i-fare_API/             # 部署副本：前台 API 建置產物
│   ├── Backend/                # 部署副本：後台 SPA 靜態檔
│   └── Backend_API/            # 部署副本：後台 API 建置產物
├── Prd/                        # 正式機副本（停在 v1.6.1，僅供比對，勿當開發基準）
├── docs/                       # 交接文件（.docx 給人看；.md 來源在 docs/src/）
├── diagrams/                   # 2026-04 舊架構圖（部分內容已過時，僅供歷史參考）
└── scripts/                    # 文件轉檔與追蹤清單工具
```

後文提到 `iFare_Frontend` 等名稱時，指的都是 `Dev/Dev Code/` 底下的對應資料夾。

---

## 各子項目說明

### `iFare_Frontend` — 前台官方網站

| 項目 | 說明 |
|---|---|
| **框架** | Nuxt 3（Vue 3 + SSR） |
| **樣式** | SCSS（模組化，含 RWD） |
| **HTTP** | Nuxt `$fetch`（`plugins/WebAPI.ts`，逾時 90 秒；前台未使用 Axios） |
| **部署** | IIS URL Rewrite 反向代理至 `127.0.0.1:3000` 的 Node 行程（Nitro preset：`node-server`） |
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
cd "Dev/Dev Code/iFare_Frontend"
npm install
npm run dev        # 開發模式
npm run build      # 正式建置（build_iis_node 已於 2026-09-01 棄用，見系統文件 2.3）
```

> dev 模式啟動後會自動用預設瀏覽器開啟 `http://localhost:3000/ifare`（見 `modules/dev-auto-open.ts`）。
> 設 `IFARE_DEV_OPEN=0` 可關閉；設 `IFARE_DEV_OPEN_PATH` 可改開其他頁面。

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
cd "Dev/Dev Code/iFare_Frontend_API"
# 使用 Visual Studio 開啟 IFare_API.sln
# 設定 appsettings.json 資料庫連線字串
# 執行 IFare_API.Web.Host 專案
# 注意：兩支 API 的 Kestrel 都綁 44311，本機不能同時啟動，
#       需用 Kestrel__Endpoints__Http__Url 覆寫其中一支
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
cd "Dev/Dev Code/iFare_Backend"
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
cd "Dev/Dev Code/iFare_Backend_API"
# 使用 Visual Studio 開啟 IFare_BDAPI.sln
# 設定 appsettings.json 資料庫連線字串
# 執行 IFare_BDAPI.Web.Host 專案
# ⚠️ 目前起得來但所有請求回 500：需先修 IFareContext.cs 的 49 處 HasMaxLength(-1)
#    （見 docs/iFare_系統文件 5.3 步驟 3）
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

## 協作分支策略（2026-09-01 依現況更正）

實際採用的流程：

```
master      ← 預設分支（正式基準）
feat/*      ← 功能開發（從 master 切出）
fix/*       ← Bug 修正
hotfix/*    ← 緊急修正
```

**開發流程：**
1. 從 `master` 切出新分支：`git checkout -b feat/你的功能名稱`
2. 完成開發後，推送分支並在 GitHub 發 **Pull Request** → `master`
3. 請另一位成員 Code Review 後合併

> 早期規劃的 main／develop 雙層流程從未建立（repo 沒有 develop 分支），`.github/CONTRIBUTING.md` 已同步更正。
> 現行開發分支 `feat/dev-v1.7.3-search-relevance` 領先 master 88 個 commit（2026-09-01），可快轉合併，建議儘早合回。

---

## 環境設定

請在各子項目根目錄（`Dev/Dev Code/` 底下）建立本地設定檔（不納入版控）：

| 子項目 | 設定檔 |
|---|---|
| iFare_Frontend | `.env`（參考 `.env.example`） |
| iFare_Frontend_API | `appsettings.json` → 填入 DB 連線字串 |
| iFare_Backend | `.env.local` |
| iFare_Backend_API | `appsettings.json` → 填入 DB 連線字串 |

---

## 文件

- **交接主文件**：`docs/iFare_系統文件.docx`（系統說明／API 參考／資料庫參考／部署交接／AI 行為規格，五合一）
- 文件來源是 `docs/src/iFare_系統文件.md`——**要改文件請改 .md**，再於 repo 根目錄執行 `npm install`（第一次）與 `npm run docs` 重產 .docx；直接改 .docx 會在下次轉檔時被覆蓋
- `diagrams/` 的架構圖繪於 2026-04，部分內容已過時（詳見 `diagrams/README.md`），現況以系統文件為準
- 搜尋／AI 的測試與回歸工具說明在 `Dev/Dev Code/iFare_Frontend/scripts/*/README.md`；repo 內全部 Markdown 的角色索引見系統文件 7.3「文件地圖」

---

## 聯繫

官方網站：[https://www.i-fare.org.tw](https://www.i-fare.org.tw)
