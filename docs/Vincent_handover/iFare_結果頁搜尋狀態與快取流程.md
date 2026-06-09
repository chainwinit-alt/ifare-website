# iFare 結果頁搜尋狀態與快取流程


## 文件目的

這份文件是交接 `pages/ifare/result.vue` 的搜尋狀態管理用。

結果頁看起來只是：

- 上方一排篩選
- 中間一個摘要
- 下方一串福利結果

但實際上它背後有幾條不同來源的狀態同時在跑：

1. 畫面上的表單欄位狀態
2. route query 狀態
3. API 查詢用的 search params
4. 搜尋結果快取
5. AI 摘要的 trigger / reset 狀態
6. 使用者個人化 profile 回填
7. 搜尋後自動捲到摘要區的 session 狀態

如果不把這幾條分開理解，後續維護很容易出現：

- 改了欄位但結果沒更新
- route 變了但摘要沒重算
- 快取命中導致以為 API 沒生效
- 清空條件後還出現上一輪結果

## 主要檔案

- `Dev/Dev Code/iFare_Frontend/pages/ifare/result.vue`
- `Dev/Dev Code/iFare_Frontend/composables/useWelfareProfile.ts`
- `Dev/Dev Code/iFare_Frontend/components/IfareSummaryCard.vue`

## 功能定位

`ifare/result.vue` 這頁本質上不是單純的「查結果後 render 清單」，而是一個帶有狀態同步的搜尋容器。它要同時處理：

1. 使用者在頁面上改條件
2. 條件同步到網址
3. 用網址或個人化資料還原畫面
4. 避免重複打相同搜尋 API
5. 把目前查到的結果交給 AI 摘要卡

這頁的設計核心是：

「畫面欄位、route query、已套用查詢參數，不是同一份資料，但它們會互相轉換。」

## 一、結果頁的主要狀態分層

## 1. 表單欄位狀態

這層是畫面上使用者目前正在編輯的條件，主要包含：

- `codeSelect_policy`
- `codeSelect_area`
- `codeSelectRecipient`
- `codeSelectIncome`
- `codeSelectIdentity`
- `searchQuery`
- `selectedLifeEvent`

這些值會直接影響：

- 上方篩選 UI 的顯示
- `buildFarePolicyApiQuery()` 組出來的查詢參數
- keyword suggestion 提示

### 特性

這層狀態可以先被使用者改動，但不一定已經正式套用到結果。

例如使用者剛切換一個條件，但還沒按「搜尋」，那畫面欄位已經變了，不代表結果清單已經更新。

## 2. route query 狀態

結果頁會把搜尋條件同步到網址，使用的 query key 目前有：

- `policy`
- `recipient`
- `area`
- `income`
- `identity`
- `query`
- `event`

這一層的用途是：

1. 讓結果頁可分享 / 可重整 / 可直接進入
2. 讓使用者上一頁或重進頁面時可以還原同一組條件
3. 作為結果頁重新 hydrate 的來源

## 3. 已套用查詢參數

結果頁內還有一層：

- `appliedSearchParams`
- `effectiveAppliedSearchParams`

這一層不是「現在表單欄位填了什麼」，而是「目前結果清單實際使用的是哪一組條件」。

### `effectiveAppliedSearchParams`

目前邏輯是：

- 如果 `appliedSearchParams` 已有值，就優先用它
- 否則退回 `routeSearchParams`

這個設計很重要，因為摘要卡、結果清單、已套用查詢上下文，應該跟「實際查出的資料」一致，而不是跟「使用者正準備輸入的新條件」一致。

## 二、route query 與表單狀態怎麼互轉

## `buildFarePolicyApiQuery()`

這個 function 會把目前畫面欄位狀態組成 API 查詢用的物件。

目前會輸出的欄位有：

- `CodePolicy`
- `CodeRecipient`
- `CodeDomicile`
- `CodeIncome`
- `Query`
- `CodeIdentities`
- `LifeEvent`

幾個注意點：

1. `全部` 與 `全國` 不會送進 API 查詢
2. `searchQuery` 會先 `trim()`
3. `CodeIdentities` 是陣列
4. `LifeEvent` 是結果頁實際會參與查詢的一部分

## `buildQueryFromRoute()`

這個 function 則是把網址上的 query 轉回結果頁內部查詢格式。

映射關係目前是：

- `policy -> CodePolicy`
- `recipient -> CodeRecipient`
- `area -> CodeDomicile`
- `income -> CodeIncome`
- `query -> Query`
- `identity -> CodeIdentities`
- `event -> LifeEvent`

其中 `identity` 會先透過 `parseIdentityQuery()` 拆成陣列。

## `syncRouteQueryFromSearch()`

這個 function 方向相反，會把 API query 格式轉回 route query，然後用：

```ts
$router.push({
  path: "/ifare/result",
  query: nextRouteQuery,
});
```

同步到網址。

### 作用

也就是說，結果頁內部不是直接拿表單欄位去查完就算了，而是先把條件同步到網址，再由 route watcher 重新 hydrate 並查資料。

這種做法的好處是：

1. 查詢結果與網址一致
2. 重新整理頁面不會丟條件
3. 可以直接分享結果頁 URL

## `syncFilterStateFromRoute()` / `hydrateFromRoute()`

這兩個是 route -> 畫面 的還原路徑。

### `syncFilterStateFromRoute()`

負責把 route query 寫回各個欄位 state，例如：

- policy
- area
- recipient
- income
- identity
- query
- event

也會一起同步：

- recipient 的 active 狀態
- income 的 active 狀態
- identity 的 active 狀態

### `hydrateFromRoute()`

在同步欄位後，會再呼叫：

```ts
SetDataInit(nextQuery)
```

也就是真正用 route 對應出的查詢參數去初始化結果資料。

## 三、搜尋按鈕按下去後的完整流程

## `Search()`

結果頁上方重新搜尋時，核心入口是 `Search()`。

它目前的流程大致如下：

1. `canSearch` 為 `false` 就直接中止
2. `summaryResetKey.value += 1`
3. `markPendingSummaryScroll()`
4. 用 `buildFarePolicyApiQuery()` 組出 `nextQuery`
5. 把這組條件寫進 `lastQuery`
6. 用 `saveWelfareProfile()` 存一份個人化查詢 profile
7. 比較 `nextQuery` 與目前 route query 對應出的查詢是否相同
8. 如果相同，直接 `SetDataInit(nextQuery)`
9. 如果不同，呼叫 `syncRouteQueryFromSearch(nextQuery)`，讓 route watcher 接手後續流程

## 為什麼要比對 `nextQuery` 與 current route

這一段是避免：

- 使用者按搜尋，但實際條件沒有變
- 還硬做一次 router push

如果目前欄位條件和網址表示的是同一組 query，就直接重跑 `SetDataInit()`，比較乾淨。

## `canSearch`

結果頁不是只看畫面欄位，也會參考 route query 來判斷是否可搜尋。

目前 `canSearch` 是把：

- `buildFarePolicyApiQuery()`
- `buildQueryFromRoute($route.query)`

兩邊合起來看，只要其中有任何條件，就算可搜尋。

這樣做可以避免剛進頁時因為欄位尚未完全 hydrate，按鈕就錯誤顯示成不可用。

## 四、真正查資料的流程

## `SetDataInit(_q)`

這個 function 是結果頁查資料的核心入口。

只要是以下情境，最後都會走到這裡：

- route watcher 初次進頁
- route query 改變
- 搜尋條件相同時直接重搜
- RetryLoad
- 使用個人化 profile 直接初始化

它目前做的事：

1. 把 `_q` 寫進 `lastQuery`
2. 重置錯誤狀態
3. 把 `appliedSearchParams` 更新成這次真正套用的查詢
4. 先讀搜尋快取
5. 有快取就直接套用，不打 API
6. 沒快取才呼叫 `/FarePolicy/GetIFarePolicyList`
7. 把 API 回傳資料整理成頁面使用的 `iFarePolicyItem`
8. 套用到結果清單與分頁
9. 寫入搜尋快取

## `applyPolicyList(items)`

這個 function 負責把結果資料灌進畫面狀態：

- 清空舊的 `storageiFarePolicyList`
- 清空目前頁顯示的 `iFarePolicyList`
- 清空 `pageNums`
- 寫入全部資料到 `storageiFarePolicyList`
- 只把第一頁資料寫入 `iFarePolicyList`
- `summaryTriggerKey.value += 1`
- 重新生成分頁資訊

### `storageiFarePolicyList` 與 `iFarePolicyList` 差異

- `storageiFarePolicyList`：完整結果資料
- `iFarePolicyList`：目前頁碼正在顯示的那一段

摘要卡拿的是完整的 `storageiFarePolicyList`，不是分頁後的 `iFarePolicyList`。

## 五、搜尋結果快取

## 快取位置與壽命

結果頁搜尋快取目前存在：

- `sessionStorage`

不是 `localStorage`。

相關設定如下：

- `SEARCH_CACHE_KEY_PREFIX = "ifare-search-cache:"`
- `SEARCH_CACHE_TTL_MS = 30 * 60 * 1000`
- `SEARCH_CACHE_MAX_ITEMS = 120`

### 意義

- 同一個分頁工作階段內可重用
- 關掉 tab 後通常就消失
- 30 分鐘後視為過期

## `buildSearchCacheKey()`

快取 key 不是直接拿 query 物件序列化，而是把 query key 排序後組成穩定字串。

對陣列值會先排序再 join，避免：

- 同樣的 identity 條件，只因為順序不同就變成不同 cache key

## `readSearchCache()`

讀快取時會：

1. 先確認是 client 端
2. 用 `buildSearchCacheKey(query)` 找 `sessionStorage`
3. parse JSON
4. 檢查 `savedAt`
5. 超過 TTL 就刪掉並回傳 `null`

## `writeSearchCache()`

寫入快取時會把 payload 存成：

- `savedAt`
- `items`

而且 `items` 最多只存到 `SEARCH_CACHE_MAX_ITEMS`

### quota 處理

如果 `sessionStorage` 爆掉，會：

1. 判斷是不是 quota exceeded
2. 呼叫 `clearIfareSearchCache()`
3. 再嘗試寫一次

也就是說，這套策略不是 LRU，而是空間不夠時直接清掉整批 `ifare-search-cache:` 開頭的快取。

## `clearIfareSearchCache()`

這個 function 只會刪：

- prefix 為 `ifare-search-cache:` 的 key

不會把整個 `sessionStorage` 清空。

## 六、AI 摘要在結果頁的狀態銜接

結果頁不是自己生成摘要，而是把狀態交給 `IfareSummaryCard.vue`。

傳入的關鍵 props 有：

- `query="appliedSearchQuery"`
- `cases="storageiFarePolicyList"`
- `results-loading="isLoading"`
- `search-context="appliedSummarySearchContext"`
- `summary-trigger-key="summaryTriggerKey"`
- `summary-cache-key="routeSearchSignature"`
- `summary-reset-key="summaryResetKey"`

## `summaryTriggerKey`

這個 key 主要在 `applyPolicyList()` 時增加。

意義是：

- 每次結果清單真的被套用一批新資料
- 就通知摘要卡應該重新處理

## `summaryResetKey`

這個 key 主要在以下情境增加：

- `Search()`
- `ResetParam()`
- `RetryLoad()`

它偏向一種「先把摘要狀態重置掉」的訊號。

## `routeSearchSignature`

這個值是用 route query 排序後組出的穩定字串，會當成摘要快取 key 的一部分。

這樣即使同頁重新渲染，只要 route query 相同，摘要卡就能辨識是同一組搜尋條件。

## `appliedSummarySearchContext`

這層不是原始 code，而是把實際套用的查詢條件轉成可讀文字，內容目前包含：

- `policy`
- `recipient`
- `area`
- `income`
- `identity`
- `query`

這是摘要卡理解搜尋上下文的重要來源之一。

## 七、個人化查詢 profile 的角色

## 使用的 composable

- `useWelfareProfile.ts`

這份資料存在：

- `localStorage`

設定如下：

- storage key：`ifare:welfare-profile:v1`
- 有效期：`90` 天

## 存檔時機

當使用者在結果頁按 `Search()` 時，會把目前條件存進 `saveWelfareProfile()`。

儲存內容包含：

- `policy`
- `recipient`
- `area`
- `income`
- `identities`
- `query`
- `lifeEvent`

## 讀取時機

結果頁有第二個 `onMounted()`：

1. 如果 route query 已經有值，就不走 profile 回填
2. 如果 route query 是空的，才嘗試 `loadWelfareProfile()`
3. 如果 profile 存在，就把值回填到欄位
4. 再組成 query 丟進 `SetDataInit(query)`

### 這代表的優先序

目前優先序是：

1. route query
2. localStorage 的 welfare profile
3. 空白初始狀態

也就是說，網址條件永遠比個人化記憶優先。

## `ResetParam()` 和 profile 的關係

當使用者按清空時，除了清掉畫面欄位，也會：

- `clearWelfareProfile()`
- `syncRouteQueryFromSearch({})`
- `summaryResetKey.value += 1`
- `clearPendingSummaryScroll()`
- `lastQuery = {}`

所以清空不是只清畫面，而是把：

- 畫面
- route
- 個人化 profile
- 摘要狀態

一起重置。

## 八、搜尋後自動捲到摘要區的流程

這一段不是搜尋本體，但和搜尋狀態是綁在一起的。

## 狀態來源

目前用：

- `pendingScrollToSummary`
- `sessionStorage["ifare:scroll-to-summary"]`

去記錄搜尋後是否要捲動到摘要區。

## `markPendingSummaryScroll()`

在 `Search()` 和 `RetryLoad()` 時會先呼叫，代表這次查詢完成後，應該把畫面帶到摘要區。

## `handleSummaryComplete()`

當 `IfareSummaryCard` 發出 `summary-complete` 事件後，結果頁會：

1. 檢查 `pendingScrollToSummary`
2. `nextTick`
3. 連續兩次 `requestAnimationFrame`
4. `scrollToSummaryAnchor("smooth")`
5. 之後短時間內用 timer 持續做 `auto` 對位
6. 最後清掉 pending 狀態

### 為什麼要這麼麻煩

因為摘要卡高度不是一開始就固定，等摘要內容真正 render 出來後，畫面可能還會再往下撐開。

所以這裡有額外做：

- `summaryScrollLockTimer`
- `ResizeObserver`

來幫忙在摘要區高度變動時持續對位，避免使用者被捲到一半又跑掉。

## 九、route watcher 的核心地位

結果頁目前最關鍵的一段 watcher 是：

```ts
watch(
  () => $route.fullPath,
  () => {
    syncPendingSummaryScrollFromSession();
    hydrateFromRoute($route.query as Record<string, any>);
  },
  { immediate: true }
);
```

這段代表：

1. 初次進頁就會立即執行
2. 之後只要 route 改變，也會重跑
3. route 是整頁重新 hydrate 搜尋狀態的主入口

所以如果後續有人問：

- 「為什麼按搜尋不是直接打 API？」

答案是：

- 因為這頁是先同步 route，再由 route watcher 統一接手初始化。

## 十、常見維護情境

## 想新增一個搜尋條件

至少要一起看這幾個地方：

1. 表單欄位 state
2. `buildFarePolicyApiQuery()`
3. `buildQueryFromRoute()`
4. `syncRouteQueryFromSearch()`
5. `syncFilterStateFromRoute()`
6. `appliedSummarySearchContext`
7. `saveWelfareProfile()` / `loadWelfareProfile()` 的型別與使用

少改其中一段，就會出現：

- UI 有值但 route 沒帶
- route 有值但查詢沒送
- 搜尋有送但摘要上下文沒反映
- profile 有記住但重進頁沒還原

## 想確認 API 為什麼沒重打

優先排查：

1. 是不是命中 `sessionStorage` 搜尋快取
2. `nextQuery` 和 route query 是否其實完全一樣
3. route watcher 是否已經接手做 `SetDataInit()`

## 想確認摘要為什麼沒更新

優先排查：

1. `applyPolicyList()` 是否有被執行
2. `summaryTriggerKey` 是否有增加
3. `summaryResetKey` 是否有增加
4. `routeSearchSignature` 是否還是同一組
5. 摘要卡本身是否命中自己的 summary cache

## 想調整清空按鈕邏輯

不要只清畫面欄位。現況 `ResetParam()` 其實同時負責：

- 清 UI state
- 清 route
- 清個人化 profile
- 重置摘要
- 清 scroll pending

如果只改其中一半，行為會變得很不一致。

## 十一、已知限制

1. 搜尋狀態邏輯集中在單一 `result.vue`，檔案已經偏重。
2. route query、applied params、form state 是三層並存，理解成本高。
3. 搜尋快取目前採 sessionStorage，全清策略較粗。
4. 個人化 profile 和搜尋快取是兩套不同 storage，除錯時要分開看。
5. 結果頁直接負責很多摘要滾動細節，和搜尋流程耦合度偏高。

## 十二、建議後續重構方向

## 1. 抽出搜尋狀態 composable

目前 route sync、query build、hydrate、reset、profile 回填都寫在頁面內，之後若再加條件，維護成本會持續上升。

## 2. 把 route schema 明文化

目前 route query key 是散落在多個 function 裡手動映射，未來可以集中成一份 schema，減少漏改風險。

## 3. 搜尋快取與個人化 profile 的責任再拆清楚

現況兩套都合理，但因為一套在 sessionStorage、一套在 localStorage，建議後續如果再交接，可以加更明確的 debug log 或開發模式標記。

## 總結

這頁最重要的交接觀念可以縮成一句話：

「結果頁不是直接拿表單查 API，而是讓表單、route、已套用查詢、快取、摘要狀態一起協調，最後再決定畫面顯示什麼。」

只要先抓住這個結構，後面不管是補條件、查快取、修摘要重算，方向都會比較清楚。
