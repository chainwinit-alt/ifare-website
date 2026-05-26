# iFare AI 維運助理 — 規劃文件

> 對應 xlsx **後臺優化** #100–#113、#123，**PoC 研究** #14、#15、#20、#24–#31。
> 制定時間：2026-05-26｜狀態：草案 v1

---

## 📋 給主管的 2 分鐘總覽

### 為什麼要做這件事？

> 目前 iFare 維護工作有大量「**重複的整理跟確認**」 — 每次部署要手動 smoke test、每天要看 xlsx 300 列待辦、每次改 code 要記得跑 build 跟 type-check、scripts/ 已堆了 50+ 個一次性檢查腳本。**這些都不是創造性工作，可以交給 agent，把人力留給決策跟設計。**

### 我們要做什麼？分 5 個階段，每階段都能單獨驗收

| 階段 | 做什麼 | 預估時間 | 風險 |
|---|---|---|---|
| **1. MVP 報告**（先做） | 每天一份 Markdown 報告：今天完成什麼、待處理重點、風險、建議任務 | 1 週 | 低（純讀取） |
| **2. 寫回 xlsx** | Agent 建議能寫回 xlsx，**每次都要人工確認 diff** | 1 週 | 低 |
| **3. 自動巡檢** | build / type-check / hardcoded URL / 安全風險自動掃 | 2 週 | 中 |
| **4. 後台 view** | 後台新增「AI 維護中心」頁，顯示報告與待辦（管理者限定） | 1 週 | 低 |
| **5. 事件處理** | API 異常、build 失敗、登入失敗率異常的即時通知與分流 | 2-4 週 | 中-高（碰到通知整合） |

**最快可開始日：第 1 階段現在就能動工，1 週內可看到第一份報告。**

### 怎麼控管風險？三道防線

1. **永遠 read-only 為主** — 預設不修改任何 code、不 commit、不 push、不刪資料、不打正式 API
2. **人工核准每個寫入動作** — 寫回 xlsx 要看 diff 才確認；改 code 是 patch 文字交給人 apply；commit / push 永遠是人工執行
3. **黑白名單** — 明確列出 agent 可以讀什麼（白名單）、絕對不可讀什麼（黑名單：`.env*`、`appsettings.json`、`*.key`、`*.pem`）

### Agent **不會**做的事（明確排除）

- ❌ 不會自動 commit、push、deploy、刪除資料
- ❌ 不會回覆 i-Fare 民眾或客服信
- ❌ 不會替主管或產品做優先級決策
- ❌ 不會碰 secrets、token、密碼（直接被黑名單擋）
- ❌ 不會打正式 API（不連線 DB、不對外發 request）

### 需要主管 / 團隊先決策的 5 件事

1. 報告產出頻率：**每天排程**自動跑，還是**手動觸發**？
2. 後台 AI 維護中心要不要對「**編輯者**」開放？（建議只給管理者）
3. xlsx 寫回是否要 **自動 commit**？（建議**不要**，由人工 commit）
4. 要不要記錄 Agent 每次執行的 **audit log**？（建議要）
5. 階段五的事件通知要不要接 **LINE / Email**？

決策完成後，第 1 階段可立即啟動。

---

> 以下為**工程細節**，主管不必看完；給工程師交接 / 實作 / 驗收使用。

---

## 1. 為什麼要做（細節版）

目前痛點：
- xlsx 任務追蹤檔已超過 300 列、跨 4 個 sheet，人工掃過一輪要 30 分鐘
- 每次部署/環境變更後，要靠人記得測登入、API、PageBuilder、圖片上傳、前台動態頁、chatbot fallback（已有 `#88 Smoke Test 清單` 但仍是手動勾選）
- 每日進度、待辦優先順序、風險整理仍需人工彙整
- `scripts/` 已累積 50+ 個一次性 patch 腳本（`update-uiux-*.mjs` / `list-*.mjs` / `verify-*.mjs`），命名與輸出格式分散

要解決：**讓 agent 把這些重複的「讀資料 + 整理 + 報告」工作自動化**，但**人仍是最後把關者**。

---

## 2. 代名詞

| 代名詞 | 意義 |
|---|---|
| **Agent** | 執行讀取、分析、報告產出的程式（第一版是本機 CLI）。**不等於** Claude / GPT；agent 可以用 LLM，也可以是純規則式。 |
| **報告** | Agent 輸出的 Markdown，固定格式，存於 `docs/ai-agent-reports/`。 |
| **巡檢** | 日常排程觸發的全量檢查（build / type-check / hardcoded URL / console.log / v-html / xlsx 待處理…）。 |
| **事件** | 不定期出現、需要立即處置的訊號（同步失敗、上傳失敗、build 失敗、404 飆高、內容過期…）。 |
| **人工核准** | 任何寫入動作（寫回 xlsx、改 code、commit、push）都需要使用者明確同意。 |
| **可讀路徑** | Agent 允許讀取的檔案路徑（白名單）。 |
| **禁止路徑** | Agent 明確不可讀的路徑（`.env*`、`appsettings.*.json`、`/secrets/**`）。 |

---

## 3. 五階段路線圖

每階段都可獨立驗收，**前一階段沒驗收完不進下一階段**。

### 階段一：MVP CLI（對應 xlsx 後台 #100 / #108 / #109 / #113）

- 新增 `scripts/ai-maintenance-report.mjs`
- 讀取：xlsx + git log（過去 7 天）+ `docs/*.md` 索引
- 輸出：`docs/ai-agent-reports/YYYY-MM-DD.md`
- 限制：**read-only**，不寫回 xlsx、不改 code、不 commit
- 觸發：手動 `node scripts/ai-maintenance-report.mjs`
- 驗收：見「§8 PoC 驗收標準」

### 階段二：寫回 xlsx（對應 #101）

- Agent 建議的新待辦項目能寫回 `後臺優化` sheet
- 沿用既有 `scripts/update-*.mjs` 的 xlsx-js-style 寫入方式
- **每次寫入前都要人工確認** diff
- 寫入後保留來源備註欄（誰建議的、什麼時候、依據）

### 階段三：自動巡檢（對應 #102 / #103）

- npm script: `npm run agent:lint`、`npm run agent:scan`
- 涵蓋：
  - `front/back` build + type-check（前後台分別）
  - hardcoded URL 掃描（grep `localhost:` `i-fare.org.tw` `:44311` 等）
  - `console.log` 殘留掃描
  - 未過 sanitize 的 `v-html` / `dangerouslyUseHTMLString` 掃描
  - PageBuilder：slug 衝突、缺 SEO、孤兒圖片、未發布草稿
- 輸出整合進報告

### 階段四：後台 AI 維護中心 view（對應 #105）

- 新增 `/AdminAgent` route（管理者限定）
- 顯示：今日報告 / 待辦建議 / 巡檢結果 / 操作紀錄
- read-only UI，按鈕只能「再執行一次」「標記已處理」「轉建議到 xlsx」

### 階段五：事件處理（對應 #104 / #110 / #111 / #112 / #123）

- 規則表：哪些事件高優先（需 30 分內處理）、可自動處理、需人工接手
- 操作紀錄：每次 agent 動作寫 audit log
- 安全防護：見「§7 安全防護」

---

## 4. 架構設計（第一版）

```
┌─────────────────────────────────────────────────────────┐
│  使用者（Emma / 主管 / 維護人員）                          │
└──────────────┬──────────────────────────────────────────┘
               │ node scripts/ai-maintenance-report.mjs
               ▼
┌─────────────────────────────────────────────────────────┐
│  scripts/ai-maintenance-report.mjs                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 1. 讀 docs/agent.config.json （可讀/禁止白名單）  │    │
│  │ 2. 讀 xlsx (後臺優化 / UIUX / PoC / 統計摘要)    │    │
│  │ 3. 讀 git log -7d                                │    │
│  │ 4. 讀 docs/*.md 索引                             │    │
│  │ 5. 套用報告 template                             │    │
│  │ 6. 寫到 docs/ai-agent-reports/YYYY-MM-DD.md     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

           ↓ （階段四之後）

┌─────────────────────────────────────────────────────────┐
│  後台 view (/AdminAgent) — 讀 docs/ai-agent-reports/*    │
│  顯示報告、待辦、巡檢結果                                  │
└─────────────────────────────────────────────────────────┘
```

第一版**不引入** LLM API（避免外部依賴與成本不可預期）；先用規則式統計：
- xlsx 待處理：依 priority + area 排序
- git log：抓 7 天內變更檔案 / commit message
- build/type-check：執行回傳 exit code 與最後 30 行 log
- 規則覆蓋率夠之後再考慮接 LLM 做「自然語句摘要」

---

## 5. 設定檔規格（`docs/agent.config.json`）

```jsonc
{
  "version": 1,
  "report": {
    "outputDir": "docs/ai-agent-reports",
    "filenamePattern": "YYYY-MM-DD.md",
    "retentionDays": 90
  },
  "readPaths": [
    "docs/**/*.md",
    "docs/**/*.xlsx",
    "scripts/**/*.mjs",
    "Dev/Dev Code/iFare_Backend/src/**",
    "Dev/Dev Code/iFare_Frontend/**",
    "README.md",
    ".github/**"
  ],
  "denyPaths": [
    ".env",
    ".env.*",
    "**/appsettings*.json",
    "**/secrets/**",
    "**/*.key",
    "**/*.pem",
    "**/node_modules/**"
  ],
  "commands": {
    "backendBuild": "npm --prefix \"Dev/Dev Code/iFare_Backend\" run build",
    "backendTypeCheck": "npm --prefix \"Dev/Dev Code/iFare_Backend\" run type-check",
    "frontendBuild": "npm --prefix \"Dev/Dev Code/iFare_Frontend\" run build"
  },
  "git": {
    "logSince": "7 days ago",
    "ignorePaths": [
      "*.lock",
      "node_modules/**",
      ".nuxt/**",
      ".output/**"
    ]
  },
  "xlsx": {
    "trackingFile": "docs/iFare_問題追蹤與AI維運規劃.xlsx",
    "sheets": ["後臺優化", "UIUX問題追蹤清單", "PoC研究", "統計摘要"]
  }
}
```

---

## 6. 報告格式（`docs/ai-agent-reports/YYYY-MM-DD.md`）

固定 8 段，順序固定，方便寫回 xlsx 與後續解析：

```markdown
# iFare 維護報告 YYYY-MM-DD

## 1. 今日完成
- [後台] ...（從 git log 抓昨天 ~ 今天的 commit）
- [前台] ...
- [docs] ...

## 2. 進行中
- 「{title}」（owner / 開分支 / 預計時程）

## 3. 待處理重點（高優先）
| # | 區塊 | 標題 | 為什麼急 |
|---|---|---|---|
| ... | ... | ... | ... |

## 4. 風險與異常
- [build] 後台 build 失敗，最後一行：...
- [安全] 偵測到新的 hardcoded URL：path:line
- [內容] 福利政策 0 筆（API 回 result.length=0）

## 5. 環境健康（Smoke Test 摘要）
- 後台 API：✅ 200
- 前台首頁：✅ 200
- 動態頁同步端點：⚠️ 無法 ping
- 上次完整 Smoke Test：YYYY-MM-DD HH:MM by {user}

## 6. 建議任務（可寫回 xlsx）
- ➕ 新增 「{title}」到 後臺優化 / {area}
  - 優先級：{中}
  - 原因：{依據}

## 7. 不確定 / 需要決策
- 「{question}」（需主管 / 設計 / 後端 / 法務確認）

## 8. 元資料
- 報告產生時間：YYYY-MM-DD HH:MM
- Agent 版本：1.0.0
- 讀取檔案數：N
- 略過檔案數（denyPaths 命中）：N
```

---

## 7. 優先級判斷規則

Agent 自動判斷時用以下規則（與 xlsx 既有 priority 欄位一致）：

| 條件 | 優先級 |
|---|---|
| `[資安]` `[效能]` `[部署]` 類，且 build/type-check 失敗 | **高** |
| 影響「使用者付款 / 申請 / 帳號操作」核心流程 | **高** |
| 同類問題出現 ≥ 3 處（如同樣 console.log 出現在 3 個 view） | **中** |
| 文件、命名、註解、code style | **低** |
| 不確定 | **中**（保守原則） |

人工可在 xlsx 內改 priority，agent 下次讀進來會以人工為主。

---

## 8. PoC 驗收標準（對應 xlsx PoC #14 / 後臺優化 #113）

階段一 MVP 必須通過以下 8 項才能進階段二：

- [ ] 能讀 `docs/iFare_問題追蹤與AI維運規劃.xlsx` 全部 4 個 sheet，欄位對映正確
- [ ] 能列出當日 git 異動（含哪個 commit、誰、哪些檔案）
- [ ] 能整理高優先級待辦 Top 5 並排序
- [ ] 產生固定格式報告（§6 規範），同樣輸入產生同樣輸出
- [ ] **不修改任何程式碼**（report 之外沒寫入動作）
- [ ] **不外洩 secrets**（`.env*`、`appsettings.*.json`、`*.key`、`*.pem` 都被 denyPaths 擋住）
- [ ] **不觸碰正式資料**（不打正式 API、不連線任何 DB）
- [ ] 報告產生時間 < 30 秒（在 Emma 的 Windows 機器上）

---

## 9. 人工核准流程

「**Agent 永遠在副駕駛**」— 任何「影響可見狀態」的動作都要人工點 OK。

```
read-only 報告                  → 自動，不需核准
   ↓
人工看報告，決定要不要採納     ← 人工
   ↓
寫回 xlsx (新增建議任務)        → 需人工 diff 確認
   ↓
人工指派任務                    ← 人工
   ↓
agent 提出低風險程式修改建議    → 自動，但 output 是 patch 文字
   ↓
人工 apply patch（用 git apply 或 IDE） ← 人工
   ↓
build / type-check 自動驗證     → 自動
   ↓
人工 commit + push              ← 人工（不自動）
```

「低風險程式修改」第一版定義：
- 刪除明確的 console.log（規則式判斷）
- 補 TypeScript type annotation
- 移除未使用的 import
- 補 alt 屬性、補 aria-label

「高風險修改」一律不自動 — 包含：DB schema、權限邏輯、路由、auth、API URL、密碼相關。

---

## 10. 安全防護（對應 #104 / #111）

### 讀取
- 只能讀 `readPaths` 白名單內的檔案
- `denyPaths` 黑名單一律擋（即使在 `readPaths` 範圍內）
- 遇到二進位、檔案 > 5MB 自動跳過並記錄

### 輸出
- 報告寫到磁碟前 sanitize：
  - 偵測 JWT / Bearer token pattern → 遮蔽
  - 偵測連續 32+ 字英數混合 → 標記為「疑似 secret，已遮蔽」
  - 偵測 `password=`、`token=`、`secret=` 後面接的字串 → 遮蔽
- 報告檔案名稱不含使用者帳號

### Prompt injection 防護
- 從 docs/Markdown 讀到的內容**不被視為指令**，只當資料
- 報告 template 內看到「請執行 / 請刪除 / 請發布」之類祈使句 → 標記但不執行
- xlsx 內看到 `=HYPERLINK(...)` 或 macro → 略過該 cell

### 操作
- 不執行 `rm` / `mv` / `git push --force` / `npm publish`
- 不執行 `curl` / `wget` 對外請求（除了 readPaths 內的本機檔案）
- 任何寫入都先 dry-run 印出 diff，等使用者確認

---

## 11. 事件處理規則（對應 #123 / PoC #24–#31）

事件三層級：

| 等級 | 例子 | 處置 |
|---|---|---|
| **L1 自動處理** | console.log 殘留、未過 sanitize 的 v-html | Agent 提 patch 建議，人工 apply |
| **L2 通知並排入待辦** | build 失敗、type-check 失敗、新出現的 hardcoded URL | 寫入 xlsx 待處理，**並** 顯示在後台 AI 維護中心 |
| **L3 立即升級** | 正式 API 連續 5 分鐘 5xx、登入失敗率異常、`.env` 被誤 commit | 立即 ElNotification + 通知主管，**並** 暫停所有 agent 後續動作 |

PoC 階段先做 L1 + L2，L3 留到後續。

---

## 12. 與既有資源的關係

| 既有 | 新計畫如何接 |
|---|---|
| `scripts/list-backend-pending.mjs` | 邏輯併入 ai-maintenance-report.mjs 的「§6.3 待處理重點」段 |
| `scripts/list-uiux-pending.mjs` | 同上 |
| `scripts/rebuild-stats-summary.mjs` | 階段二寫回 xlsx 時呼叫 |
| `scripts/verify-uiux-marks.mjs` | 巡檢階段加入「xlsx 標記一致性檢查」 |
| `scripts/repair-xlsx-bloat.mjs` | 寫回 xlsx 之後自動跑（避免 theme1.xml 膨脹） |
| `docs/iFare_部署維運與異常處理手冊.md` | Agent 報告引用此文件當「下一步」連結 |
| `docs/iFare_開發上手與協作規範.md` | 階段五加入「Agent 操作規範」附錄 |
| 後台 `/Health` 與 `/Health/Smoke` | 階段四 AI 維護中心顯示這兩頁的最新測試結果 |

---

## 13. 待決問題（請主管 / 團隊回覆）

- [ ] 報告產出頻率：每日（排程）或每次手動？
- [ ] 後台 AI 維護中心要不要對「編輯者」也開放？（目前規劃只給「管理者」）
- [ ] xlsx 寫回時要不要自動加 commit？（建議不要，由人工 commit）
- [ ] 要不要記錄 Agent 每次執行的 audit log（誰跑、跑了什麼、產出什麼）？建議要，存 `docs/ai-agent-reports/_audit.jsonl`
- [ ] 第五階段事件處理是否要接 LINE / Email 通知？

---

## 14. 名詞對照（避免歧義）

- 本文件 **不引用 Claude 私人記憶語法**，因為設計文件要團隊共用
- 「scripts/」一律指 repo 根目錄 `scripts/`
- 「後台」= `Dev/Dev Code/iFare_Backend/`（Vue 3 + Vite，**不是** 後端 .NET API）
- 「後端」= `Dev/Dev Code/iFare_Backend_API/`（.NET ABP）
- 「前台」= `Dev/Dev Code/iFare_Frontend/`（Nuxt 3）

---

## Changelog

- **v1 (2026-05-26)**：初版草案。對齊 xlsx 後臺優化 #100–#113、#123、PoC #14。前置 1 頁主管總覽。**雛形 `scripts/ai-maintenance-report.mjs` 已先產出**，可手動 `node scripts/ai-maintenance-report.mjs` 試跑，輸出在 `docs/ai-agent-reports/YYYY-MM-DD.md`。
