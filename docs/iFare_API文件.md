# iFare 基金會網站 — API 文件

> 版本：v2.0（整併版）
> 建立日期：2026-04-14
> 整併日期：2026-04-28
> 負責人：昀臻
>
> **檔案來源**：本檔由 `iFare_API說明.md` 改名而來，**未與其他檔案合併**。
> 與 `iFare_資料庫文件.md` 為同系列、互相對照（API 端點 ↔ 對應資料表）。

---

## 一、API 架構總覽

### 1.1 雙 API 架構說明

iFare 基金會網站採用「前後台 API 分離」的架構，由兩組獨立的 ASP.NET Core + ABP 7.3 服務組成：

| API | 路徑代碼 | 用途 | 認證 | 來源 |
|-----|----------|------|------|------|
| 前台 API | `iFare_Frontend_API` | 提供官網（Nuxt 3）讀取公開資料 | JWT 關閉，公開讀取 | `iFare_Frontend` |
| 後台 API | `iFare_Backend_API` | 提供管理後台（Vue 3）CRUD 與權限 | JWT 開啟，Bearer Token | `iFare_Backend` |

兩組 API 各自獨立部署、各自連線專屬的 ABP 系統資料庫（FDAPIDb / BDAPIDb），但共用主資料庫 `IFare`。

### 1.2 共用框架

- **ASP.NET Core 6**
- **ABP Framework 7.3**：Domain Driven Design（DDD）分層、AutoMapper、Repository Pattern
- **Entity Framework Core 6.0.4**：SQL Server provider
- **AutoMapper**：DTO ↔ ValueModel ↔ Entity 轉換

### 1.3 前後台 API 差異對照表

| 項目 | 前台 API | 後台 API |
|------|----------|----------|
| 主要操作 | Read（GET） | CRUD（GET/POST/PUT/DELETE） |
| 權限 | 公開 | 三級角色（管理員 / 編輯 / 檢視） |
| Base Path | `/api/services/app/` | `/api/services/app/` |
| Token Header | 不需要 | `Authorization: Bearer <token>` |
| 回應格式 | ABP 標準 JSON | ABP 標準 JSON + `errCode/errMsg` |
| 部署 Port | 44311（Local）/ ifare_api（Prod） | 44321（Local）/ ifare_backend_api（Prod） |

---

## 二、前台 API（iFare_Frontend_API）

### 2.1 基本資訊

- **Local Base URL**：`https://localhost:44311/api/services/app`
- **正式 Base URL**：`https://www.i-fare.org.tw/ifare_api/api/services/app`
- **設定檔**：`iFare_Frontend_API/src/IFare_API.Web.Host/appsettings.json`
- **DB 連線**：
  - `IFare`：主資料庫（共用）
  - `IFare_FDAPIDb`：前台 ABP 系統表

### 2.2 認證設定

JWT 關閉。`appsettings.json` 中 `Authentication.JwtBearer.IsEnabled = "false"`。所有端點皆可公開存取（read-only），不需 Token。

### 2.3 端點清單

#### 2.3.1 最新消息 — `/News/*`

| 方法 | 端點 | 用途 |
|------|------|------|
| GET | `GetNewsList` | 取得已發布消息清單（按 ReleaseTime 降冪） |
| GET | `GetTopsNewsList` | 取得首頁置頂消息（最多 3 筆） |
| GET | `GetNewsDetail?newsID=` | 單筆消息詳情 |

#### 2.3.2 福利文章 — `/ArticlesWelfare/*`

| 方法 | 端點 | 用途 |
|------|------|------|
| GET | `GetArticlesWelfareList` | 福利專欄列表 |
| GET | `GetArticlesWelfareTops?policyId=` | 與政策相關的 Top 文章（最多 3 筆） |
| GET | `GetArticlesWelfareDetail?articleID=` | 文章詳情 |
| GET | `GetArticlesWelfareRelation?articleID=` | 相關文章推薦 |

#### 2.3.3 懶人包 — `/ArticlesLazy/*`

結構同 `ArticlesWelfare`：List / Tops / Detail / Relation。

#### 2.3.4 福利政策 — `/FarePolicy/*`（**主搜尋端點**）

| 方法 | 端點 | 用途 |
|------|------|------|
| GET | `GetIFarePolicyList` | **搜尋福利政策（支援多條件 + 分頁 + 關鍵字）** |
| GET | `GetIFarePolicyDetail?farePolicyID=` | 政策詳情 |
| GET | `GetIFarePolicyRelation?farePolicyID=` | 相關政策推薦 |

**`GetIFarePolicyList` 參數規格（v1.1 新增分頁與關鍵字）**：

| 參數 | 型別 | 必填 | 預設 | 說明 |
|------|------|------|------|------|
| `CodeDomicile` | long? | 否 | - | 戶籍地代碼 ID（中央 = 1） |
| `CodePolicy` | long? | 否 | - | 政策類別代碼 ID |
| `CodeRecipient` | long? | 否 | - | 受助對象代碼 ID |
| `CodeIncome` | long? | 否 | - | 經濟條件代碼 ID |
| `CodeIdentities` | long[]? | 否 | - | 特殊身分代碼 ID 陣列 |
| `Keyword` | string? | 否 | - | **關鍵字（搜尋 Title / Qualification / WelfareInfo，LIKE 模糊比對）** |
| `SkipCount` | int? | 否 | 0 | 跳過筆數（分頁用） |
| `MaxResultCount` | int? | 否 | 20 | 取回筆數，**伺服器強制上限 50** |

**回應格式**：

```json
{
  "result": {
    "errCode": "0000",
    "errMsg": "Success",
    "result": [ ... 政策資料 ... ],
    "totalCount": 127
  }
}
```

`totalCount` 為符合條件的全部筆數（用於前端顯示「共找到 127 項」與分頁計算）。

**關鍵記憶體保護機制**：
- `MaxResultCount` 伺服器端強制 ≤ 50（即使前端送 1000 也會被截斷）
- 使用 `AsSplitQuery()` 拆分 5 層子集合 Include，避免 Cartesian 笛卡爾積
- 所有 filter 為 nullable，未填代表「不篩選此維度」

#### 2.3.5 常見問題 — `/FareQA/*`

| 方法 | 端點 | 用途 |
|------|------|------|
| GET | `GetIFareQAList` | 取得所有 QA |

#### 2.3.6 洽辦單位 — `/FareOfficeUnit/*`

| 方法 | 端點 | 用途 |
|------|------|------|
| GET | `GetIFareOfficeUnitList` | 洽辦單位清單（含 OfficeUnitDomiciles 關聯） |

#### 2.3.7 公益夥伴 — `/Collaborator/*`

| 方法 | 端點 | 用途 |
|------|------|------|
| GET | `GetCollaboratorList` | 公益夥伴清單 |

#### 2.3.8 代碼查詢 — `/Code/*`

| 方法 | 端點 | 回傳 |
|------|------|------|
| GET | `GetCodePolicyList` | 政策類別 |
| GET | `GetCodeRecipientList` | 受助對象 |
| GET | `GetCodeKeywordList` | 關鍵字 |
| GET | `GetCodeIncomeList` | 經濟條件 |
| GET | `GetCodeIdentityList` | 特殊身分 |
| GET | `GetCodeDomicileList` | 戶籍地 |

回傳格式皆為 `{ id, codeName, ... }` 陣列，前端用於下拉選單渲染。

#### 2.3.9 訪客紀錄 — `/Visitor/*`

| 方法 | 端點 | 用途 |
|------|------|------|
| POST | `SetVisitorRecord` | 紀錄訪客造訪（首頁載入時觸發） |

### 2.4 請求格式

- 所有 GET 請求皆使用 **Query Parameters**，路徑模式：
  - `/api/services/app/{Service}/{Method}?param1=value1&param2=value2`
- POST 請求 Body 使用 `application/json`

### 2.5 回應格式（ABP 標準 JSON）

```json
{
  "result": { /* 業務資料 */ },
  "targetUrl": null,
  "success": true,
  "error": null,
  "unAuthorizedRequest": false,
  "__abp": true
}
```

業務資料層的標準格式：
```json
{
  "errCode": "0000",
  "errMsg": "Success",
  "result": [ ... ],
  "totalCount": 0
}
```

`errCode` 定義在 `IFare_API.Core/Constants/ErrAPI.cs`，`0000` 為成功。

---

## 三、後台 API（iFare_Backend_API）

### 3.1 基本資訊

- **Local Base URL**：`https://localhost:44321/api/services/app`
- **正式 Base URL**：`https://www.i-fare.org.tw/ifare_backend_api/api/services/app`
- **設定檔**：`iFare_Backend_API/src/IFare_API.Web.Host/appsettings.json`
- **DB 連線**：
  - `IFare`：主資料庫（共用）
  - `IFare_BDAPIDb`：後台 ABP 系統表 + AbpUsers

### 3.2 認證設定

JWT 開啟。所有端點需在 Header 帶 `Authorization: Bearer <token>`。

### 3.3 認證端點

| 方法 | 端點 | 用途 |
|------|------|------|
| POST | `/api/TokenAuth/Authenticate` | 帳密登入取得 JWT Token |
| POST | `/api/services/app/Main/Login` | ABP 內建登入 |

登入請求 Body：
```json
{
  "userNameOrEmailAddress": "admin",
  "password": "...",
  "rememberClient": true
}
```

成功回傳：
```json
{
  "accessToken": "...",
  "encryptedAccessToken": "...",
  "expireInSeconds": 86400,
  "userId": 2
}
```

### 3.4 CRUD 端點清單

每個資料模組都對應一組 CRUD：

| 模組 | 端點前綴 | 動作 |
|------|----------|------|
| 最新消息 | `/News/` | Get / Insert / Update / Delete |
| 福利文章 | `/ArticlesWelfare/` | Get / Insert / Update / Delete |
| 懶人包 | `/ArticlesLazy/` | Get / Insert / Update / Delete |
| 福利政策 | `/FarePolicy/` | Get / Insert / Update / Delete |
| 常見問題 | `/FareQA/` | Get / Insert / Update / Delete |
| 洽辦單位 | `/FareOfficeUnit/` | Get / Insert / Update / Delete |
| 公益夥伴 | `/Collaborator/` | Get / Insert / Update / Delete |
| 帳號管理 | `/Account/` | Get / Insert / Update / Delete |
| 個人設定 | `/Personal/` | Update / UpdatePwd |

代碼維護（六種代碼表，各自一組 CRUD）：
- `/CodePolicy/*`、`/CodeRecipient/*`、`/CodeKeyword/*`
- `/CodeIncome/*`、`/CodeIdentity/*`、`/CodeDomicile/*`

其他：
- `/ImgFile/UpdateImageFile`：圖片上傳（Base64）
- `/Visitor/GetVisitorSummary`、`/Visitor/GetVisitorChartData`：流量統計

### 3.5 請求格式

- Headers：`Authorization: Bearer <token>` + `Content-Type: application/json`
- Body（Insert/Update）：完整實體 DTO
- Query（Get*List）：分頁、排序、篩選條件

### 3.6 回應格式

同前台 API（ABP 標準 JSON），但內層業務格式新增權限相關欄位：

```json
{
  "result": {
    "errCode": "0000",
    "errMsg": "Success",
    "result": { ... },
    "permissions": ["Pages.News.Edit", "Pages.News.Delete"]
  }
}
```

---

## 四、API 共用規範

### 4.1 Base URL 結構

`/api/services/app/{Service}/{Method}`

- `Service`：對應 AppService 類別名稱（去掉 `AppService` 字尾）
- `Method`：對應 AppService 方法名稱

範例：
- `FarePolicyAppService.GetIFarePolicyList()` → `/api/services/app/FarePolicy/GetIFarePolicyList`

### 4.2 HTTP Method 使用規則

| 操作 | HTTP Method |
|------|-------------|
| 查詢 | GET（公開）/ GET（後台） |
| 新增 | POST |
| 修改 | PUT 或 POST（依方法名稱） |
| 刪除 | DELETE 或 POST `/Delete*` |

### 4.3 錯誤處理與錯誤碼定義

統一在 `IFare_API.Core/Constants/ErrAPI.cs`：

| errCode | 意義 |
|---------|------|
| `0000` | Success |
| `9001` | Param 驗證失敗（含 errMsg 詳細訊息） |
| `9002` | 資料不存在 |
| `9003` | 權限不足 |
| `9999` | 未預期錯誤 |

### 4.4 分頁參數規範（v1.1 新增）

統一採用 ABP 命名慣例：

- `SkipCount`：跳過筆數（從 0 開始）
- `MaxResultCount`：取回筆數
- 回應內含 `totalCount` 供前端計算總頁數

伺服器端強制上限 50（避免無條件查詢造成記憶體爆炸）。前端若需要更多資料應透過縮窄條件，而不是調高 `MaxResultCount`。

### 4.5 日期格式規範

- 請求：ISO 8601 字串（`2026-04-28T00:00:00`）
- 回應：經 `CDateTimeConverter_DotNoTime` 處理，輸出格式 `2026.04.28`

### 4.6 圖片上傳規範

- **格式**：Base64 編碼字串，包含 `data:image/png;base64,...` 前綴
- **大小上限**：5MB（IIS 設定）
- **儲存路徑**：正式環境 `/wwwroot/ImgManage/`

---

## 五、API 測試

### 5.1 測試工具建議

- **Swagger UI**：`https://localhost:44311/swagger/index.html`（前台）
- **Postman**：建議匯入正式機 OpenAPI spec
- **瀏覽器 DevTools**：直接觀察前端 Network 標籤

### 5.2 測試帳號與環境

- **本地開發**：appsettings.json 中 `Local_Default` 連線字串指向 `localhost\SQLEXPRESS`
- **VM 資料庫**：admin / 123qwe（已改密碼）
- **後台測試帳號**：請向主管申請

### 5.3 常見問題排除

| 症狀 | 可能原因 | 解法 |
|------|----------|------|
| 401 Unauthorized | JWT 過期或未帶 | 重新登入取得新 Token |
| 500 Internal Error | DB 連線失敗 | 檢查 SQL Server 服務、appsettings.json |
| CORS Error | 前端 origin 未在白名單 | `appsettings.json` 加 `App.CorsOrigins` |
| 查詢無回應 | 條件未限制 + 大量 Include | 已於 v1.1 修正：分頁上限 + AsSplitQuery |

---

## 變更紀錄

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| v1.0 | 2026-04-14 | 初版目錄骨架建立 |
| v1.1 | 2026-04-28 | 補完所有端點細節；FarePolicy 新增 `Keyword`/`SkipCount`/`MaxResultCount` 參數與 `totalCount` 回應；說明記憶體保護機制 |
