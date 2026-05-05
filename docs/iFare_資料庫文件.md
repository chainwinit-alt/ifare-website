# iFare 基金會網站 — 資料庫文件

> 版本：v2.0（整併版）
> 建立日期：2026-04-14
> 整併日期：2026-04-28
> 負責人：昀臻
>
> **檔案來源**：本檔由 `iFare_資料庫說明.md` 改名而來，**未與其他檔案合併**。
> 與 `iFare_API文件.md` 為同系列、互相對照（資料表 ↔ 對應 API / 模組）。

---

## 一、資料庫架構總覽

### 1.1 SQL Server 環境資訊

| 項目 | 本地開發 | 正式環境 |
|------|----------|----------|
| 版本 | SQL Server Express 2019+ | SQL Server Standard |
| 實體名稱 | `localhost\SQLEXPRESS` 或 `CHAINWIN-CHAINW\SQLEXPRESS` | `112.121.114.177` |
| 驗證方式 | Trusted Connection（Windows 驗證） | SQL Server 驗證 |
| 連線管理 | Max Pool Size=50 / Connection Timeout=15s（v1.1 新增） | 同左 |

連線字串設定於各 API 專案的 `appsettings.json`：
- `iFare_Frontend_API/src/IFare_API.Web.Host/appsettings.json`
- `iFare_Backend_API/src/IFare_API.Web.Host/appsettings.json`

### 1.2 資料庫清單與用途

| 資料庫 | 用途 | 由誰存取 |
|--------|------|----------|
| `IFare` | **主資料庫** — 所有業務資料表 | 前台 API + 後台 API（共用） |
| `IFare_FDAPIDb` | 前台 API 專用 — ABP 系統表 | 僅 iFare_Frontend_API |
| `IFare_BDAPIDb` | 後台 API 專用 — ABP 系統表 + 使用者 | 僅 iFare_Backend_API |

### 1.3 資料庫關係圖（簡化）

```
┌─────────────────────┐
│ IFare（主資料庫）    │
│                     │
│  News               │
│  ArticleWelfare ────┐
│  ArticleLazy ───────┤
│  IfarePolicy ───────┼─── CodePolicy
│  IfareQA            │    CodeRecipient
│  IfareOfficeUnit ───┤    CodeKeyword
│  Collaborator       │    CodeIncome
│  ImgManage          │    CodeIdentity
│  VisitorRecord      │    CodeDomicile
│  SysUser            │
└─────────────────────┘

┌──────────────┐     ┌──────────────┐
│ FDAPIDb      │     │ BDAPIDb      │
│ ABP 系統表   │     │ ABP 系統表   │
│ Audit Log    │     │ AbpUsers     │
│ Settings     │     │ AbpRoles     │
│ Tenants      │     │ Permissions  │
└──────────────┘     └──────────────┘
```

---

## 二、IFare 主資料庫 — 資料表定義

### 2.1 News — 最新消息

| 欄位 | 型別 | 說明 |
|------|------|------|
| `Id` | bigint | PK |
| `Title` | nvarchar(200) | 標題 |
| `Detail` | nvarchar(max) | 內文（HTML） |
| `ReleaseTime` | datetime? | 發布時間 |
| `DiscontinuedTime` | datetime? | 下架時間 |
| `State` | varchar(10) | `Active` / `Disabled` / `Delete` |
| `CreateTime` | datetime | 建立時間 |
| `UpdateTime` | datetime? | 最後更新時間 |
| `CreateUserId` | bigint? | FK → SysUser |
| `UpdateUserId` | bigint? | FK → SysUser |

**前台查詢條件**：`ReleaseTime != null AND ReleaseTime <= now AND (DiscontinuedTime == null OR DiscontinuedTime > now) AND State != Disabled/Delete`

### 2.2 ArticleWelfare — 福利文章

| 欄位 | 型別 | 說明 |
|------|------|------|
| `Id` | bigint | PK |
| `Title` | nvarchar(200) | 標題 |
| `CodePolicyId` | bigint? | FK → CodePolicy |
| `Image` | nvarchar(500) | 封面圖（檔名） |
| `Detail` | nvarchar(max) | 內文（HTML） |
| `ReleaseTime` | datetime? | 發布時間 |
| `DiscontinuedTime` | datetime? | 下架時間 |
| `State` | varchar(10) | 同 News |
| `CreateTime` / `UpdateTime` | datetime | |

**關聯表**：`ArticleWelfareCodeKeyword`（多對多 → CodeKeyword）

### 2.3 ArticleLazy — 懶人包

結構同 ArticleWelfare，加上 `ArticleLazyImage` 1:N 關聯（懶人包多張步驟圖）。

### 2.4 IfarePolicy — 福利政策（**主搜尋目標**）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `Id` | bigint | PK |
| `Title` | nvarchar(200) | 標題（**Keyword 搜尋目標 1**） |
| `CodePolicyId` | bigint? | FK → CodePolicy（政策類別） |
| `CodeDomicileId` | bigint? | FK → CodeDomicile（戶籍地，1=中央） |
| `IfareOfficeUnitId` | bigint? | FK → IfareOfficeUnit（洽辦單位） |
| `OfficeUnitInfo` | nvarchar(max) | 洽辦單位補充資訊 |
| `OfficeUnitTel` | nvarchar(100) | 洽辦電話 |
| `CompetentAuthority` | nvarchar(200) | 主管機關 |
| `Qualification` | nvarchar(max) | 資格條件（**Keyword 搜尋目標 2**） |
| `WelfareInfo` | nvarchar(max) | 福利內容 HTML（**Keyword 搜尋目標 3**） |
| `Evidence` | nvarchar(max) | 應備證件 |
| `Remark` | nvarchar(max) | 備註 |
| `ReleaseTime` | datetime? | 發布時間 |
| `DiscontinuedTime` | datetime? | 下架時間 |
| `State` | varchar(10) | |
| `CreateTime` / `UpdateTime` | datetime | |

**5 層多對多關聯**（v1.1 重要：這是搜尋效能瓶頸）：

```
IfarePolicy ┬──── IfarePolicyCodeKeyword ──── CodeKeyword
            ├──── IfarePolicyCodeIdentity ─── CodeIdentity
            ├──── IfarePolicyCodeIncome ───── CodeIncome
            └──── IfarePolicyCodeRecipient ── CodeRecipient
```

每筆 `IfarePolicy` 可關聯多個關鍵字、特殊身分、經濟條件、受助對象。早期 EF Core 用 `.Include()` 串接 4 個子集合會產生「Cartesian explosion」（笛卡爾積），單筆主資料 × N 個 keywords × M 個 identities × ... 會導致 SQL JOIN 結果列數爆炸。

**v1.1 已改採 `AsSplitQuery()`**：將單一 SQL JOIN 拆成多支獨立 query，避免結果列數倍增。

### 2.5 IfareQA — 常見問題

| 欄位 | 型別 | 說明 |
|------|------|------|
| `Id` | bigint | PK |
| `Question` | nvarchar(200) | 問題 |
| `Answer` | nvarchar(max) | 答案（HTML） |
| `Sort` | int | 排序 |
| `State` | varchar(10) | |

### 2.6 IfareOfficeUnit — 洽辦單位

| 欄位 | 型別 | 說明 |
|------|------|------|
| `Id` | bigint | PK |
| `Title` | nvarchar(200) | 機構名稱 |
| `State` | varchar(10) | |

**3 層關聯**：
```
IfareOfficeUnit ──── IfareOfficeUnitDomicile ──── IfareOfficeUnitDomicileDetail (聯絡資訊)
                                                  └─── CodeDomicile（行政區）
```

### 2.7 Collaborator — 公益夥伴

| 欄位 | 型別 | 說明 |
|------|------|------|
| `Id` | bigint | PK |
| `Title` | nvarchar(200) | 夥伴名稱 |
| `Url` | nvarchar(500) | 官網 |
| `Logo` | nvarchar(500) | Logo 圖檔名 |
| `State` | varchar(10) | |

### 2.8 ImgManage — 圖片管理

| 欄位 | 型別 | 說明 |
|------|------|------|
| `Id` | bigint | PK |
| `FileName` | nvarchar(500) | 檔名 |
| `RelativePath` | nvarchar(500) | 相對路徑 |
| `Type` | varchar(20) | 圖片用途分類 |
| `CreateTime` | datetime | |

### 2.9 VisitorRecord — 訪客紀錄

| 欄位 | 型別 | 說明 |
|------|------|------|
| `Id` | bigint | PK |
| `VisitTime` | datetime | 造訪時間 |
| `Page` | nvarchar(200) | 頁面路徑 |
| `IPAddress` | varchar(45) | 訪客 IP |
| `UserAgent` | nvarchar(500) | 瀏覽器資訊 |

### 2.10 代碼表（共 6 張）

所有代碼表結構一致，僅命名不同。共同欄位：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `Id` | bigint | PK（**1 通常代表「不限/中央/全選」**） |
| `LabelName` | nvarchar(100) | 顯示名稱 |
| `State` | varchar(10) | `Active` / `Disabled` |
| `CreateTime` / `UpdateTime` | datetime | |

| 表名 | 用途 |
|------|------|
| `CodePolicy` | 政策類別（生活補助 / 教育補助 / 醫療補助…） |
| `CodeRecipient` | 受助對象（年齡區間） |
| `CodeKeyword` | 關鍵字 tag |
| `CodeIncome` | 經濟條件（中低收入戶 / 低收入戶…） |
| `CodeIdentity` | 特殊身分（身障 / 原住民 / 新住民…） |
| `CodeDomicile` | 戶籍地（中央 = 1，再加 22 個直轄市/縣市） |

---

## 三、IFare_BDAPIDb — 後台系統表

### 3.1 AbpUsers — 使用者帳號

ABP 內建欄位：`UserName`、`EmailAddress`、`Password`、`IsActive`、`Name`、`Surname`...

### 3.2 AbpRoles — 角色定義

iFare 定義三種角色：
- **管理員**（Admin）：所有權限
- **編輯者**（Editor）：CRUD 內容（不含帳號管理）
- **檢視者**（Viewer）：唯讀

### 3.3 AbpPermissions — 權限設定

權限名稱格式：`Pages.{Module}.{Action}`，例如：
- `Pages.News.Edit`
- `Pages.FarePolicy.Delete`
- `Pages.Account.Manage`

### 3.4 其他 ABP 系統表

- `AbpAuditLogs`：操作稽核
- `AbpSettings`：系統設定
- `AbpTenants`：多租戶（iFare 單租戶，不使用）
- `AbpFeatures`、`AbpLanguages` 等

---

## 四、IFare_FDAPIDb — 前台系統表

僅含 ABP Framework 內建系統表，無業務資料。前台 API 不需登入故 `AbpUsers` 無實際用途，但 EF Core migration 仍會建立。

---

## 五、資料表關聯

### 5.1 ER Diagram（核心關聯）

```
News ─────── (no FK, 獨立)

ArticleWelfare ────── CodePolicy
            └──── ArticleWelfareCodeKeyword ──── CodeKeyword

ArticleLazy ────── CodePolicy
          └──── ArticleLazyCodeKeyword ──── CodeKeyword
          └──── ArticleLazyImage（1:N）

IfarePolicy ──── CodePolicy
            ──── CodeDomicile
            ──── IfareOfficeUnit
            └──── IfarePolicyCodeKeyword ────── CodeKeyword
            └──── IfarePolicyCodeIdentity ───── CodeIdentity
            └──── IfarePolicyCodeIncome ─────── CodeIncome
            └──── IfarePolicyCodeRecipient ──── CodeRecipient

IfareOfficeUnit ──── IfareOfficeUnitDomicile ──── IfareOfficeUnitDomicileDetail
                                                └──── CodeDomicile
```

### 5.2 福利政策關聯（最複雜的查詢來源）

`IfarePolicy` 的查詢需 JOIN：
1. `CodePolicy`（政策類別）
2. `CodeDomicile`（戶籍地）
3. `IfareOfficeUnit`（洽辦單位）
4. `IfarePolicyCodeKeyword` ↔ `CodeKeyword`（多對多）
5. `IfarePolicyCodeIdentity` ↔ `CodeIdentity`（多對多）
6. `IfarePolicyCodeIncome` ↔ `CodeIncome`（多對多）
7. `IfarePolicyCodeRecipient` ↔ `CodeRecipient`（多對多）

**v1.1 改善**：搜尋查詢已從單一 JOIN 改為 `AsSplitQuery()`，配合 `Skip/Take` 分頁，避免無條件查詢造成記憶體爆炸。

### 5.3 文章關聯

文章兩張表（`ArticleWelfare` / `ArticleLazy`）共用：
- 1:1 → `CodePolicy`（政策類別）
- M:N → `CodeKeyword`（透過中介表）

### 5.4 洽辦單位關聯

`IfareOfficeUnit` → `IfareOfficeUnitDomicile`（M:N with `CodeDomicile`）→ `IfareOfficeUnitDomicileDetail`（聯絡資訊：地址、電話、網址）

---

## 六、資料維護

### 6.1 連線方式與工具

- **SSMS（SQL Server Management Studio）**：主要管理工具
- **Azure Data Studio**：跨平台輕量替代
- **EF Core CLI**：`dotnet ef migrations` 用於 schema 異動

### 6.2 備份與還原

- **正式環境**：每日 02:00 自動備份至 `D:\Backup\IFare_*.bak`
- **手動備份**：SSMS → 右鍵資料庫 → Tasks → Back Up...
- **還原步驟**：詳見 `iFare_維護SOP.md`

### 6.3 資料遷移注意事項

- **state 欄位字串大小寫敏感**：`Active` ≠ `active`
- **代碼表 ID = 1 是「不限」/「中央」**：刪除前務必檢查業務邏輯
- **多對多中介表的 FK 串聯刪除**：刪除 IfarePolicy 時務必先刪中介表
- **Migration 命令需指定專案**：
  ```
  dotnet ef migrations add MigrationName --project IFare_API.EntityFrameworkCore --startup-project IFare_API.Web.Host
  ```

### 6.4 常用查詢語句範例

**查詢有效福利政策（前台口徑）**：
```sql
SELECT p.Id, p.Title, cp.LabelName AS PolicyType, cd.LabelName AS Domicile
FROM IfarePolicy p
LEFT JOIN CodePolicy cp ON p.CodePolicyId = cp.Id
LEFT JOIN CodeDomicile cd ON p.CodeDomicileId = cd.Id
WHERE p.ReleaseTime IS NOT NULL
  AND p.ReleaseTime <= GETDATE()
  AND (p.DiscontinuedTime IS NULL OR p.DiscontinuedTime > GETDATE())
  AND p.State NOT IN ('Disabled', 'Delete')
  AND cp.State <> 'Disabled'
  AND cd.State <> 'Disabled'
ORDER BY p.ReleaseTime DESC;
```

**關鍵字搜尋（v1.1 新增）**：
```sql
SELECT p.Id, p.Title
FROM IfarePolicy p
WHERE (p.Title LIKE N'%補助%'
    OR p.Qualification LIKE N'%補助%'
    OR p.WelfareInfo LIKE N'%補助%')
  AND p.State NOT IN ('Disabled', 'Delete');
```

**查詢某政策的所有受助對象**：
```sql
SELECT p.Title, cr.LabelName AS Recipient
FROM IfarePolicy p
JOIN IfarePolicyCodeRecipient pr ON p.Id = pr.IfarePolicyId
JOIN CodeRecipient cr ON pr.CodeRecipientId = cr.Id
WHERE p.Id = @policyId;
```

**檢查管理員帳號**：
```sql
USE IFare_BDAPIDb;
SELECT u.UserName, u.EmailAddress, u.IsActive, r.Name AS Role
FROM AbpUsers u
JOIN AbpUserRoles ur ON u.Id = ur.UserId
JOIN AbpRoles r ON ur.RoleId = r.Id
WHERE r.Name = 'Admin';
```

---

## 變更紀錄

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| v1.0 | 2026-04-14 | 初版目錄骨架建立 |
| v1.1 | 2026-04-28 | 補完所有資料表欄位定義；新增關聯圖；加入 SQL 查詢範例；說明 IfarePolicy 5 層關聯與 v1.1 `AsSplitQuery` 改善 |
