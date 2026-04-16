# iFare 基金會網站 — API 說明

> 版本：v1.0（草案）  
> 建立日期：2026-04-14  
> 負責人：昀臻  

---

## 目錄

### 一、API 架構總覽
- 1.1 雙 API 架構說明（前台 API vs 後台 API）
- 1.2 共用框架（ASP.NET Core + ABP 7.3 + DDD）
- 1.3 前後台 API 差異對照表

### 二、前台 API（iFare_Frontend_API）
- 2.1 基本資訊（URL / Port / 認證方式）
- 2.2 認證設定（JWT 關閉 — 公開讀取）
- 2.3 端點清單
  - 2.3.1 最新消息 — /News/*
  - 2.3.2 福利文章 — /ArticlesWelfare/*
  - 2.3.3 懶人包 — /ArticlesLazy/*
  - 2.3.4 福利政策 — /FarePolicy/*
  - 2.3.5 常見問題 — /FareQA/*
  - 2.3.6 洽辦單位 — /FareOfficeUnit/*
  - 2.3.7 公益夥伴 — /Collaborator/*
  - 2.3.8 代碼查詢 — /Code/GetCode[Type]List
  - 2.3.9 訪客紀錄 — /Visitor/SetVisitorRecord
- 2.4 請求格式（Query Parameters）
- 2.5 回應格式（ABP 標準 JSON）

### 三、後台 API（iFare_Backend_API）
- 3.1 基本資訊（URL / Port / 認證方式）
- 3.2 認證設定（JWT 開啟 — Bearer Token）
- 3.3 認證端點
  - 3.3.1 POST /api/TokenAuth/Authenticate
  - 3.3.2 POST /api/services/app/Main/Login
- 3.4 CRUD 端點清單
  - 3.4.1 最新消息 — /News/* (Get/Insert/Update/Delete)
  - 3.4.2 福利文章 — /ArticlesWelfare/* (CRUD)
  - 3.4.3 懶人包 — /ArticlesLazy/* (CRUD)
  - 3.4.4 福利政策 — /FarePolicy/* (CRUD)
  - 3.4.5 常見問題 — /FareQA/* (CRUD)
  - 3.4.6 洽辦單位 — /FareOfficeUnit/* (CRUD)
  - 3.4.7 公益夥伴 — /Collaborator/* (CRUD)
  - 3.4.8 代碼維護 — /Code[Type]/* (×6 種 CRUD)
  - 3.4.9 帳號管理 — /Account/* (CRUD)
  - 3.4.10 個人設定 — /Personal/* (Update/UpdatePwd)
  - 3.4.11 圖片管理 — /ImgFile/UpdateImageFile
  - 3.4.12 流量分析 — /Visitor/GetVisitorSummary, GetVisitorChartData
- 3.5 請求格式（Headers / Body / Query）
- 3.6 回應格式（ABP 標準 JSON + errCode/errMsg）

### 四、API 共用規範
- 4.1 Base URL 結構（/api/services/app/{Service}/{Method}）
- 4.2 HTTP Method 使用規則
- 4.3 錯誤處理與錯誤碼定義
- 4.4 分頁參數規範
- 4.5 日期格式規範
- 4.6 圖片上傳規範（Base64 / FormData）

### 五、API 測試
- 5.1 測試工具建議（Postman / Swagger）
- 5.2 測試帳號與環境
- 5.3 常見問題排除
