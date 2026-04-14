# iFare 基金會網站 — 系統技術說明

> 版本：v1.0  
> 建立日期：2026-04-14  
> 負責人：昀臻  

---

## 一、技術棧總覽

iFare 基金會網站採用前後端分離架構，共由四個子系統組成：

| 子系統 | 用途 | 框架 | 語言 |
|--------|------|------|------|
| iFare_Frontend | 前台官方網站 | Nuxt 3 (SSR) | TypeScript |
| iFare_Backend | 後台管理系統 | Vue 3 + Vite | TypeScript |
| iFare_Frontend_API | 前台 API 服務 | ASP.NET Core + ABP 7.3 | C# |
| iFare_Backend_API | 後台 API 服務 | ASP.NET Core + ABP 7.3 | C# |

資料庫使用 SQL Server Express，共有 3 個資料庫（IFare 主資料庫、IFare_FDAPIDb、IFare_BDAPIDb）。

### 1.1 系統架構圖

系統整體架構分為四層：使用者層、前端應用層、API 服務層、資料庫層。

[此處插入圖片：iFare_前後端架構圖.png]

### 1.2 版本對照表

**前台（iFare_Frontend）套件版本：**

| 套件 | 版本 | 用途 |
|------|------|------|
| Nuxt | 3.7.4 | SSR 框架 |
| Vue | 3.3.4 | UI 框架 |
| Vue Router | 4.2.5 | 路由管理 |
| Axios | 1.6.2 | HTTP 請求（備用） |
| Sass | 1.69.5 | CSS 預處理 |
| normalize.css | 8.0.1 | CSS Reset |
| nuxt-gtag | 1.1.1 | Google Analytics |
| nuxt-simple-sitemap | 4.4.1 | SEO Sitemap |
| xml2js | 0.6.2 | XML 解析 |

**後台（iFare_Backend）套件版本：**

| 套件 | 版本 | 用途 |
|------|------|------|
| Vue | 3.3.4 | UI 框架 |
| Vue Router | 4.2.2 | 路由管理 |
| Vite | 4.3.9 | 建置工具 |
| TypeScript | 5.2.2 | 型別檢查 |
| Element Plus | 2.3.14 | UI 元件庫 |
| Pinia | 2.1.3 | 狀態管理 |
| pinia-plugin-persistedstate | 3.2.0 | 狀態持久化（localStorage） |
| Axios | 1.6.1 | HTTP 請求 |
| TinyMCE | 5.10.7 | 富文本編輯器 |
| ApexCharts | 3.45.2 | 數據圖表 |
| vue3-apexcharts | 1.4.4 | ApexCharts Vue 封裝 |
| html2canvas | 1.4.1 | 網頁截圖 |
| Sass | 1.63.6 | CSS 預處理 |
| Vitest | 0.32.0 | 單元測試框架 |

---

## 二、前台系統（iFare_Frontend）

### 2.1 架構圖說明

前台採用 Nuxt 3 框架，支援 SSR（伺服器端渲染），主要提供一般民眾瀏覽福利資訊與查詢福利政策。

架構分為以下區塊：

- **app.vue + layouts/default.vue**：根元件與全站版面，包含 AppHeader（導覽列）和 AppFooter（頁尾），管理手機選單開關狀態。
- **pages/**：Nuxt 自動路由，共 12 個頁面路由。核心功能為 i-Fare 福利查詢系列（ifare.vue / result.vue / info.vue / contact.vue）。
- **components/**：共用元件，包含版面元件（Header/Footer）、篩選元件（CompSelect 系列）、分頁元件（CompPage 系列）。
- **plugins/WebAPI.ts**：API 通訊封裝，提供 `$WebApiGet` 和 `$WebApiPost` 方法，使用 Nuxt 內建的 `$fetch`。
- **middleware/route.global.ts**：全域路由中介層，每次頁面切換時記錄訪客路徑、處理 reload 參數、捲動至頂部。
- **assets/**：靜態資源，包含 SCSS 樣式系統、SVG/PNG 圖片（40+）、字型（Noto Sans TC / Noto Serif TC / Roboto）。
- **Nuxt Modules**：nuxt-gtag（Google Analytics, ID: G-QCT2XVFX2L）、nuxt-simple-sitemap（SEO）、normalize.css（CSS Reset）。

[此處插入圖片：iFare_Frontend_架構圖.png]

### 2.2 目錄結構

```
iFare_Frontend/
├── app.vue                    根元件
├── nuxt.config.ts             Nuxt 設定檔
├── layouts/
│   └── default.vue            全站版面（AppHeader + slot + AppFooter）
├── pages/                     自動路由頁面
│   ├── index.vue              / — 首頁（Hero 輪播 + 最新消息 + 福利入口）
│   ├── about.vue              /about — 關於長穩
│   ├── news.vue               /news — 最新消息列表
│   ├── news/info.vue          /news/info — 消息內頁
│   ├── articles.vue           /articles — 福利專欄入口
│   ├── articles/welfare.vue   /articles/welfare — 福利文章
│   ├── articles/lazy.vue      /articles/lazy — 懶人包
│   ├── ifare.vue              /ifare — 福利查詢（核心功能）
│   ├── ifare/result.vue       /ifare/result — 查詢結果
│   ├── ifare/info.vue         /ifare/info — 福利詳情
│   ├── ifare/contact.vue      /ifare/contact — 洽辦單位
│   └── collaborator.vue       /collaborator — 公益夥伴
├── components/                共用元件
│   ├── AppHeader.vue          導覽列（桌面選單 + 手機漢堡選單）
│   ├── AppFooter.vue          頁尾（聯絡資訊 / LINE / Facebook）
│   ├── CompBreadCrumb.vue     麵包屑（空元件，未實作）
│   ├── CompSelect.vue         下拉選單（單選）
│   ├── CompSelectElse.vue     下拉選單（多選）
│   ├── CompSelectRecipient.vue 受助對象選擇器
│   ├── CompPage.vue           分頁元件（數字型）
│   └── CompPageNum.vue        分頁元件（簡潔型）
├── plugins/
│   └── WebAPI.ts              API 封裝（$WebApiGet / $WebApiPost）
├── middleware/
│   └── route.global.ts        全域路由中介層（訪客追蹤）
└── assets/
    ├── style/                 SCSS 樣式系統
    │   ├── styleIFare.scss    入口檔
    │   ├── _color.scss        色彩變數
    │   ├── _font.scss         字型定義（839 行）
    │   ├── _mixin.scss        共用 mixin
    │   ├── _animation.scss    動畫
    │   ├── _transition.scss   過場效果
    │   ├── _icon.scss         圖示 class
    │   ├── components/        元件樣式（_app / _appBody / _button 等）
    │   └── rwd/               響應式樣式（主要斷點 1024px）
    ├── img/                   SVG 圖示 + PNG 圖片
    └── fonts/                 Noto Sans TC / Noto Serif TC / Roboto
```

### 2.3 頁面路由對照表

| 路由 | 檔案 | 功能說明 |
|------|------|---------|
| `/` | index.vue | 首頁：Hero 輪播、最新消息摘要、福利查詢入口 |
| `/about` | about.vue | 關於長穩：基金會介紹、三大核心、團隊成員 |
| `/news` | news.vue | 最新消息列表，支援分頁 |
| `/news/info` | news/info.vue | 消息內頁，依 query `id` 載入 |
| `/articles` | articles.vue | 福利專欄入口：福利文章 + 懶人包兩個區塊 |
| `/articles/welfare` | articles/welfare.vue | 福利文章詳情，支援相關專欄推薦 |
| `/articles/lazy` | articles/lazy.vue | 懶人包詳情（圖片式內容），支援相關懶人包推薦 |
| `/ifare` | ifare.vue | 福利查詢（核心）：多條件篩選 + FAQ |
| `/ifare/result` | ifare/result.vue | 查詢結果列表，支援二次篩選與分頁 |
| `/ifare/info` | ifare/info.vue | 福利詳情：資格條件、福利內容、應備證件、洽辦單位 |
| `/ifare/contact` | ifare/contact.vue | 洽辦單位：依地區分類的聯絡資訊 |
| `/collaborator` | collaborator.vue | 公益夥伴：合作單位展示 |

### 2.4 共用元件說明

**版面元件：**
- AppHeader.vue — 導覽列、桌面選單 + 手機漢堡、路由 active 高亮
- AppFooter.vue — 頁尾、聯絡資訊 / LINE / FB
- CompBreadCrumb.vue — 空元件

**篩選元件：**
- CompSelect.vue — 下拉單選
- CompSelectElse.vue — 多選
- CompSelectRecipient.vue — 受助對象選擇

**分頁元件：**
- CompPage.vue — 數字型
- CompPageNum.vue — 簡潔型

Composition API + Auto Import，Props 傳入 / Events 傳出，無全域狀態管理。

### 2.5 Plugin 與 Middleware

**plugins/WebAPI.ts — API 通訊封裝**

提供全站使用的 API 呼叫方法：
- `$WebApiGet(path, query?)` — GET 請求
- `$WebApiPost(path, query?)` — POST 請求

Base URL：`https://www.i-fare.org.tw/ifare_api/api/services/app`

使用 Nuxt 內建 `$fetch` 封裝，錯誤處理為 `.catch → console.error`。

**middleware/route.global.ts — 全域路由中介層**

每次路由切換時自動執行：
1. 呼叫 `/Visitor/SetVisitorRecord` 記錄訪客瀏覽路徑
2. 檢查 query 參數是否需要 reload（`reloadNuxtApp()`）
3. 視窗捲動至頂部

### 2.6 樣式系統

前台樣式採用 SCSS 模組化架構，入口檔為 `assets/style/styleIFare.scss`。

**核心檔案：**

| 檔案 | 用途 |
|------|------|
| _color.scss | 色彩變數 |
| _font.scss | 字型定義（839 行） |
| _mixin.scss | 共用 mixin |
| _animation.scss | 動畫 |
| _transition.scss | 過場效果 |
| _icon.scss | 圖示 class |

**元件樣式（components/）：** _app.scss, _appBody.scss, _appHeader.scss, _appFooter.scss, _button.scss, _compSelect.scss, _compPage.scss 等。

**響應式（rwd/）：** 10+ 個 RWD 樣式檔（主用 1024px）。

### 2.7 Nuxt Modules 與 SEO

| 模組 | 用途 | 設定 |
|------|------|------|
| nuxt-gtag | Google Analytics 流量追蹤 | ID: G-QCT2XVFX2L |
| nuxt-simple-sitemap | XML Sitemap 產生 | 各路由設定 priority / changefreq |
| normalize.css | CSS Reset 標準化 | 全域載入 |

**routeRules SEO 設定：** nuxt.config.ts 中為各路由設定 priority / freq。

### 2.8 建置指令

| 指令 | 用途 |
|------|------|
| `npm run dev` | 啟動開發伺服器（localhost:3000） |
| `npm run build` | 正式建置（SSR） |
| `npm run build_iis_node` | IIS Node 部署建置 |
| `npm run generate` | 靜態生成（SSG） |
| `npm run preview` | 預覽正式建置結果 |

### 2.9 資料流程

```
使用者操作（篩選/搜尋/換頁）
        ↓
  Vue 元件 (pages/*.vue)
        ↓
  Plugin ($WebApiGet / $WebApiPost)
        ↓
  $fetch → HTTPS GET/POST
        ↓
  外部 API: i-fare.org.tw/ifare_api/api/services/app/*
        ↓
  API 回傳 JSON（ABP 格式）
  { result: { result: [...], errCode: 0 }, success: true }
        ↓
  元件接收資料 → 渲染畫面
```

---

## 三、後台系統（iFare_Backend）

### 3.1 架構圖說明

後台採用 Vue 3 + Vite 框架，搭配 Element Plus UI 元件庫和 Pinia 狀態管理，提供管理員進行內容管理（CRUD）。

架構分為以下區塊：

- **認證 & 權限系統**：LoginView.vue 負責登入流程（兩步驟：取得 JWT Token → 取得使用者資訊），Pinia User Store 儲存 Token 和權限，Router Guard 在每次路由切換時驗證登入狀態和角色權限。
- **三種角色**：管理者（全功能 + 帳號管理）、編輯者（內容 + 代碼維護）、檢視者（僅瀏覽福利文章/政策，唯讀）。
- **router/index.ts**：共 20 組模組路由（45+ 條），每組模組遵循 3~4 頁結構（Index / DataList / AddEdit / Detail），Code 模組僅 3 頁（無 Detail）。
- **main.ts 進入點**：createApp(App).use(ElementPlus, {locale: zhTw}).use(Pinia + persistedstate).use(Router).provide($WebAPI, $CommonLib)。
- **App.vue**：包含 AppAside（側邊選單，依權限過濾）、AppHeader（頂部列）、RouterView。
- **views/**：頁面模組，分為內容管理（7 個模組）、代碼維護（6 種）、系統管理（Dashboard / 帳號 / 個人設定 / 圖片管理）。
- **components/**：共用元件，分為版面元件（AppAside / AppHeader / MainHeader）、資料元件（CardTable / CardSearchParam / CompHtmlEditor）、表單元件（各種 Input / Dialog）。
- **plugins/ — API 通訊層**：AjaxRef.ts（HTTP 請求設定類別）、WebAPI.ts（全域 API 端點定義，65+ 方法）、CommonLib.ts（工具函式庫）。

[此處插入圖片：iFare_Backend_架構圖.png]

### 3.2 目錄結構

```
iFare_Backend/
├── src/
│   ├── App.vue                    根元件（AppAside + AppHeader + RouterView）
│   ├── main.ts                    進入點（Element Plus / Pinia / Router）
│   │
│   ├── router/
│   │   └── index.ts               路由定義（45+ 條）+ 權限守衛
│   │
│   ├── stores/
│   │   └── user.ts                Pinia 使用者狀態（token / permission / persist）
│   │
│   ├── plugins/
│   │   ├── AjaxRef.ts             HTTP 請求設定（baseUrl / headers / method）
│   │   ├── WebAPI.ts              API 端點方法定義（65+ 方法，500+ 行）
│   │   └── CommonLib.ts           工具函式（日期格式化 / 深拷貝 / 路由跳轉）
│   │
│   ├── components/
│   │   ├── AppAside.vue           側邊導覽列（依權限過濾選單）
│   │   ├── AppHeader.vue          頂部列（麵包屑 + 使用者資訊）
│   │   ├── MainHeader.vue         頁面標題 + 操作按鈕
│   │   ├── CardTable.vue          資料表格（分頁 / 排序 / 操作欄）
│   │   ├── CardSearchParam.vue    搜尋篩選面板
│   │   ├── CompHtmlEditor.vue     TinyMCE 富文本編輯器
│   │   ├── CompDateRangePicker.vue 日期範圍選擇器
│   │   ├── DialogAddEditImg.vue   圖片上傳/編輯對話框
│   │   ├── DialogAlert.vue        通用警告對話框
│   │   └── DialogErrorInfo.vue    錯誤訊息對話框
│   │
│   ├── views/                     頁面模組（CRUD 模式）
│   │   ├── LoginView.vue          登入頁
│   │   ├── HomeView.vue           首頁 Dashboard
│   │   ├── Analysis/              數據分析（ApexCharts 圖表）
│   │   ├── News/                  最新消息 CRUD
│   │   ├── Articles/
│   │   │   ├── Welfare/           福利文章 CRUD
│   │   │   └── Lazy/              懶人包 CRUD
│   │   ├── IFare/
│   │   │   ├── Policy/            福利政策 CRUD
│   │   │   ├── QA/                常見問題 CRUD
│   │   │   └── OfficeUnit/        洽辦單位 CRUD
│   │   ├── Collaborator/          公益夥伴 CRUD
│   │   ├── Code/                  代碼維護（×6 種）
│   │   ├── Account/               帳號管理
│   │   ├── Personal/              個人設定
│   │   └── ImgManager/            圖片管理
│   │
│   └── interface/                 TypeScript 型別定義
│       ├── MTable.ts              表格資料結構（TbDataInfo 繼承體系）
│       ├── Login.ts               登入表單型別
│       ├── ABPFormat.ts           API 回應格式
│       ├── SelectOptions.ts       選單選項型別
│       └── IFareOfficeUnit.ts     洽辦單位型別
│
├── data/
│   ├── AsideMenu.json             側邊選單結構（依權限過濾）
│   └── TestDataList/              各模組測試假資料
│
└── vite.config.ts                 Vite 設定（base path / auto-import）
```

### 3.3 CRUD 頁面模式

後台每個內容管理模組都遵循統一的頁面結構：

```
{Module}_IndexView.vue        路由容器
├── {Module}_DataListView.vue 列表頁
│     ├── MainHeader          標題 + [新增] 按鈕
│     ├── CardSearchParam     篩選面板（日期範圍 / 狀態 / 關鍵字）
│     └── CardTable           資料表格 + 分頁
│           ├── [檢視] → ItemDetailView
│           ├── [編輯] → AddEditView?id=xxx
│           └── [刪除] → API Delete
│
├── {Module}_AddEditView.vue  新增/編輯頁
│     ├── MainHeader          標題 + [儲存][取消] 按鈕
│     ├── 表單欄位            依模組不同
│     └── CompHtmlEditor      富文本內容（部分模組）
│
└── {Module}_ItemDetailView.vue 詳情頁
      ├── MainHeader          標題 + [編輯][刪除] 按鈕
      └── 唯讀資料顯示
```

Code 代碼維護模組僅有 3 頁（無 ItemDetailView），因為代碼資料結構簡單。

### 3.4 認證與授權流程

**登入流程（兩步驟）：**

```
使用者輸入帳密
    ↓
步驟 1：POST /api/TokenAuth/Authenticate
    → 回傳 JWT Token
    ↓
步驟 2：POST /api/services/app/Main/Login（帶 Token）
    → 回傳使用者資訊（userName / email / userID / permission / expiredTime）
    ↓
Pinia User Store 儲存（persist: true → localStorage）
    ↓
Router 導向首頁
```

**Token 過期檢查：** HomeView.vue 設定每 3 分鐘檢查一次，若 `new Date() > tokenExpiredTime` 則自動登出並導向登入頁。

**Router Guard（路由守衛）：**

| 檢查順序 | 規則 | 動作 |
|---------|------|------|
| 1 | 未登入且路由需驗證 | 導向 /Login |
| 2 | 檢視者存取非授權路由 | 導向 /NoPermission |
| 3 | 非管理者存取帳號管理 | 導向 /NoPermission |

**三種角色權限範圍：**

| 角色 | 可存取功能 | 限制 |
|------|-----------|------|
| 管理者 | 全部功能 + 帳號管理 | 無 |
| 編輯者 | 內容管理 + 代碼維護 | 無帳號管理 |
| 檢視者 | 福利文章 + 福利政策（唯讀） | 僅能瀏覽，無新增/編輯/刪除 |

### 3.5 API 通訊層

後台 API 通訊由三個 Plugin 組成：

**AjaxRef.ts — HTTP 請求設定類別**

```
baseUrl:    https://112.121.114.177/ifare_bdapi（正式環境）
middleUrl:  /api/services/app
完整 URL:   baseUrl + middleUrl + httpUrl

Headers:    Authorization: "Bearer " + token
            Content-Type: application/json; charset=utf-8
Method:     get / post / get/file / post/file
```

**WebAPI.ts（$WebAPI）— API 端點方法**

全域注入 65+ 個 API 方法，按模組分組：

| 模組 | 方法數 | 端點 |
|------|--------|------|
| 認證 | 2 | Auth / Login |
| 最新消息 | 4 | GetNewsList / Insert / Update / Delete |
| 福利文章 | 4 | GetArticlesWelfareList / Insert / Update / Delete |
| 懶人包 | 4 | GetArticlesLazyList / Insert / Update / Delete |
| 福利政策 | 4 | GetFarePolicyList / Insert / Update / Delete |
| 常見問題 | 4 | GetFareQAList / Insert / Update / Delete |
| 洽辦單位 | 3 | GetFareOfficeUnitList / Insert / Update |
| 公益夥伴 | 4 | GetCollaboratorList / Insert / Update / Delete |
| 代碼維護 | 18 | 6 種 × Get / Insert / Update |
| 帳號管理 | 3 | GetAccountList / Insert / Update |
| 個人設定 | 3 | GetPersonalInfo / Update / UpdatePwd |
| 圖片管理 | 4 | GetImgManagerList / Insert / Edit / Delete |
| 流量分析 | 2 | GetVisitorSummary / GetVisitorChartData |

所有方法採用 Callback 模式（非 Promise），第一個參數固定為 `token`（JWT）。收到 401 錯誤時自動登出。

**CommonLib.ts（$CommonLib）— 工具函式**

| 方法 | 用途 |
|------|------|
| Date.GetDateNow() | 取得當前日期（zh-tw 格式） |
| Date.GetFormatDateString(date) | 日期格式化 |
| ResetObjRef(obj, initObj) | 重設物件為初始值 |
| CheckValueType(val, types) | 型別檢查 |
| CopyArrayObj(obj) | 深拷貝（JSON.parse/stringify） |
| GuideToPage(routeName, options) | Router.push 封裝 |
| GetImgBase64(file) | 檔案轉 Base64 Data URL |

### 3.6 建置指令

| 指令 | 用途 |
|------|------|
| `npm run dev` | 啟動開發伺服器（localhost:5173） |
| `npm run build` | 正式建置（含 type-check） |
| `npm run build-only` | 僅建置不檢查型別 |
| `npm run type-check` | TypeScript 型別檢查 |
| `npm run test:unit` | 執行 Vitest 單元測試 |
| `npm run preview` | 預覽正式建置結果 |

正式建置輸出為靜態檔案，base path 為 `/ifare_backend/`，部署至 IIS 靜態站點。

---

## 四、第三方套件說明

### 4.1 前台套件用途

| 套件 | 用途 | 重要性 |
|------|------|--------|
| nuxt | SSR 框架，自動路由、Plugin、Middleware | 核心 |
| vue | 前端 UI 框架 | 核心 |
| sass | SCSS 編譯 | 核心 |
| normalize.css | 瀏覽器樣式重設 | 基礎 |
| nuxt-gtag | Google Analytics 追蹤碼注入 | 功能 |
| nuxt-simple-sitemap | SEO Sitemap 自動產生 | SEO |
| axios | HTTP 請求（目前未使用，前台改用 $fetch） | 備用 |
| xml2js | XML 解析 | 輔助 |

### 4.2 後台套件用途

| 套件 | 用途 | 重要性 |
|------|------|--------|
| vue + vue-router | 前端框架 + 路由 | 核心 |
| vite | 開發伺服器 + 建置工具 | 核心 |
| element-plus | UI 元件庫（表格/表單/對話框等） | 核心 |
| pinia | 全域狀態管理（使用者登入資訊） | 核心 |
| pinia-plugin-persistedstate | 狀態持久化至 localStorage | 核心 |
| axios | HTTP 請求客戶端 | 核心 |
| tinymce | 富文本編輯器（福利內容/文章編輯） | 功能 |
| apexcharts + vue3-apexcharts | 數據分析圖表 | 功能 |
| html2canvas | 網頁截圖 | 輔助 |
| typescript | 型別檢查 | 開發 |
| vitest | 單元測試框架 | 測試 |
| unplugin-auto-import | Element Plus 自動匯入 | 開發 |
| unplugin-vue-components | Vue 元件自動註冊 | 開發 |

### 4.3 注意事項

- TinyMCE 使用 5.x 版本（非最新 7.x），升級需評估相容性
- Element Plus 2.3.x 為穩定版本，升級至 2.4+ 需測試既有元件
- Vite 4.x 可考慮升級至 5.x 以獲得更好的建置效能
- 所有套件版本使用 `^` 語意化版號，npm install 時可能自動升級 minor 版本
