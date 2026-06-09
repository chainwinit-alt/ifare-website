# iFare 關鍵字推薦補齊與 AI 摘要


## 文件目的

這份文件主要交接兩個容易被混在一起、但其實是不同層次的功能：

1. 關鍵字推薦補齊
2. 搜尋結果頁的 AI 摘要

前者本質上是前端規則型提示，目的是幫使用者想到可以搜哪些詞；後者則是拿搜尋結果再做整理摘要，幫使用者快速理解目前查到的福利方向。

這兩塊雖然都跟「搜尋體驗」有關，但技術實作完全不同，維護時要分開看。

## 相關檔案

### 首頁查詢頁

- `Dev/Dev Code/iFare_Frontend/pages/ifare.vue`

### 結果頁

- `Dev/Dev Code/iFare_Frontend/pages/ifare/result.vue`

### AI 摘要卡片元件

- `Dev/Dev Code/iFare_Frontend/components/IfareSummaryCard.vue`

## 第一部分：關鍵字推薦補齊

## 功能定位

目前 iFare 的「關鍵字推薦」不是 autocomplete，也不是呼叫推薦 API，更不是 LLM 即時生成。現況是：

- 根據使用者已選條件
- 用前端規則組合出一小組建議詞
- 把這些字放進 IP 泡泡提示

所以它的功能比較接近：

- 搜尋提示
- 思路引導
- 協助使用者換字再搜一次

而不是直接幫使用者改寫 query。

## 首頁 `ifare.vue` 的推薦邏輯

### 相關變數

首頁主要看這幾個區塊：

- `selectedPolicyCode`
- `selectedRecipientCode`
- `selectedAreaCode`
- `selectedQuery`
- `selectedLifeEvent`
- `keywordSuggestionList`
- `keywordSuggestionTip`

其中真正拿來組推薦詞的核心是 `keywordSuggestionList`。

### 資料來源

首頁的 `keywordSuggestionList` 目前會從畫面上已選條件中抓名稱，不是抓 code。主要來源有：

1. 受助情況名稱
2. 年齡區間名稱
3. 人生事件名稱

這裡的目的很單純，就是讓提示文案顯示的是使用者看得懂的詞，不是系統代碼。

### 排除規則

在把條件拿去組推薦詞之前，會先排除沒有辨識度的值，至少已確認包含：

- `全部`
- `全國`

這樣做是避免最後提示變成「全部、補助、津貼」這種沒有資訊量的內容。

### fallback 關鍵字

如果目前選到的條件本身不夠多，系統還是會補一組通用建議詞，避免泡泡內容太空。

目前首頁的 fallback 詞有：

1. `補助`
2. `津貼`
3. `照顧`
4. `就學`
5. `就業`

### 規則型擴充

除了直接拿目前條件名稱之外，還有額外補字規則。現況已確認有：

- 受助情況包含 `育`：補 `育兒津貼`、`托育補助`
- 受助情況包含 `老`：補 `老人福利`、`長照`
- 受助情況包含 `障礙`：補 `身心障礙`、`輔具補助`
- 年齡區間包含 `兒`：補 `兒童補助`
- 年齡區間包含 `青` 或 `學生`：補 `就學補助`

這些規則的目的，是讓提示不要只複述目前已選條件，而是能多跨一步，提供比較像搜尋詞的字。

### 去重與裁切

推薦詞組好後，會：

1. 用 `Set` 去重
2. 取前 `5` 筆

也就是說，最終不會丟一大串字給泡泡，長度會被控制住。

### 最終提示文案

首頁目前輸入框用的是：

```ts
這裡可以直接搜關鍵字，我建議你試試：${keywordSuggestionList.value.join('、')}。
```

這段不是直接 render 在欄位下方，而是綁到輸入框的 `data-mascot-tip`，讓 IP 在 hover / focus 關鍵字欄位時顯示。

## 結果頁 `ifare/result.vue` 的推薦邏輯

## 為什麼結果頁也要有一份

首頁推薦詞解決的是「第一次搜尋時不知道怎麼下字」。

結果頁推薦詞解決的是：

- 搜完之後結果太廣
- 想改成更精準的字重搜
- 想根據目前篩選條件再細化

所以結果頁不是沿用首頁原文案，而是改成更偏「精修搜尋」的語氣。

### 相關變數

結果頁主要看：

- `keywordSuggestionList`
- `keywordSuggestionTip`
- `appliedSummarySearchContext`
- `buildFarePolicyApiQuery()`

真正負責推薦詞的是前兩者，但要理解資料怎麼來，還是要一起看搜尋條件是怎麼被整理的。

### 結果頁的推薦資料來源

結果頁的推薦詞目前主要會參考：

1. 受助情況 label
2. 年齡區間 label
3. 戶籍地 label
4. 人生事件名稱

比首頁多看了一個戶籍地，因為結果頁的查詢條件通常更完整。

### 規則與首頁的關係

結果頁的 fallback 與規則型擴充目前基本上和首頁一致，這是刻意維持一致性的做法，避免：

- 首頁建議你搜 A
- 結果頁又突然只建議你搜 B

如果未來要新增推薦規則，實務上要兩邊一起改。

### 結果頁提示文案

結果頁目前文案是：

```ts
這裡可以改搜更精準的詞，我建議你試試：${keywordSuggestionList.value.join('、')}。
```

這段目前有接在桌機版與手機版的關鍵字輸入框上，所以兩邊 hover / focus 都會有反應。

## 首頁與結果頁之間的差異

雖然兩頁都有 `keywordSuggestionList`，但定位不同：

- 首頁：幫使用者啟動第一次搜尋
- 結果頁：幫使用者修正或收斂搜尋方向

這代表後續如果要調文案，不應該直接複製貼上成一模一樣的敘述。

## 維護時要注意的事

### 目前沒有共用 composable

首頁和結果頁各自保有一份相近邏輯，不是抽成共用 composable。

這代表：

1. 改一邊不會自動同步另一邊
2. 很容易發生兩頁推薦規則慢慢分岔
3. 接手的人如果只改首頁，很可能結果頁會漏掉

### 目前推薦詞不會自動回填輸入框

現在它只是提示文字，不會自動把建議詞塞回 `query` 欄位，也不會在使用者 hover 時改寫搜尋參數。

如果未來想做成「點一下推薦詞就可直接搜尋」，那是另外一個功能，不是現在這套。

### 目前這套不依賴 AI

雖然這份文件同時談到 AI 摘要，但關鍵字推薦本身不走 AI。未來如果有人以為這段要去查 LLM provider，那方向會找錯。

## 第二部分：AI 摘要

## 功能定位

AI 摘要的目的不是取代搜尋結果，而是幫使用者快速理解：

- 目前這組條件大致查到哪些福利方向
- 可能優先看的福利有哪些
- 重要參考項目是哪些

所以摘要卡片是在結果列表之上，屬於導讀層。

## 結果頁怎麼接摘要卡片

`ifare/result.vue` 目前會 render：

```vue
<IfareSummaryCard
  :query="appliedSearchQuery"
  :cases="storageiFarePolicyList"
  :provider="llmProvider"
  :results-loading="isLoading"
  :search-context="appliedSummarySearchContext"
  :summary-trigger-key="summaryTriggerKey"
  :summary-cache-key="routeSearchSignature"
  :summary-reset-key="summaryResetKey"
/>
```

從這裡可以看出，摘要卡不是自己去抓搜尋結果，而是結果頁先把資料查好，再把整理好的條件和 cases 丟給它。

## `ifare/result.vue` 這一層負責什麼

結果頁本身和摘要卡的分工大致如下：

### 結果頁負責

1. 組搜尋條件
2. 呼叫搜尋 API
3. 保存搜尋結果
4. 管理搜尋結果快取
5. 整理要交給摘要卡的 query / context / trigger key

### 摘要卡負責

1. 在現有 cases 裡做排序
2. 呼叫 LLM
3. 顯示摘要文字
4. 處理摘要快取
5. 解析摘要中的參考案例

這個分工要先記住，因為以後如果摘要怪怪的，不代表搜尋 API 有問題，也可能是摘要卡自己的排序或快取命中了。

## 搜尋結果快取

結果頁自己就有一層快取，不要和摘要快取混在一起看。

目前設定在 `ifare/result.vue`：

- `SEARCH_CACHE_KEY_PREFIX = "ifare-search-cache:"`
- `SEARCH_CACHE_TTL_MS = 30 * 60 * 1000`
- `SEARCH_CACHE_MAX_ITEMS = 120`

這層快取的是搜尋結果。

也就是說，如果同樣搜尋條件短時間內重複查詢，可能根本不會重打結果 API。

## 搜尋條件怎麼整理給摘要卡

結果頁目前整理了：

- `appliedSearchQuery`
- `appliedSummarySearchContext`
- `routeSearchSignature`
- `summaryTriggerKey`
- `summaryResetKey`

### `appliedSearchQuery`

這是摘要卡最直接拿來理解「現在使用者到底在搜什麼」的 query 字串。

### `appliedSummarySearchContext`

這個是把搜尋條件再整理成比較易讀的 context，內容已確認包含：

- 受助情況
- 年齡區間
- 戶籍地
- 所得分類
- 身分別
- 關鍵字

這層的目的是讓摘要不是只看單一 `query`，而是能知道整組搜尋上下文。

### `routeSearchSignature`

這個值目前被當成摘要快取 key 的一部分，也就是摘要卡會把它當成「這一組搜尋條件的識別碼」。

### `summaryTriggerKey`

這個值用來主動觸發摘要重算。

### `summaryResetKey`

這個值用來在條件切換或重設時，強制摘要卡重置內部狀態。

## `buildFarePolicyApiQuery()` 的角色

結果頁搜尋條件最終會透過 `buildFarePolicyApiQuery()` 組成 API query。已確認目前會組的欄位有：

- `CodePolicy`
- `CodeRecipient`
- `CodeDomicile`
- `CodeIncome`
- `Query`
- `CodeIdentities`
- `LifeEvent`

這層雖然不是 AI 摘要本體，但它會直接決定：

- 結果頁查到哪些 cases
- 摘要卡後面能拿哪些資料來整理

所以如果使用者反映「摘要跟我想搜的不一樣」，除了看 prompt，也要先看是不是前面的 query 組裝就已經偏掉。

## `IfareSummaryCard.vue` 目前的實作重點

## Provider 狀態

目前 `IfareSummaryCard.vue` 的 provider 型別是：

```ts
type ProviderName = "gemini";
```

結果頁傳入的 `llmProvider` 也固定是：

```ts
"gemini" as const
```

所以現況可以直接理解成：

- 功能上只有 Gemini
- 不是多 provider 正式切換架構

雖然元件內仍保留 `selectedProvider`、`providerOptions` 等結構，但目前可用值只有 `gemini`。

## 元件內部職責

`IfareSummaryCard.vue` 主要負責：

1. 接收結果頁傳進來的 cases
2. 先對 cases 做排序
3. 呼叫 `$llm`
4. 生成摘要
5. 解析摘要中的 `[參考 n]`
6. 顯示參考案例卡片與連結
7. 處理摘要快取

## `rankCases()` 為什麼重要

AI 摘要不是對全部 cases 無差別處理，而是先經過：

```ts
rankCases(query, cases)
```

目前這個排序會把 query 正規化後，再去比對各福利資料中的多個欄位，至少已確認包含：

- 標題
- 地區
- 資格 / 條件相關內容

再加上額外權重，目的是把較相關的案例排到前面。

這件事非常重要，因為如果摘要品質不好，不一定是 LLM 不行，也可能是前面送進去的 reference cases 排序就不對。

## 摘要中的參考連結

元件內有：

- `referenceTokenPattern = /\[參考\s*(\d+)\]/g`

代表摘要內容會解析像：

- `[參考 1]`
- `[參考 2]`

這類 token，並把它轉成對應福利資料的連結與參考卡片。

參考案例最後會指回 `/ifare/info?id=...` 這種詳細頁，讓使用者能從摘要直接進一步看單筆福利資訊。

## 摘要快取

摘要卡自己也有一層快取，和結果頁快取分開。

目前設定在 `IfareSummaryCard.vue`：

- `SUMMARY_CACHE_VERSION = "v5"`
- `SUMMARY_CACHE_KEY_PREFIX = "ifare-summary-cache:"`
- `SUMMARY_CACHE_TTL_MS = 30 * 60 * 1000`

### 快取 key 內容

從元件內的 key 組法來看，摘要快取至少會納入：

- cache version
- provider
- query / context 類資訊

這樣做的目的，是避免不同搜尋條件或不同 provider 共用同一份舊摘要。

## `$llm` 的角色

摘要卡是透過：

```ts
const { $llm } = useNuxtApp();
```

拿到前台注入的 LLM 能力。

也就是說，摘要卡自己不直接知道底層 provider SDK 細節，而是透過 Nuxt app 注入的 abstraction 呼叫。

如果未來摘要突然完全不能用，除了看 `IfareSummaryCard.vue`，也要一起追 `$llm` 的注入來源。

## 重試與 provider UI 狀態

模板內目前可以看到 provider 切換與 retry 相關結構，但現況要注意：

1. provider 選項實際上只有 `gemini`
2. 多 provider 並不是正式上線狀態
3. UI 上有些切換 / retry 能力是保留設計，不代表目前商業流程真的在用多模型切換

因此接手時不要直接假設這是一套完整的 provider abstraction。

## 常見維護情境

### 想改關鍵字推薦詞的規則

要同時檢查：

- `pages/ifare.vue`
- `pages/ifare/result.vue`

因為兩邊目前不是共用實作。

### 想讓推薦詞真的可以點

這需要新增 UI 與事件，不是只改 `keywordSuggestionTip` 文案就夠。

### 想調整摘要更貼近搜尋意圖

優先看：

1. `buildFarePolicyApiQuery()` 是否組對條件
2. `appliedSummarySearchContext` 是否缺重要欄位
3. `rankCases()` 是否把正確案例排到前面
4. `$llm` 端的 prompt / provider 行為

### 想確認摘要沒更新是不是 bug

先排查：

1. 是否命中搜尋結果快取
2. 是否命中摘要快取
3. `summaryTriggerKey` / `summaryResetKey` 是否有正確變動

不要一開始就直接判定是模型沒回新內容。

## 已知限制

1. 關鍵字推薦目前是規則型字串組裝，不是語意理解或向量推薦。
2. 首頁與結果頁目前維護兩份相近邏輯，有重複碼風險。
3. AI 摘要品質高度依賴前面 cases 排序與快取命中狀況。
4. Provider 雖然留了結構，但現況實際上是 Gemini 單一路徑。

## 建議後續重構方向

### 1. 把關鍵字推薦抽成 composable

目前首頁與結果頁規則很像，未來最容易出問題的就是兩邊越改越不一致。抽成 composable 會比較好維護。

### 2. 明確區分搜尋快取與摘要快取的除錯資訊

如果之後要更好交接或排錯，建議在開發模式下補更清楚的 debug log，讓人一眼知道現在命中的是哪一層快取。

### 3. 如果要真的支援多 provider，要補齊整條鏈

不能只打開 UI，還要一起確認：

1. provider 切換是否真的影響 `$llm`
2. cache key 是否完整納入 provider
3. retry / fallback 流程是否一致

## 總結

這份功能可以用一句話記：

「關鍵字推薦是前端規則提示，AI 摘要是對搜尋結果再整理，而且兩者都在結果頁附近出現，但技術路徑完全不同。」

接手時先把這個界線分清楚，後面排查速度會快很多。
