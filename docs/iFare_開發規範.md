# iFare 基金會網站 — 開發規範

> 版本：v1.0（草案）  
> 建立日期：2026-04-14  
> 負責人：昀臻  

---

## 目錄

### 一、Git 工作流程
- 1.1 分支策略
  - master（正式版，僅從 develop 合併）
  - develop（整合分支）
  - feature/* / fix/* / hotfix/*（功能/修復分支）
- 1.2 分支命名規範（含範例）
- 1.3 Commit 訊息格式
  - feat / fix / refactor / style / docs / chore / hotfix
  - 範例與反例
- 1.4 PR 流程與審核要點
- 1.5 合併策略（squash merge / rebase）

### 二、前台開發規範（Nuxt 3）
- 2.1 檔案命名慣例（pages / components / assets）
- 2.2 元件開發模式（Composition API + script setup）
- 2.3 Props / Emits 定義規範
- 2.4 API 呼叫方式（使用 $WebApiGet / $WebApiPost）
- 2.5 樣式撰寫規範
  - SCSS 檔案放置位置
  - 色彩/字型/間距使用變數
  - RWD 斷點使用方式
- 2.6 圖片/圖示新增流程
- 2.7 新增頁面的 checklist

### 三、後台開發規範（Vue 3）
- 3.1 新增 CRUD 模組的標準流程
  - 建立 4 個 view 檔案
  - 註冊路由（router/index.ts）
  - 新增 API 方法（WebAPI.ts）
  - 新增選單項目（AsideMenu.json）
  - 新增型別定義（interface/MTable.ts）
- 3.2 元件使用規範（Element Plus + 自訂元件）
- 3.3 狀態管理規範（何時用 Pinia / 何時用元件 state）
- 3.4 表格資料結構規範（TbDataInfo 繼承模式）
- 3.5 錯誤處理規範

### 四、共用規範
- 4.1 TypeScript 使用原則
- 4.2 console.log 清理（不可殘留）
- 4.3 註解撰寫原則
- 4.4 不可 commit 的檔案清單（AjaxRef.ts 等）
- 4.5 環境變數管理

### 五、Code Review Checklist
- 5.1 功能正確性
- 5.2 RWD 是否正常
- 5.3 無障礙基本檢查
- 5.4 效能考量
- 5.5 安全性檢查
