# iFare 基金會網站 — 資料庫說明

> 版本：v1.0（草案）  
> 建立日期：2026-04-14  
> 負責人：昀臻  

---

## 目錄

### 一、資料庫架構總覽
- 1.1 SQL Server 環境資訊（版本 / 實體名稱 / 驗證方式）
- 1.2 資料庫清單與用途
  - IFare（主資料庫 — 前後台共用）
  - IFare_FDAPIDb（前台 API 專用 — ABP 系統表）
  - IFare_BDAPIDb（後台 API 專用 — ABP 系統表 + 使用者）
- 1.3 資料庫關係圖

### 二、IFare 主資料庫 — 資料表定義
- 2.1 News — 最新消息
- 2.2 ArticleWelfare — 福利文章
- 2.3 ArticleLazy — 懶人包
- 2.4 IfarePolicy — 福利政策
- 2.5 IfareQA — 常見問題
- 2.6 IfareOfficeUnit — 洽辦單位
- 2.7 Collaborator — 公益夥伴
- 2.8 ImgManage — 圖片管理
- 2.9 VisitorRecord — 訪客紀錄
- 2.10 代碼表（共 6 張）
  - 2.10.1 CodePolicy — 政策類別
  - 2.10.2 CodeRecipient — 受助對象
  - 2.10.3 CodeKeyword — 關鍵字
  - 2.10.4 CodeIncome — 經濟條件
  - 2.10.5 CodeIdentity — 特殊身分
  - 2.10.6 CodeDomicile — 戶籍地

### 三、IFare_BDAPIDb — 後台系統表
- 3.1 AbpUsers — 使用者帳號
- 3.2 AbpRoles — 角色定義
- 3.3 AbpPermissions — 權限設定
- 3.4 其他 ABP 系統表（Audit / Settings / Tenants）

### 四、IFare_FDAPIDb — 前台系統表
- 4.1 ABP Framework 系統表說明

### 五、資料表關聯
- 5.1 ER Diagram（實體關聯圖）
- 5.2 福利政策關聯（Policy ↔ Code 表）
- 5.3 文章關聯（Articles ↔ CodePolicy / CodeKeyword）
- 5.4 洽辦單位關聯（OfficeUnit ↔ CodeDomicile）

### 六、資料維護
- 6.1 連線方式與工具（SSMS）
- 6.2 備份與還原
- 6.3 資料遷移注意事項
- 6.4 常用查詢語句範例
