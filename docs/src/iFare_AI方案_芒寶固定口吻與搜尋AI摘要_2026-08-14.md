# iFare AI 方案說明：芒寶固定口吻 ＆ 搜尋 AI 摘要

> 日期：2026-08-14
> 範圍：iFare_Frontend（Nuxt 3）
> 相關程式：`server/api/chatbot.post.ts`、`server/utils/chatbot/*`、`server/api/llm/summarize*`、`server/utils/llm/*`、`components/IfareSummaryCard.vue`

---

## 一、芒寶聊天機器人：用 API 回答，但口吻 100% 固定

### 1. 問題

聊天機器人要用 LLM API 回答開放式問題，但基金會希望回覆永遠是「芒寶」的固定口吻。
LLM 生成的文字先天就會有語氣變異，**光靠 prompt 規則不可能保證 100% 固定**。

### 2. 解法核心原則

> **AI 決定「答什麼」，人決定「怎麼說」。**

把「理解問題」交給 LLM，把「產生文字」盡量留給人先寫好的答案卡（ChatbotCard）。
只要回覆文字是人寫的，口吻就是 100% 固定；LLM 生成只當最後手段。

### 3. 四層漏斗架構（`server/api/chatbot.post.ts`）

| 層 | 機制 | 回覆文字來源 | 口吻 |
|---|---|---|---|
| Layer 1 | 關鍵字比對直接命中答案卡（`matcher.ts`，中文斷詞 + bigram） | 人寫的答案卡 | 100% 固定 |
| Layer 2 | LLM「選卡」：只輸出卡片代號 `{"id":"..."}`，沒有生成文字的空間 | 人寫的答案卡 | 100% 固定 |
| Layer 3 | LLM 生成：僅在沒有合適卡片時觸發，帶 top-3 卡片當唯一知識來源 | LLM（受控） | 高度收斂 |
| Layer 4 | 罐頭兜底：LLM 全掛或超出範圍時的固定話術 | 人寫 | 100% 固定 |

絕大多數常見問題會被 Layer 1、2 攔下，**訪客拿到的幾乎都是人寫的句子**；
Layer 3 是最少觸發的一層，並用三道措施收斂語氣：

1. **Persona 規則**：完整的芒寶語氣規範（用「您」、不用公文句型、不用表情符號…）。
2. **Few-shot 語氣範例（2026-08-14 新增）**：prompt 內放入 3 組取材自答案卡的標準問答，
   小模型對「照著範例的說話方式講」的服從度遠高於條列規則。
3. **後處理**：`normalizeReplyText()` 砍掉「好呀／好的」等開場、裁切長度、統一句尾。

### 4. 為什麼不選其他做法

- **純 System Prompt**：語氣仍會飄，尤其是免費額度的小模型；無法承諾「固定」。
- **模型微調（fine-tune）**：成本高、免費供應商不支援、每次改口吻都要重訓。
- **全部寫死腳本**：涵蓋不了開放式問題。
- 四層漏斗是「可涵蓋開放問題」與「口吻可控」之間的最佳平衡，且 LLM 用量最省
  （選卡只花 ~32 output tokens）。

### 5. 自動知識庫：基金會不需要定期補卡（2026-08-14 加入）

基金會反映不想「每過一段時間就手動補固定回覆」。解法：**芒寶的知識跟著網站內容自動長**，
新增 `server/utils/chatbot/siteKnowledge.ts`（開關 `NUXT_CHATBOT_RAG_ENABLED`，預設開）：

| 來源 | 自動化方式 | 口吻 |
|---|---|---|
| 常見問題（FareQA，後台本來就在維護） | 每題自動轉成一張答案卡：問句自動斷詞成關鍵字、答案原文照用 | 100% 固定（文字是人在後台寫的） |
| 最新消息 / 福利專欄 | 最新標題自動帶進 Layer 3 生成層，訪客問「最近有什麼活動」答得出實際標題 | 生成層（受控） |
| 答案卡（ChatbotCard 後台） | 維持原機制，作為「最常見問題的精修覆蓋」，同分時優先於自動卡 | 100% 固定 |

- 快取 10 分鐘：後台改完 FareQA / 發新消息，芒寶最慢 10 分鐘自動學會，**零人工搬運**。
- 任一來源失敗都回空集合並沿用舊快取，芒寶不會因此啞掉（與 cardStore 同守則）。
- 已在真實資料驗證：問「報戶口的時候可以順便申請生育獎勵金嗎？」→ 命中自動卡 `qa-2`，
  回覆即後台 FareQA 原文（來源 `card`，比對分數 0.796）。
- 結論：**日常完全不用為芒寶另外維護內容**——維護網站本來就要維護的常見問題與消息即可；
  想精修個別高頻問題的說法時，才需要動後台答案卡。
- Layer 3 的語氣範例在 `chatbot.post.ts` 的 `buildGenerateSystemPrompt()`，
  若基金會覺得語氣不對，優先增修範例句，而不是加規則。

---

## 二、i-Fare 搜尋結果 AI 摘要（Google AI Overview 式）

實測畫面（真實資料庫、搜尋「長照」）：`docs/images/iFare_AI摘要_長照搜尋展示_2026-08-14.png`

### 1. 行為設計

| 情境 | 模式 | 輸出 |
|---|---|---|
| 首次搜尋、站內**有**相符政策 | `overview` | Google 式結構化摘要：開頭總覽（**粗體**重點）＋「### 站內相符的福利」列點＋（資料足夠時）「### 如何申請」步驟，每句附 `[參考 N]` 引用膠囊，點了直接進政策內頁；結尾自動接一句循序引導提問 |
| 首次搜尋、站內**沒有**相符政策 | `overview_general` | 一般知識總覽（唯一允許站外常識的模式）：第一行固定免責說明「目前站內沒有相符政策，以下為 AI 整理的一般資訊…」＋主題科普＋「### 常見的服務方向」＋「### 可以怎麼開始」（只准制度性常識與官方管道，禁止金額／數字／縣市細節／民間機構／網址）。可設 `NUXT_LLM_SUMMARY_GENERAL_FALLBACK=0` 關閉，關閉後退回原本的一句話引導 |
| 「回覆摘要提問」追問對話 | `guidance` | 維持原本的一句話循序引導（戶籍地 → 年齡 → 經濟 → 身分） |

### 2. 資料紅線

摘要**只能**整理送進 prompt 的站內候選政策（top-3，經 `enrich.ts` 補齊政策詳情），
不得使用站外知識、不得編造金額／資格／單位／流程。這是與 Google 摘要唯一的刻意差異：
Google 有全網資料可引用，本站引用站外知識會產生查證與責任問題。

### 3. 架構與資料流

```
pages/ifare/result.vue
  └─ IfareSummaryCard.vue ──POST /api/llm/summarize/stream（SSE）
                               ├─ enrichSummaryCases()   取政策詳情當摘要依據
                               ├─ mode 判斷              首次+有結果 → overview
                               └─ summarizeWithFreeTier() Groq(gpt-oss) → Gemini(flash-lite) 依序容錯
                                    ├─ buildOverviewPrompt()（shared.ts）
                                    ├─ OVERVIEW_SYSTEM_PROMPT / normalizeOverview()（providers.ts）
                                    └─ ensureOverviewGuidance() 結尾接引導提問
```

- `[參考 N]` 的 N 對應 prompt 內「政策 N」＝畫面下方「摘要引用政策」卡片的 01/02/03。
  前端 `applyInlineMarkdown()` 會轉成可點的來源膠囊；不存在的編號會整顆移除。
- 快取：伺服器端 24 小時（key 含 mode/query/條件/卡片），前端 sessionStorage 30 分鐘
  （版本 `v39-ai-overview`，升版即失效舊快取）。
- Markdown 只支援受控子集（粗體、###、列點、編號），經自寫 renderer + DOMPurify 消毒。

### 4. 搜尋意圖解析（同日加強）

關鍵字框接受整句問句、複數關鍵字與含錯字的複合詞，例如：
「老人可以申請甚麼補助？」→ 搜尋詞「老人津貼」＋自動套用年齡「老人」；
「低收入戶」→ 自動套用經濟條件篩選；
「新北市老**任**津貼」→ 錯字自動修正＋自動套用「新北市」與「老人」。

- **雙軌解析**：LLM 解析（`search-intent.post.ts`）輸出 searchQuery／area／recipient／income／identities，
  並與本地正則抽取（`utils/ifareIntent.ts` 的 `extractExplicitSearchConditions`）合併——LLM 掛掉時本地兜底仍可用。
- **條件自動套用**（`result.vue` 的 `applyResolvedSearchFilters`）：只在使用者**未自行選擇**該欄位時帶入，
  絕不覆蓋手動設定；套用後同步網址參數。
- **錯字修正**：`fixCommonTypos`（老任津貼→老人津貼等），LLM 提示詞也要求修正同音誤植。
- **複數關鍵字**：以空白、頓號分隔的多關鍵字會拆段各查一次，由 reciprocal-rank fusion 合併，字面命中權重高於 AI 擴充詞。

### 5. 常用調整位置

| 想調整 | 位置 |
|---|---|
| 摘要段落結構、字數、語氣 | `server/utils/llm/shared.ts` → `buildOverviewPrompt()` |
| 引導提問順序與問句 | `server/utils/llm/shared.ts` → `SUMMARY_GUIDANCE_QUESTIONS` |
| token 上限／模型順序 | `server/utils/llm/providers.ts`、`freeTier.ts` |
| 摘要卡樣式（膠囊、標題、動畫） | `components/IfareSummaryCard.vue` |
| 引用政策數量（目前 3） | `IfareSummaryCard.vue` `referenceCases` 與 endpoint 的 `sanitizeSummaryCases(cases, 3)` |
