# i-Fare 10.200.0.39:3002 部署說明

## 部署內容

將專案中的下列四個資料夾完整搬到 `.39`，不要只挑 DLL、assets 或 `.output`：

| 系統 | 本機來源 | `.39` 目的地 |
| --- | --- | --- |
| 前台 Nuxt | `Dev\i-fare` | `C:\inetpub\wwwroot\IIS_ifare_3002\i-fare` |
| 前台 API | `Dev\i-fare_API` | `C:\inetpub\wwwroot\IIS_ifare_3002\i-fare_API` |
| 後台 Vue | `Dev\Backend` | `C:\inetpub\wwwroot\IIS_ifare_3002\Backend` |
| 後台 API | `Dev\Backend_API` | `C:\inetpub\wwwroot\IIS_ifare_3002\Backend_API` |

並將專案根目錄的 `DEPLOY-3002.ps1`、`STOP-3002.ps1` 一起放進：

`C:\inetpub\wwwroot\IIS_ifare_3002`

這份輸出使用：

- IIS 對外網址：`http://10.200.0.39:3002`
- Nuxt 內部網址：`http://127.0.0.1:3003`
- 前台平台資料庫：`IFare_FDAPIDb`
- 後台平台資料庫：`IFare_BDAPIDb`
- 共用業務資料庫：`IFare`
- Windows 驗證 SQL：`localhost\SQLEXPRESS`

不建立 `_3002` 資料庫，也不修改既有 `SysUser.Password` 格式。

## 重要影響

3002 與現行 3000 使用不同實體目錄、IIS 站台、App Pool 與 Node 埠，因此啟停 3002 不必停止 3000。

但兩套 API 連到同一批既有資料庫，所以：

- 3002 查到的內容與 3000 相同。
- 在 3002 後台新增、修改、下架政策或停用帳號，會直接改到現行資料。
- 僅查看資料不會改動資料庫內容。
- 驗證期間不要使用正式資料執行寫入測試；需要測試寫入時，請使用可還原的測試資料。

## 搬移前檢查

在 `.39` 確認：

1. Node.js 為 `v18.20.8`。
2. 已安裝對應版本的 .NET Hosting Bundle，IIS 可載入 `AspNetCoreModuleV2`。
3. IIS 已安裝 URL Rewrite 與 ARR，ARR 的 Proxy 已啟用。
4. TCP 3002 尚未被其他 IIS 站台綁定。
5. TCP 3003 尚未被其他 Node 程式監聽。
6. `localhost\SQLEXPRESS` 存在 `IFare`、`IFare_FDAPIDb`、`IFare_BDAPIDb`。
7. 先保留現行 `C:\inetpub\wwwroot\IIS_ifare`，不要覆蓋或改名。

## 自動部署

以系統管理員身分開啟 Windows PowerShell，執行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
Set-Location "C:\inetpub\wwwroot\IIS_ifare_3002"
.\DEPLOY-3002.ps1 -ConfirmSharedDatabase
```

腳本會：

1. 檢查四份輸出與 Node 版本。
2. 檢查 URL Rewrite 與 ARR Proxy。
3. 建立或更新 `IIS_ifare_3002` 站台及四個獨立 App Pool。
4. 建立 `ifare_api`、`ifare_backend`、`ifare_bdapi` 子應用程式。
5. 設定資料夾與 API log 權限。
6. 使用 `sqlcmd` 授予兩個 API App Pool 既有資料庫的讀寫權限。
7. 開放 Windows 防火牆 TCP 3002。
8. 在背景啟動 Node 3003。
9. 啟動 IIS 站台並檢查首頁、i-Fare、前台 API、後台及 Swagger。

若 `.39` 沒有安裝 `sqlcmd`，先在 SSMS 手動設定 SQL 權限，再執行：

```powershell
.\DEPLOY-3002.ps1 -ConfirmSharedDatabase -SkipSqlPermissions
```

SQL 權限對應如下：

| Windows Login | 資料庫 |
| --- | --- |
| `IIS APPPOOL\ifare_fdapi_3002` | `IFare_FDAPIDb`、`IFare` |
| `IIS APPPOOL\ifare_bdapi_3002` | `IFare_BDAPIDb`、`IFare` |

腳本預設授予 `db_datareader` 與 `db_datawriter`，不會授予 `sysadmin` 或 `db_owner`。

## 驗證網址

部署完成後依序確認：

1. `http://10.200.0.39:3002/`
2. `http://10.200.0.39:3002/ifare`
3. `http://10.200.0.39:3002/ifare/result?query=長照`
4. `http://10.200.0.39:3002/ifare/info?id=6416`
5. `http://10.200.0.39:3002/news`
6. `http://10.200.0.39:3002/articles/welfare`
7. `http://10.200.0.39:3002/ifare_api/api/services/app/Code/GetCodeDomicileList`
8. `http://10.200.0.39:3002/ifare_backend/Login`
9. `http://10.200.0.39:3002/ifare_bdapi/swagger/index.html`

功能驗證重點：

- 前台首頁、最新消息、福利專欄可讀到既有 SQL 資料。
- 無關鍵字時政策依上架時間由新到舊。
- 有關鍵字時以文字匹配度優先，再參考 AI 意圖。
- 全國搜尋時相同政策合併，多地區與資格欄位對齊。
- 政策詳細頁保留 `id`，重複開啟不出現 500。
- 後台可正常登入、查詢政策、批次指定政策地區及停用帳號。

## Log 與停止方式

Node log：

- `C:\inetpub\wwwroot\IIS_ifare_3002\i-fare\node-3003.stdout.log`
- `C:\inetpub\wwwroot\IIS_ifare_3002\i-fare\node-3003.stderr.log`

停止整套 3002 測試站台：

```powershell
Set-Location "C:\inetpub\wwwroot\IIS_ifare_3002"
.\STOP-3002.ps1
```

停止 3002 不會停止 3000，也不會刪除網站檔案、IIS 設定或資料庫資料。

## 更新同一套 3002

日後要換新版輸出時：

1. 先執行 `STOP-3002.ps1`。
2. 備份目前 `C:\inetpub\wwwroot\IIS_ifare_3002`。
3. 完整替換四個輸出資料夾。
4. 保留新版輸出內的 `appsettings.json` 與 `web.config`，不要拿 3000 的設定覆蓋。
5. 再執行 `DEPLOY-3002.ps1 -ConfirmSharedDatabase`。

