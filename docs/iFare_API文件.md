# iFare 基金會網站 — API 文件

> 版本：v2.2（補完待審版）
> 建立日期：2026-04-14
> 整併日期：2026-04-28
> 補完日期：2026-05-05
> 負責人：昀臻
>
> **本版說明**：v2.2 將 v2.1 標 [TBD] 的項目透過 source code 進一步驗證 / 補完，目前所有可從 code 端確認的事實已寫入。FarePolicy 章節依 round4 分支現況描述（合併 master `b89f5b9` 後可能微調）。新增 §6.7 BM25 / Jieba 模糊搜尋演算法說明。**待主管 / DevOps 校對**的項目集中於文末附錄。

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
- **JiebaNet**（前台搜尋專用）：`JiebaNet.Segmenter` + `JiebaNet.Analyser` — 中文結巴分詞，用於 FarePolicy BM25 模糊搜尋

### 1.3 前後台 API 差異對照表

| 項目 | 前台 API | 後台 API |
|------|----------|----------|
| 主要操作 | Read（GET） | CRUD（GET/POST） |
| 權限 | 公開 | JWT Bearer Token + 角色權限 |
| Base Path | `/api/services/app/` | `/api/services/app/` |
| Token Header | 不需要 | `Authorization: Bearer <token>` |
| 回應格式 | ABP 標準 JSON | ABP 標準 JSON + `errCode/errMsg` |
| 部署 Port | 44311（Local）/ ifare_api（Prod） | 44321（Local）/ ifare_backend_api（Prod） |
| Swagger | 全環境啟用，`/swagger`，無 Auth 保護 | 全環境啟用，`/swagger`，無 Auth 保護 |

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

實際設定值：
```json
{
  "Authentication": {
    "JwtBearer": {
      "IsEnabled": "false",
      "SecurityKey": "IFare_API_C353E59B083F4E93",
      "Issuer": "IFare_API",
      "Audience": "IFare_API"
    }
  }
}
```

### 2.3 端點清單

#### 2.3.1 最新消息 — `/News/*`

| 方法 | 端點 | 用途 |
|------|------|------|
| GET | `GetNewsList` | 取得已發布消息清單（按 ReleaseTime 降冪） |
| GET | `GetTopsNewsList` | 取得首頁置頂消息（最多 3 筆） |
| GET | `GetNewsDetail?newsID=` | 單筆消息詳情 |

**所有方法回傳：** `NewsResultDto`
- `errCode` (int)、`errMsg` (string)
- `result`：`List<NewsDataDto>` 或單筆
  - `id` (long)、`title` (string)、`content` (string?)、`releaseTime` (DateTime)

#### 2.3.2 福利文章 — `/ArticlesWelfare/*`

| 方法 | 端點 | 參數 |
|------|------|------|
| GET | `GetArticlesWelfareList` | 無 |
| GET | `GetArticlesWelfareTops?policyId=` | `policyId` (long, 必填)，最多 3 筆 |
| GET | `GetArticlesWelfareDetail?articleWelfareID=` | `articleWelfareID` (long, 必填) |
| GET | `GetArticlesWelfareRelation?articleWelfareID=` | `articleWelfareID` (long, 必填) |

**`ArticlesWelfareDataDto` 欄位：**
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | long | 文章 ID |
| title | string | 標題 |
| detail | string? | 內容 (HTML) |
| codePolicy_ID | long | 對應政策類別 ID |
| codePolicy_LabelName | string | 政策類別名稱 |
| codeKeywordList | List\<CodeDataDto\> | 關鍵字清單 |
| releaseTime | DateTime? | 發布時間 |
| createTime | DateTime | 建立時間 |

#### 2.3.3 懶人包 — `/ArticlesLazy/*`

| 方法 | 端點 | 參數 |
|------|------|------|
| GET | `GetArticlesLazyList` | 無 |
| GET | `GetArticlesLazyDetail?articlesLazyID=` | `articlesLazyID` (long) |
| GET | `GetArticlesLazyRelation?articlesLazyID=` | `articlesLazyID` (long) |

⚠️ **注意：** v2.0 文件宣稱有 `GetArticlesLazyTops`，**實際 source code 並無此方法**，請以本版為準（只有 List / Detail / Relation 三個）。

`ArticlesLazyDetailDto` 內 `result` 含 `imageList`（`List<ImageInfoDto>`），其餘欄位同 ArticlesWelfare。

#### 2.3.4 福利政策 — `/FarePolicy/*`（**主搜尋端點**）

📌 本節依 **`feat/uiux-round4` 分支現況** 描述。如主管合併 master `b89f5b9` (v1.0.3) 後參數有變動，本節需重新對照。

| 方法 | 端點 | 用途 |
|------|------|------|
| GET / POST | `GetIFarePolicyList` | 搜尋福利政策（多條件 + 關鍵字 + 模糊搜尋） |
| GET | `GetIFarePolicyDetail?farePolicyID=` | 政策詳情 |
| GET | `GetIFarePolicyRelation?farePolicyID=` | 相關政策推薦 |

**`GetIFarePolicyList` 參數**（`FarePolicyFilterParamDto`）：

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| CodeDomicile | long? | 否 | 戶籍地代碼 ID（中央 = 1） |
| CodePolicy | long? | 否 | 政策類別代碼 ID |
| CodeRecipient | long? | 否 | 受助對象代碼 ID |
| CodeIncome | long? | 否 | 經濟條件代碼 ID |
| CodeIdentities | long[]? | 否 | 特殊身分代碼 ID 陣列 |
| Query | string? | 否 | 關鍵字搜尋字串（**注意：DTO 欄位名為 `Query`，非 v2.0 寫的 `Keyword`**） |

⚠️ **目前 round4 分支 DTO 無 `SkipCount` / `MaxResultCount` 欄位**，回傳結構亦**無 `totalCount`**。v2.0 / v1.1 文件描述的「分頁機制 + 50 上限」與目前實作不符。如要分頁需後端新增。

**搜尋實作：BM25 + Jieba 結巴分詞模糊比對**（不是 LIKE 比對）
- 詳見 §6.7「BM25 / Jieba 模糊搜尋演算法」
- 演算法位於 `IFare_API.Core/TaskManager/Common/TraditionalChineseFuzzyMatcher.cs` + `IFare_API.Core/TaskManager/Fare/Policy/FarePolicyTaskManager.cs`

**回傳：** `FarePolicyResultDto`，含 `errCode` / `errMsg` / `result: List<FarePolicyDataDto>`

#### 2.3.5 常見問題 — `/FareQA/*`

| 方法 | 端點 | 參數 |
|------|------|------|
| GET | `GetIFareQAList` | 無 |

回傳：`FareQAResultDto`，含 `result: List<FareQADataDto>`，欄位：`id` (long) / `question` (string) / `answer` (string)

#### 2.3.6 洽辦單位 — `/FareOfficeUnit/*`

| 方法 | 端點 | 參數 |
|------|------|------|
| GET | `GetIFareOfficeUnitList` | 無 |

**`FareOfficeUnitDataDto` 巢狀結構：**
```
FareOfficeUnitDataDto
├── id (long)
├── title (string)
├── releaseTime (DateTime)
├── updateTime (DateTime?)
└── officeList: List<FareOfficeDomicileDataDto>
    ├── codeDomicile_ID (long)
    ├── codeDomicile_LabelName (string)
    └── unitList: List<FareOfficeDetailDataDto>
        ├── unitName (string)
        ├── tel (string)
        └── address (string)
```

#### 2.3.7 公益夥伴 — `/Collaborator/*`

| 方法 | 端點 | 參數 |
|------|------|------|
| GET | `GetCollaboratorList` | 無 |

**`CollaboratorDataDto` 欄位：**
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | long | ID |
| title | string | 名稱 |
| serviceItem | string | 服務項目 |
| tel | string | 聯絡電話 |
| url | string | 官網連結 |
| imageFile | string | 圖檔 (Base64) |
| imageName | string | 檔名 |
| imageExtension | string | 副檔名 |

#### 2.3.8 代碼查詢 — `/Code/*`（**單一 service，6 個 method**）

| 方法 | 端點 | 回傳代碼類別 |
|------|------|-------------|
| GET | `GetCodeDomicileList` | 戶籍地 |
| GET | `GetCodeIdentityList` | 特殊身分 |
| GET | `GetCodeIncomeList` | 經濟條件 |
| GET | `GetCodeKeywordList` | 關鍵字 |
| GET | `GetCodePolicyList` | 政策類別 |
| GET | `GetCodeRecipientList` | 受助對象 |

📌 注意：6 個方法**集中在 `CodeAppService` 一個 service**，service path 是 `/Code/`（不是 `/CodePolicy/` 等）。

**所有方法回傳：** `CodeResultDto`，含 `result: List<CodeDataDto>`，欄位：`id` (long) / `codeName` (string)

#### 2.3.9 訪客紀錄 — `/Visitor/*`

| 方法 | 端點 | 參數 |
|------|------|------|
| POST | `SetVisitorRecord` | `router` (string，造訪頁面路徑) |

**紀錄欄位（程式內自動寫入）：**
- IP：從 `HttpContext.Connection.RemoteIpAddress` 自動抓
- Route：傳入的 `router` 參數
- VisitorName：固定 `"Anonymous"`
- VisitorFrom：固定 `"Web"`
- 時間戳：DB 自動產生

**回傳：** `ErrorInfoBaseDto`（`errCode` / `errMsg`）

📌 標 `[IgnoreAntiforgeryToken]`，跨來源呼叫不會被 CSRF 防護擋。同 IP 同一天若多次造訪是否會多筆紀錄需查 `IVisitorTaskManager.SetVisitorRecord` 實作（簡略檢視看起來是每次呼叫都 insert 一筆）。

#### 2.3.10 圖片 — `/Img/*`（v2.0 漏列）

| 方法 | 端點 | 參數 |
|------|------|------|
| GET | `GetmImg?imgID=` | `imgID` (long, 必填) |

⚠️ **方法名是 `GetmImg`**（不是 `GetImg`），source code 真的這樣寫，注意是 `Getm`（小寫 m）+ `Img`。

**特殊行為：**
- 標 `[DontWrapResult]`，**不走 ABP 標準 JSON 包裝**
- 回傳 `FileContentResult`：實際解碼 Base64 後的二進位圖片
- 例外時回傳空白 PNG（`new byte[0]` + `image/png`）
- 用途：給前端 `<img src="">` 直接吃

#### 2.3.11 ABP 內建 service（標 `[IgnoreApi]`，不對外）

以下 service 存在於程式碼但未對外暴露端點，僅供內部模組使用，**不需要文件化端點**：

- `ConfigurationAppService` — UI 主題設定
- `RoleAppService` — 角色管理
- `UserAppService` — 使用者管理
- `SessionAppService` — 取得目前登入資訊
- `TenantAppService` — 多租戶管理
- `Authorization/AccountAppService` — 註冊驗證

### 2.4 請求格式

- 所有 GET 請求皆使用 **Query Parameters**，路徑模式：
  - `/api/services/app/{Service}/{Method}?param1=value1&param2=value2`
- POST 請求 Body 使用 `application/json`
- `/Img/GetmImg` 例外，回傳二進位非 JSON

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
  "errCode": 0,
  "errMsg": "成功/Success",
  "result": [ ... ]
}
```

⚠️ **errCode 為數值型**（`int`，可能為浮點數）— v2.0 文件寫的 `"0000"` 字串型錯誤。詳見 §4.3。

---

## 三、後台 API（iFare_Backend_API）

### 3.1 基本資訊

- **Local Base URL**：`https://localhost:44321/api/services/app`
- **正式 Base URL**：`https://www.i-fare.org.tw/ifare_backend_api/api/services/app`
- **設定檔**：`iFare_Backend_API/src/IFare_BDAPI.Web.Host/appsettings.json`
- **DB 連線**：
  - `IFare`：主資料庫（共用）
  - `IFare_BDAPIDb`：後台 ABP 系統表 + AbpUsers

### 3.2 認證設定

JWT 開啟。所有端點需在 Header 帶 `Authorization: Bearer <token>`。

實際設定值：
```json
{
  "Authentication": {
    "JwtBearer": {
      "IsEnabled": "true",
      "SecurityKey": "IFare_BDAPI_65E345CD2669463E",
      "Issuer": "IFare_BDAPI",
      "Audience": "IFare_BDAPI"
    }
  }
}
```

**JWT 詳細設定**（`IFare_BDAPI.Web.Core/IFare_BDAPIWebCoreModule.cs:82-86`）：
- **過期時間**：1 天（86400 秒）— `tokenAuthConfig.Expiration = TimeSpan.FromDays(1);`
- **簽章演算法**：`HmacSha256`
- **Issuer / Audience**：從 `appsettings.json` 動態讀取，目前皆為 `"IFare_BDAPI"`
- **Refresh Token**：**未實作** — token 過期後須使用帳密重新登入取得新 token，無 refresh endpoint

### 3.3 認證端點

| 方法 | 端點 | 用途 |
|------|------|------|
| POST | `/api/TokenAuth/Authenticate` | 帳密登入取得 JWT Token（Controller 層） |
| POST | `/api/services/app/Main/Login` | ABP 內建登入（AppService 層） |

**`Main/Login` 請求 Body**（`LoginParamDto`）：
| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| act | string | ✅ | 帳號 |
| pwd | string | ✅ | 密碼 |

**`Main/Login` 回應**（`PersonalResultDto`）：
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | long | UserID |
| account | string | 帳號 |
| userName | string | 顯示名稱 |
| email | string | Email |
| permission | string | 角色（管理員 / 編輯 / 檢視） |
| state | string | 啟用狀態 |

**`TokenAuth/Authenticate` 請求 Body**：
```json
{
  "userNameOrEmailAddress": "admin",
  "password": "...",
  "rememberClient": true
}
```

**`TokenAuth/Authenticate` 成功回傳：**
```json
{
  "accessToken": "...",
  "encryptedAccessToken": "...",
  "expireInSeconds": 86400,
  "userId": 2
}
```

**`rememberClient` 行為：** 由 ABP 7.3 內建 `LogInManager.LoginAsync` 處理。慣用語意為 `true` 時 Cookie 持續到 token 實際過期、`false` 時隨瀏覽器關閉而失效。詳細 ABP 文件可參考 `Abp.Authorization`。

**Token refresh 流程：** 系統未實作 refresh token endpoint。Token 過期（1 天）後須使用帳密重新呼叫 `Authenticate` 端點重取。前端遇到 401 應導向登入頁。

### 3.4 業務 CRUD 端點

#### 3.4.1 News / ArticlesWelfare / ArticlesLazy / FareQA / FareOfficeUnit / Collaborator

每個業務模組對應一組 4 method（`Get/Insert/Update/Delete` 縮寫為 GIUD）：

| Service | Get | Insert | Update | Delete |
|---------|-----|--------|--------|--------|
| News | `GetDataList` | `InsertNews` | `UpdateNews` | `DeleteNews` |
| ArticlesWelfare | `GetDataList` | `InsertArticlesWelfare` | `UpdateArticlesWelfare` | `DeleteArticlesWelfare` |
| ArticlesLazy | `GetDataList` | `InsertArticlesLazy` | `UpdateArticlesLazy` | `DeleteArticlesLazy` |
| FareQA | `GetDataList` | `InsertFareQA` | `UpdateFareQA` | `DeleteFareQA` |
| FareOfficeUnit | `GetDataList` | `InsertFareOfficeUnit` | `UpdateFareOfficeUnit` | `DeleteFareOfficeUnit` |
| Collaborator | `GetDataList` | `InsertCollaborator` | `UpdateCollaborator` | `DeleteCollaborator` |

**通用 GetDataList Filter（後台所有模組共通欄位）：**
| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| CreateDateStart / End | DateTime? | 否 | 建立日期範圍 |
| UpdateDateStart / End | DateTime? | 否 | 更新日期範圍 |
| State | string? | 否 | 狀態篩選 |
| IDs | List\<long\>? | 否 | 指定 ID 陣列 |

各模組額外欄位：

**`NewsFilterParamDto`** 額外無

**`ArticlesWelfareFilterParamDto` / `ArticlesLazyFilterParamDto`** 額外：
- `ReleaseTimeStart / End` (DateTime?)
- `DiscontinuedTimeStart / End` (DateTime?)
- `CodePolicy` (long?，僅 Welfare)
- `CodeKeywords` (List<long>?)

**`FareOfficeUnitFilterParamDto`** 額外：
- `SearchName` (string?)
- `IsContainElse` (bool)

**`CollaboratorFilterParamDto`** 額外：
- `SearchName` (string?)

---

**通用 Insert / Update / Delete DTO 結構：**

各模組 `XxxInsertDataDto` / `XxxEditorDataDto` / `XxxDeleteDataDto`：

| DTO | 必含欄位 |
|-----|---------|
| Insert | 所有業務欄位 + `IsEnabled` |
| Editor (Update) | `ID` (必填) + 所有業務欄位 |
| Delete | `ID` (必填) |

各模組業務欄位：

**News：** `Title` / `Detail` / `ReleaseTime` / `DiscontinuedTime`

**ArticlesWelfare：** `Title` / `Detail` / `CodePolicyID` / `CodeKeywordIDs` (List) / `ReleaseTime` / `DiscontinuedTime`

**ArticlesLazy：** 同 Welfare 但無 `CodePolicyID`，多 `ImageList` (List<ImageInfoDto>)

**FareQA：** `Question` / `Answer`

**FareOfficeUnit：** `Title` / `OfficeList` (巢狀，含 `CodeDomicileID` + `UnitDetailList`)

**Collaborator：** `Title` / `ServiceItem` / `Tel` / `Url` / `ImageFile` / `ImageName` / `ImageExtension`

#### 3.4.2 FarePolicy（後台）

📌 本節依 **`feat/uiux-round4` 分支現況** 描述基本結構。完整 DTO 欄位（含 Welfare 巢狀關聯、申辦條件、補助金額等）建議在 master `b89f5b9` 合併後一併補完。

| 方法 | 端點 |
|------|------|
| POST | `/api/services/app/FarePolicy/GetDataList` |
| POST | `/api/services/app/FarePolicy/InsertFarePolicy` |
| POST | `/api/services/app/FarePolicy/UpdateFarePolicy` |
| POST | `/api/services/app/FarePolicy/DeleteFarePolicy` |

**`FarePolicyFilterParamDto`（後台搜尋）共通欄位：**
- 同 §3.4.1 的 CreateDateStart/End、UpdateDateStart/End、State、IDs
- 額外：CodePolicy、CodeRecipient、CodeDomicile、CodeIncome、CodeIdentities、Query

**`FarePolicyInsertDataDto` / `FarePolicyEditorDataDto`：** 含 Title、Qualification、WelfareInfo、CodePolicyID、CodeRecipientID、CodeDomicileIDs、CodeIncomeID、CodeIdentityIDs、ReleaseTime、IsEnabled 等多項 — 完整欄位待第二波補完。

#### 3.4.3 Account（帳號管理）

| 方法 | 端點 | 用途 |
|------|------|------|
| POST | `Account/GetAccountList` | 帳號清單查詢 |
| POST | `Account/InsertAccount` | 新增帳號 |
| POST | `Account/UpdateAccount` | 修改帳號 |

⚠️ **無 Delete 方法** — v2.0 文件寫的 CRUD 不完整，實際只有 3 個 method。

**`AccountFilterParamDto`：** `Permission` / `State` / `Account` / `IDs?`

**`AccountInsertDataDto`：** `UserName` / `Account` / `Email` / `Permission` / `IsEnabled` / `Pwd` / `PwdConfirm`

**`AccountEditorDataDto`：** `ID` + `UserName` / `Account` / `Email` / `Permission` / `IsEnabled`（**不含密碼**，密碼改走 Personal 端點）

#### 3.4.4 Personal（個人資料）

| 方法 | 端點 | 用途 |
|------|------|------|
| GET / POST | `Personal/GetPersonalInfo` | 取得自己資料 |
| POST | `Personal/UpdatePersonalInfo` | 修改自己資料 |
| POST | `Personal/UpdatePersonalPwd` | 修改自己密碼 |

⚠️ v2.0 寫的 `Update / UpdatePwd` 實際是 `UpdatePersonalInfo` / `UpdatePersonalPwd`。多了 `GetPersonalInfo`。

**`PersonalReqDto` 欄位：** `UserID` / `UserName` / `Email` / `Password_Old` / `Password_New`

**`PersonalResultDto`：** `ID` / `Account` / `UserName` / `Email` / `Permission` / `State`

#### 3.4.5 ImgManager（圖片管理）

⚠️ **v2.0 寫的 `/ImgFile/UpdateImageFile` 路徑跟方法名都不對**。實際路徑與方法：

| 方法 | 端點 | 用途 |
|------|------|------|
| GET | `ImgManager/GetImgManagerList` | 圖片清單 |
| POST | `ImgManager/InsertImg` | 新增圖片 |
| POST | `ImgManager/EditImg` | 修改圖片 |
| DELETE | `ImgManager/DeleteImg?imgID=` | 刪除圖片 |

**`ImgManagerFilterParamDto`：** `UpdateDateStart / End` / `Type?` / `SearchName?`

**`ImgManagerInsertDataDto`：** `Title` / `ImgPath` / `ImgExtension` / `Type` / `Size`

**`ImgManagerEditDataDto`：** `ID` + 同 Insert 欄位

**已驗證的圖片相關規範**（從 `ImgManagerTaskManager.cs:36` + `PageConst.cs:7`）：
- **檔案大小檢查**：**程式內無大小限制驗證** — 後端直接存 `insertData.ImgPath`，無 size 檢查
- **副檔名白名單**：**未實作** — 後端只驗證 `Type` 分類欄位，不檢查實際副檔名
- **檔名生成規則**：**前端決定** — 後端把前端傳的 `ImgPath` 字串原樣存入 DB，無雜湊 / UUID / 時間戳生成
- **儲存路徑**：**由前端決定** — 後端只記錄路徑字串，不限制實際檔案落點
- **Type 分類（hardcode）**：定義於 `IFare_BDAPI.Core/Constants/PageConst.cs:7`，固定三種：
  ```csharp
  ImgManageType = new List<string>(){ "最新消息", "福利文章", "福利政策" };
  ```
  前端送其他值會被拒。

⚠️ **安全建議**（需主管 / 資安評估）：目前圖片上傳缺乏後端驗證機制，建議補上：
- 檔案大小上限檢查（避免大檔 DoS）
- 副檔名白名單（jpg/png/gif/webp）
- 檔名清洗與重新命名（避免 path traversal 攻擊）
- 圖片 magic number 驗證（避免上傳偽裝的可執行檔）

#### 3.4.6 Code 維護（六種代碼表）

6 個 service 結構**完全相同**，僅方法名稱依代碼類型不同：

| Service | Get | Insert | Update | Delete |
|---------|-----|--------|--------|--------|
| CodePolicy | `GetDataList` | `InsertCodePolicy` | `UpdateCodePolicy` | ❌ 無 |
| CodeRecipient | `GetDataList` | `InsertCodeRecipient` | `UpdateCodeRecipient` | ❌ 無 |
| CodeKeyword | `GetDataList` | `InsertCodeKeyword` | `UpdateCodeKeyword` | ❌ 無 |
| CodeIncome | `GetDataList` | `InsertCodeIncome` | `UpdateCodeIncome` | ❌ 無 |
| CodeIdentity | `GetDataList` | `InsertCodeIdentity` | `UpdateCodeIdentity` | ❌ 無 |
| CodeDomicile | `GetDataList` | `InsertCodeDomicile` | `UpdateCodeDomicile` | ❌ 無 |

⚠️ **6 個 Code service 全部沒有 Delete 方法**。v2.0 寫的「Get / Insert / Update / Delete」與實作不符。如有刪除需求，目前僅能透過 `Update` 將 `IsEnabled = false` 做 soft delete。

**通用 `CodeFilterParamDto`：**
| 欄位 | 型別 | 說明 |
|------|------|------|
| CreateDateStart / End | DateTime? | 建立日期 |
| UpdateDateStart / End | DateTime? | 更新日期 |
| SearchName | string? | 標籤名稱搜尋 |
| IDs | List\<long\>? | 指定 ID |
| IsContainAll | bool | 是否含「全部」項 |
| IsContainDisabled | bool | 是否含停用 |

**通用 `CodeInsertDataDto` / `CodeEditorDataDto`：**
| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| ID | long | ✅ (僅 Editor) | 代碼 ID |
| LabelName | string | ✅ | 顯示名稱 |
| IsEnabled | bool | ✅ | 啟用狀態 |

**通用 `CodeResultDto`：** `errCode` / `errMsg` / `result: List<CodeDataDto>`

**`CodeDataDto`：** `ID` / `LabelName` / `State` / `CreateUserID` / `CreateDate` / `UpdateUserID` / `UpdateDate`

**Entity 額外欄位驗證**（`IFare_BDAPI.Core/Model/IFare/Code*.cs`）：
- `CodePolicy` / `CodeRecipient` / `CodeKeyword` / `CodeIdentity` / `CodeIncome`：標準 6 欄結構（同上）
- `CodeDomicile`：多 1 個 `State` 欄位（line 19）— 與其他 Code 表唯一差異

📌 **未發現**任何 ParentID / IsCenter / CityCode 等階層 / 縣市結構。如業務上有「中央 = 1」「縣市 = 2-23」階層概念，目前是用 ID 約定（非外鍵）實作。建議文件補一份 **CodeDomicile ID 對照表**（中央 / 各縣市 ID 編號）。

#### 3.4.7 Visitor（流量統計）

| 方法 | 端點 | 用途 |
|------|------|------|
| GET | `Visitor/GetVisitorSummary` | 訪客摘要（今日 / 累計） |
| GET | `Visitor/GetVisitorChartData` | 訪客圖表資料 |

**`GetVisitorSummary` 回傳：** `CurrentDate` / `CurrentPeople` / `CurrentVisits` / `TTLStartDate` / `TTLPeople` / `TTLVisits`

**`GetVisitorChartData` 參數：** `selectYear` (int?) / `startDate` (DateTime?) / `endDate` (DateTime?)
**回傳：** `LabelXList` / `PeopleNumList` / `VisitsNumList` / `InfoDataList`

### 3.5 請求格式

- Headers：`Authorization: Bearer <token>` + `Content-Type: application/json`
- Body：完整實體 DTO（GET 也用 Body 傳 JSON，ABP 標準）
- `DeleteImg` 例外：用 Query Param

### 3.6 回應格式

同前台 API（ABP 標準 JSON）。業務資料層格式：

```json
{
  "errCode": 0,
  "errMsg": "成功/Success",
  "result": { ... }
}
```

**permissions 欄位實際位置**（已驗證）：
- **不在**業務 DTO（News / FarePolicy / Articles 等的 Result DTO 都沒有 `permissions`）
- **不在** `PersonalAppService` 回傳結構
- **僅在** `RoleAppService` 範圍：
  - `RoleAppService.GetAllPermissions()` — 回傳 `List<FlatPermissionDto>`，欄位 `Name`（如 `Pages.News.Edit`）/ `DisplayName` / `Description`
  - `RoleAppService.GetRoleForEdit()` — 回傳 `GetRoleForEditOutput`，含 `Permissions`（全清單）+ `GrantedPermissionNames`（該角色已授權清單）

📌 v2.0 文件 §3.6 提到的 `permissions: ["Pages.News.Edit"]` 在業務端點回傳結構中**並無此欄位**，建議刪除誤導敘述。前端如要做 permission 檢查，應從登入後另行呼叫 `RoleAppService.GetRoleForEdit` 取得使用者角色的 `GrantedPermissionNames`。

---

## 四、API 共用規範

### 4.1 Base URL 結構

`/api/services/app/{Service}/{Method}`

- `Service`：對應 AppService 類別名稱（去掉 `AppService` 字尾）
- `Method`：對應 AppService 方法名稱

範例：
- `NewsAppService.GetNewsList()` → `/api/services/app/News/GetNewsList`
- `Code` 例外：6 個方法都掛在 `CodeAppService` 下，路徑都是 `/Code/Get*List`

### 4.2 HTTP Method 使用規則

ABP 對 AppService 方法的 HTTP method 推導規則：
- 方法名以 `Get*` 開頭 → GET
- 方法名以 `Set*` / `Insert*` / `Update*` 開頭 → POST
- 明確標 `[HttpGet]` / `[HttpPost]` / `[HttpDelete]` → 以 attribute 為準
- `Img/GetmImg` 標 `[HttpGet]` 強制 GET

⚠️ 後台 Update / Delete 多數實際是 POST（不是 PUT / DELETE），與 RESTful 慣例不同。

### 4.3 完整錯誤碼定義（重大修正）

⚠️ **v2.0 文件「`0000` / `9001` / `9002` / `9003` / `9999`」與實作完全不符**。實際 `ErrAPI.cs` 為**浮點數值型**錯誤碼：

| Code | 訊息（雙語） | HTTP 對應 | 用途 |
|------|------------|----------|------|
| `0` | 成功 / Success | 200 | 標準成功 |
| `0.1` | 新增成功 / Create Success | 200 | 建立資源成功 |
| `0.2` | 更新成功 / Update Success | 200 | 更新資源成功 |
| `0.3` | 刪除成功 / Delete Success | 200 | 刪除資源成功 |
| `0.4` | 停用成功 / Disable Success | 200 | 停用成功 |
| `0.5` | 啟用成功 / Enable Success | 200 | 啟用成功 |
| `-1` | 失敗 / Fail | 400 | 標準失敗 |
| `-1.1` | 新增失敗 / Create Fail | 400 | |
| `-1.2` | 更新失敗 / Update Fail | 400 | |
| `-1.3` | 刪除失敗 / Delete Fail | 400 | |
| `-1.4` | 停用失敗 / Disable Fail | 400 | |
| `-1.5` | 啟用失敗 / Enable Fail | 400 | |
| `-2` | 參數格式錯誤 / Param format Fail | 400 | |
| `-2.1` | 參數輸入為空 / Param value is null | 400 | |
| `-3` | 權限不足 / Permission Fail | 403 | **僅後台**（前台 ErrAPI.cs 無此碼） |
| `999` | System Exception | 500 | 未預期錯誤 |

📌 整體合計 16 個錯誤碼。前端比對時用**數值**比對，**不是字串比對**。

### 4.4 分頁參數規範

⚠️ **目前 round4 分支實作未啟用 ABP `SkipCount` / `MaxResultCount` / `totalCount` 機制**。前台 FarePolicy 與後台各模組 GetDataList 都以 Filter 條件為主，無 SkipCount / MaxResultCount 參數介入，回應亦無 `totalCount`。如要分頁需後端新增。等主管合併 master `b89f5b9` 後此節重新檢視。

### 4.5 日期格式規範

- 請求：ISO 8601 字串（`2026-04-28T00:00:00`）
- 回應：經 `CDateTimeConverter_NoTime` 處理，輸出格式 `yyyy/MM/dd`

⚠️ **v2.0 寫的 `CDateTimeConverter_DotNoTime` 與 `yyyy.MM.dd` 是錯的**。實際類別名為 `CDateTimeConverter_NoTime`，輸出為斜線格式（`2026/05/05`）。

額外日期 converter（v2.0 漏列）：
- `CDateTimeConverter` — 完整 `yyyy/MM/dd HH:mm:ss`
- `CDateTimeConverter_NoSec` — `yyyy/MM/dd HH:mm`
- `CDateTimeConverter_NoTime` — `yyyy/MM/dd`

### 4.6 圖片上傳規範

- **格式**：Base64 編碼字串，含 `data:image/png;base64,...` 前綴
- **IIS 大小上限**：4GB（`web.config` 中 `maxAllowedContentLength = 4294967295`）
- **後端程式內檢查**：**無**（無檔案大小、副檔名、檔名驗證）
- **檔名生成規則**：**前端決定，後端原樣保存**
- **儲存路徑**：由前端傳入 `ImgPath`，後端不限制
- **Type 分類（hardcode）**：固定三種，定義於 `PageConst.cs:7`：
  - `"最新消息"` / `"福利文章"` / `"福利政策"`

⚠️ v2.0 文件寫的「**5MB 上限**」**未在 source code 中發現對應實作**。可能來源：
1. 前端 UI 層自行限制（例如 TinyMCE 編輯器設定）
2. 反向代理 / 前面 nginx 層限制
3. 沿用舊版設定但已移除
4. 主管口頭規範（軟性限制）

建議與主管確認 5MB 限制的實際實作層級，必要時改寫此節為實際值。

### 4.7 CORS 白名單

**前台 API 實際 origins**（`appsettings.json`）：
```
http://localhost:4200,
http://localhost:8080,
http://localhost:8081,
http://localhost:3000
```

**後台 API 實際 origins**（`appsettings.json`）：
```
http://localhost:4200,
http://localhost:8080,
http://localhost:8081,
http://localhost:3000,
http://localhost:5173,
https://112.121.114.177
```

📌 後台多了 `5173` (Vite) 跟 IP `112.121.114.177`（疑為 VM 環境）。

⚠️ **正式環境 origins 設定：未發現獨立 production 覆蓋檔**（無 `appsettings.Production.json`）。目前 `appsettings.json` 同時用於 Dev 與 Prod，正式環境繼承相同 origins 清單，**未列入 `https://www.i-fare.org.tw`**。建議補：
- 新增 `appsettings.Production.json` 區隔環境設定
- 加入正式機域名（如 `https://www.i-fare.org.tw`）至 Prod CORS 白名單
- 考慮從 prod 環境拿掉 localhost 開頭的 origins

### 4.8 連線字串

| Key | 用途 |
|-----|------|
| `Default` | ABP 系統 DB（前台 = `IFare_FDAPIDb` / 後台 = `IFare_BDAPIDb`） |
| `IFare` | 業務主資料庫（前後台共用） |
| `Local_Default` | 本機開發 ABP DB |
| `Local_IFare` | 本機開發業務 DB |

📌 環境切換由 `RolloutConfigurer` 動態執行（Local ↔ Release），**非透過 `appsettings.{Environment}.json`**。

### 4.9 Logging

**後台與前台**均使用 log4net，設定相同（位置：`*.Web.Host/log4net.config`）：
- **路徑**：`../../../App_Data/Logs/Logs.txt`（相對路徑）+ DB log 在 `../../../App_Data/DbLogs/DbLogs.txt`
- **檔案大小限制**：10000 KB（10 MB）/ 檔
- **備份檔數**：最多保留 10 個
- **等級**：DEBUG
- **格式**：`%-5level %date [%-5.5thread] %-40.40logger - %message%newline`

📌 前台 log 設定**確實存在**，與後台共用同一份 log4net 配置範本。

---

## 五、API 測試

### 5.1 測試工具建議

- **Swagger UI**：
  - 前台 `https://localhost:44311/swagger/index.html`
  - 後台 `https://localhost:44321/swagger/index.html`
  - **全環境啟用，無 Basic Auth 保護**（Dev / Prod 都可存取）⚠️ 正式環境建議補上保護
- **Postman**：建議匯入正式機 OpenAPI spec
- **瀏覽器 DevTools**：直接觀察前端 Network 標籤

### 5.2 測試帳號與環境

- **本地開發**：appsettings.json 中 `Local_Default` 連線字串指向 `localhost\SQLEXPRESS`
- **VM 資料庫**：admin / 123qwe（已改密碼）
- **後台測試帳號**：請向主管申請

### 5.3 常見問題排除

| 症狀 | 可能原因 | 解法 |
|------|----------|------|
| 401 Unauthorized | JWT 過期或未帶 | 重新登入取得新 Token（無 refresh） |
| 500 Internal Error | DB 連線失敗 | 檢查 SQL Server 服務、appsettings.json |
| CORS Error | 前端 origin 未在白名單 | `appsettings.json` 加 `App.CorsOrigins` |
| 搜尋無結果 | 詞彙未被 Jieba 切出 | 確認 query 字串、檢查 BM25 評分閾值 |
| 圖片上傳成功但無顯示 | `ImgPath` 字串前後端對不上 | 確認前端組路徑 vs `/wwwroot/ImgManage/` 實際位置 |

---

## 六、部署 / 維運

### 6.1 IIS 反向代理結構

正式環境前後台都透過 IIS URL Rewrite：

**`iFare_Frontend/web.config` 規則：**
- 將 `/swagger`、`/ifare_api/`、`/ifare_bdapi/`、`/ifare_backend/` 路徑保留
- 其他路徑導向 `http://127.0.0.1:3000/`（Node.js Nuxt 應用）
- 最大內容長度：`maxAllowedContentLength = 4294967295`（4GB）

**`iFare_Backend/public/web.config` 規則：**
- URL 重寫，非檔案 / 目錄請求轉向 `/ifare_backend/`

### 6.2 EF Core Migration

**Migration 位置：**
- 前台：`Dev/Dev Code/iFare_Frontend_API/src/IFare_API.EntityFrameworkCore/Migrations/`
- 後台：`Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.EntityFrameworkCore/Migrations/`

**最新 migration：**
- `20220622074714_Upgrade_To_ABP_7.3.cs`
- `20210628103231_Upgrade_To_ABP_6_4_rc1.cs`
- `IFare_*DbContextModelSnapshot.cs`

**自動執行：**
`EntityFrameworkCoreModule.PostInitialize()` 會呼叫 `SeedHelper.SeedHostDb(IocManager)` 跑種子資料，但**不會自動執行 `Database.Migrate()`**。

**手動 migration SOP（建議）：**
```bash
# 1. 切到 EntityFrameworkCore 專案
cd "Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.EntityFrameworkCore"

# 2. 新增 migration（開發者本機）
dotnet ef migrations add <MigrationName> --startup-project ../IFare_BDAPI.Web.Host

# 3. 套用到資料庫（部署或開發）
dotnet ef database update --startup-project ../IFare_BDAPI.Web.Host

# 前台同樣流程，路徑換成 IFare_API.EntityFrameworkCore / IFare_API.Web.Host
```

⚠️ Production migration 流程仍需主管 / DevOps 確認：
- IIS 是否需停應用程式集區？
- 是否走 ABP Migrator console 工具（如有）？
- 失敗回滾機制？

### 6.3 多環境設定檔

目前**只有 `appsettings.json` 一份**，**未使用** `appsettings.Development.json` / `appsettings.Production.json`。

環境切換邏輯由程式內 `RolloutConfigurer` 處理（依執行環境變數動態選用 `Local_*` 或正式連線字串）。

⚠️ 建議補 `appsettings.Production.json` 區分環境（特別是 CORS origins、JWT SecurityKey），以避免 dev 設定洩漏到 prod。

### 6.4 首次部署 SOP（依現況推導，待主管 / DevOps 校對）

**1. 環境前置條件**
- Windows Server 2019+ + IIS 10+
- .NET 6 SDK + ASP.NET Core Hosting Bundle
- SQL Server 2019+（本地或遠端）
- Node.js 18+（給 Nuxt 前台）

**2. 建立資料庫**
```sql
CREATE DATABASE IFare;             -- 業務主資料庫
CREATE DATABASE IFare_FDAPIDb;     -- 前台 ABP 系統表
CREATE DATABASE IFare_BDAPIDb;     -- 後台 ABP 系統表
```

**3. 跑 EF Migration（兩組 API 各跑一次）**
見 §6.2 SOP。首次跑會建立 ABP 預設表（AbpUsers、AbpRoles、AbpPermissions 等）。

**4. 設定 appsettings.json**
- `ConnectionStrings.Default` / `IFare`：填正式 DB 連線字串
- `Authentication.JwtBearer.SecurityKey`：**換成生產用密鑰**（不要用 source code 內的預設值）
- `App.CorsOrigins`：填正式機域名
- `App.ServerRootAddress` / `ClientRootAddress`：對齊正式 URL

**5. 首次啟動驗證**
- 啟動兩組 API（IIS Site）
- 開 `/swagger` 確認端點齊全
- `SeedHelper.SeedHostDb()` 會自動建 admin 帳號（後台 ABP 預設）
- **務必改 admin 預設密碼**

**6. IIS 設定**
- 建立兩個 Application Pool（前台 / 後台），.NET CLR Version = `No Managed Code`
- 套用 `web.config` 的 URL Rewrite 規則
- 綁定 HTTPS 憑證（建議 Let's Encrypt + Certify the Web）
- 主站綁 `/ifare_api/` → 前台 API；`/ifare_backend_api/` → 後台 API

**7. 前台 Nuxt（iFare_Frontend）**
- `npm install` + `npm run build`
- 部署 `.output/` 到 IIS（搭配 iisnode 或反向代理至 Node 程序）

**8. 後台管理介面 Vue（iFare_Backend）**
- `npm install` + `npm run build`
- 部署 `dist/` 到 IIS 站台

**9. 健康檢查**
- 跑一次 GET `/api/services/app/News/GetNewsList` 確認回應
- 後台用 admin 帳號登入確認 JWT 流程
- 圖片上傳測試

⚠️ **未涵蓋項目**（需另外詢問主管）：
- VM 環境的特殊設定 / 遠端網路權限
- 正式機備份 / 還原機制
- log 集中收集 / 異常告警（目前只寫本機檔案）
- 自動部署 CI/CD 流程
- HTTPS 憑證自動更新

### 6.5 Health Check 端點

⚠️ **未發現** `/health` 或 `/api/health` 等標準 health check 端點。確認方式：
- 兩個專案 `Startup.cs` / Module 內**未呼叫** `services.AddHealthChecks()` / `app.UseHealthChecks()`
- **未定義**任何 `[Route("health")]` 的 Controller

**建議補實作（給主管參考）：**
```csharp
// Startup.cs / ConfigureServices
services.AddHealthChecks()
    .AddDbContextCheck<IFare_BDAPIDbContext>();

// Configure
app.UseHealthChecks("/api/health");
```

無此端點時可暫用 `GET /api/services/app/News/GetNewsList` 的 200 回應作為粗略 health probe。

### 6.6 多語言支援

後端有 `zh-Hans/` / `zh-Hant/` / `de/` / `es/` 等 `Microsoft.Data.SqlClient.resources.dll`，但這是 .NET runtime 的 SQL Client 訊息資源，**非業務多語**。

業務文字（錯誤訊息、UI 介面）：目前皆中英雙語混合（如 `"成功/Success"`、`"失敗/Fail"`），**無動態語系切換機制**。

如要支援使用者語系切換，需另行實作（建議用 ABP 內建 `IStringLocalizer` 機制）。

### 6.7 BM25 / Jieba 模糊搜尋演算法（前台 FarePolicy 主搜尋）

當使用者透過 `GetIFarePolicyList` 帶 `Query` 關鍵字搜尋時，系統用以下流程處理：

**步驟 1：分詞（JiebaNet.Segmenter）**
- 用 `JiebaSegmenter.Cut()` 將中文 `Query` 字串切分為詞彙陣列
- 例：`"低收入戶補助"` → `["低收入戶", "補助"]`
- 套件：`JiebaNet.Segmenter` + `JiebaNet.Analyser` NuGet
- 位置：`IFare_API.Core/TaskManager/Common/TraditionalChineseFuzzyMatcher.cs:6,12`

**步驟 2：BM25 評分**
- `FarePolicyTaskManager.cs` 內 `TokenizeForBm25()` / `BuildTermFrequencyMap()` / `ComputeBm25Score()`
- 對每筆候選政策，計算 query 詞 vs 政策內容（Title / Qualification / WelfareInfo 等）的 BM25 相似度
- 評分公式（標準 BM25）：
  ```
  score(D, Q) = Σ IDF(qi) · f(qi, D) · (k1 + 1) / (f(qi, D) + k1 · (1 - b + b · |D| / avgdl))
  ```
- k1, b 參數實際值需查 `ComputeBm25Score()` 內常數定義（建議補入文件）

**步驟 3：繁體中文模糊匹配（TraditionalChineseFuzzyMatcher）**
- 處理錯字 / 同義詞容錯（例如 "補助" vs "補貼"）
- 與 BM25 結果合併加權

**步驟 4：排序與輸出**
- 依綜合分數降序排列
- **無分頁限制**（round4 現況）：回傳所有符合候選

📌 **演算法權重 / 閾值參數待補**：實際 BM25 的 `k1` / `b` 參數值、模糊匹配閾值等需查 `ComputeBm25Score()` 與 `TraditionalChineseFuzzyMatcher` 實作後補入本節。

⚠️ master `b89f5b9` (v1.0.3) 是否有調整此演算法的權重 / 閾值，等合併後可一併校對。

---

## 七、變更紀錄

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| v1.0 | 2026-04-14 | 初版目錄骨架建立 |
| v1.1 | 2026-04-28 | 補完所有端點細節；FarePolicy 新增 `Keyword`/`SkipCount`/`MaxResultCount` 參數與 `totalCount` 回應；說明記憶體保護機制 ⚠️ **註：v1.1 描述的部分 FarePolicy 內容與目前 round4 分支實作不符** |
| v2.0 | 2026-04-28 | 整併版正式釋出 |
| v2.1 | 2026-05-05 | 第一波補完：對照 source code 修正錯誤碼系統（5 → 16 個）、CRUD 方法簽章、DTO 結構、CORS 實值、Personal / ImgManager 命名修正、Img/GetmImg 補入；新增章節「六、部署 / 維運」 |
| **v2.2** | **2026-05-05** | **補完待審版：將 v2.1 標 [TBD] 項目透過 source code 進一步驗證；補完 JWT TTL / 演算法、圖片上傳實際機制、Code 6 表 Entity 額外欄位、permissions 實際位置、前台 logging 設定、首次部署 SOP 初稿；新增 §6.7 BM25 / Jieba 演算法說明；FarePolicy 章節改為「依 round4 現況」描述（保留待 master `b89f5b9` 合併後校對註記）** |

---

## 附錄：尚需校對 / 補完的項目

以下項目**建議由主管 / DevOps 校對後補入或修正**。本版已盡量從 source code 抽取現況資料，但部分需要正式環境 / 業務領域知識才能確認：

### 待主管確認
1. **§3.3 `rememberClient` 細節** — ABP 內建處理，但實際 cookie / session 行為需主管確認
2. **§3.4.6 CodeDomicile / CodeRecipient ID 對照表** — 「中央 = 1」「縣市 = 2-23」等業務約定的 ID 編號需業務端文件補
3. **§3.4.5 / §4.6 5MB 圖片上限** — code 內未發現此限制，主管須確認限制實作位置（前端？反向代理？口頭規範？）
4. **§4.7 正式環境 CORS** — 是否補 `https://www.i-fare.org.tw`？是否清掉 localhost 開頭？
5. **§6.4 首次部署 SOP** — 初稿基於現況推導，需 DevOps 校對遺漏 / 錯誤步驟
6. **§6.7 BM25 演算法 k1 / b 參數值** — 從 `ComputeBm25Score()` 取實際常數補入

### 待主管合併 master `b89f5b9` 後校對
1. **§2.3.4 / §3.4.2 FarePolicy** — 完整 DTO 欄位（Welfare 巢狀關聯、申辦條件、補助金額等）
2. **§4.3 完整錯誤碼若有新增** — 重新對照 `ErrAPI.cs`
3. **§6.7 BM25 演算法權重 / 閾值** — v1.0.3 是否有調整

### 建議改善項目（資安 / 維運）
1. **§3.4.5 圖片上傳安全性補強** — 補檔案大小、副檔名白名單、檔名清洗
2. **§4.7 環境分離** — 新增 `appsettings.Production.json`
3. **§5.1 Swagger 保護** — 正式環境補 Basic Auth
4. **§6.5 Health Check 補實作** — 補 `/api/health` 端點

---

**資料抽取自：**
- `Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Application/`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Application/`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Web.Core/IFare_BDAPIWebCoreModule.cs`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Core/Constants/ErrAPI.cs`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Core/Constants/PageConst.cs`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Core/Model/IFare/Code*.cs`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Core/TaskManager/ImgManager/ImgManagerTaskManager.cs`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Application/Roles/RoleAppService.cs`
- `Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Core/TaskManager/Common/TraditionalChineseFuzzyMatcher.cs`
- `Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Core/TaskManager/Fare/Policy/FarePolicyTaskManager.cs`
- 兩個專案的 `appsettings.json` / `web.config` / `log4net.config`
- 兩個專案的 `EntityFrameworkCore/Migrations/`

**抽取日期：** 2026-05-05
