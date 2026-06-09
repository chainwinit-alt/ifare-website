# iFare 熱門搜尋字管理


## 文件目的

這份文件主要交接首頁「熱門搜尋」和「最近搜尋」這兩塊功能，因為它們在畫面上都長得像 chip，很容易被誤認成同一套資料來源，但實際上不是：

- 熱門搜尋：前端寫死的預設關鍵字
- 最近搜尋：使用者自己的搜尋歷史，存在瀏覽器 localStorage

如果接手的人一開始沒有把這兩塊分清楚，後續要改功能時很容易改錯地方。

## 相關檔案

### 首頁查詢頁

- `Dev/Dev Code/iFare_Frontend/pages/ifare.vue`

### 最近搜尋 composable

- `Dev/Dev Code/iFare_Frontend/composables/useRecentSearches.ts`

### Vincent 在 `Add-summary-Feat` 直接碰到的相鄰檔案

- `Dev/Dev Code/iFare_Frontend/components/IfareSearchAutocomplete.vue`
- `Dev/Dev Code/iFare_Frontend/pages/ifare/result.vue`

## 功能定位

首頁搜尋區目前有三種不同來源的搜尋輔助資訊：

1. 使用者自己選的條件與輸入的關鍵字
2. 系統預設的熱門搜尋
3. 使用者歷史搜尋產生的最近搜尋

其中這份文件主要談第 2 和第 3 點。

## 第一部分：熱門搜尋

## 熱門搜尋目前不是後台管理

現況最重要的一件事是：

熱門搜尋目前不是由後台維護，也不是從 API 回來，而是直接寫在前台首頁 `ifare.vue` 的 `HOT_KEYWORDS` 常數裡。

這代表這段行為雖然會和 Vincent 做的搜尋建議 UI 並排出現在首頁，但資料來源本身不是 Vincent 在 `Add-summary-Feat` 建起來的。

這代表：

1. 改熱門詞不需要動後端
2. 改熱門詞也不需要改資料庫
3. 只要發前台就會生效
4. 但同時也代表營運端不能自行調整

## 目前的熱門搜尋字

已確認目前 `HOT_KEYWORDS` 內容如下：

1. `育兒津貼`
2. `老人福利`
3. `身心障礙`
4. `低收入戶`
5. `租屋補助`
6. `托育補助`
7. `醫療補助`
8. `就業協助`

這些字會直接 render 成首頁的熱門搜尋 chip。

## 畫面上的接法

首頁目前是用：

```vue
<li v-for="kw in HOT_KEYWORDS" :key="kw">
```

把這些字串一個一個轉成按鈕。

每顆熱門搜尋 chip 目前也有綁：

```vue
:data-mascot-tip="`點這個會直接搜尋熱門關鍵字「${kw}」。`"
```

所以使用者 hover 上去時，IP 也會說明這顆熱門字會做什麼。

## 點熱門搜尋後的實際流程

點熱門搜尋時，首頁會呼叫：

```ts
applyHotKeyword(keyword)
```

這個 function 目前做兩件事，而且順序要一起理解：

1. 導向結果頁
2. 寫入最近搜尋

程式目前是：

```ts
$router.push({
  path: '/ifare/result',
  query: { query: keyword }
});

recentSearches.add({
  label: `「${keyword}」`,
  query: { query: keyword }
});
```

也就是說，熱門搜尋本質上不是一個複合條件，只是幫使用者直接用單一關鍵字跳去結果頁。

## 熱門搜尋不會幫你補其他篩選條件

這點很重要。

目前熱門搜尋只會帶：

```ts
{ query: keyword }
```

不會同時帶入：

- 受助情況
- 年齡區間
- 戶籍地
- 所得分類
- 身分別
- 人生事件

所以如果後續有人覺得「熱門搜尋應該一點下去就直接套某一組精準條件」，那已經不是現在這個功能，要另做規格。

## 維護熱門搜尋時通常改哪裡

如果只是：

- 改熱門字內容
- 增減熱門字數量
- 調整文案

通常只要改 `ifare.vue` 裡的：

- `HOT_KEYWORDS`
- 熱門搜尋區塊 template
- `data-mascot-tip` 提示文案

如果要改成後台維護，才需要往 API / CMS 方向擴。

## 第二部分：最近搜尋

## 最近搜尋和熱門搜尋是不同來源

熱門搜尋是固定配置，所有使用者都一樣。

最近搜尋則是每個使用者自己的紀錄，存在該使用者瀏覽器的 `localStorage`。

這塊實作由 `useRecentSearches.ts` 承接；如果這份文件是拿來判斷 Vincent 在 `Add-summary-Feat` 的工作邊界，最近搜尋應標成「既有功能，Vincent 只是在相鄰搜尋流程中沿用」。

因此最近搜尋有幾個特性：

1. 換瀏覽器就沒了
2. 換裝置就不共用
3. 清 localStorage 就沒了
4. 不需要登入也能記

## `useRecentSearches.ts` 的職責

最近搜尋邏輯集中在：

- `useRecentSearches.ts`

這個 composable 負責：

1. 定義最近搜尋資料格式
2. 從 localStorage 載入資料
3. 新增資料
4. 刪除單筆
5. 清空全部
6. 控制最多只留幾筆

## 最近搜尋的資料格式

`RecentSearch` 目前至少包含：

- `label`
- `query`
- `timestamp`

其中 `query` 本身可包含的欄位目前已確認有：

- `policy`
- `recipient`
- `area`
- `query`
- `event`

另外介面裡也有 `labels` 可選欄位，但目前首頁主要使用的是 `label` 作為 chip 顯示文字。

## localStorage 設定

目前設定如下：

- storage key：`ifare:recent-searches:v1`
- 最多保留：`5` 筆

也就是說，這套最近搜尋是有版本號的。如果未來資料格式大改，可以考慮升版 storage key，避免舊資料結構污染新邏輯。

## 首頁怎麼初始化最近搜尋

在 `ifare.vue` 內，目前是：

```ts
const recentSearches = useRecentSearches();
onMounted(() => recentSearches.load());
```

這代表最近搜尋不是 SSR 先帶進來，而是頁面 mounted 後再從使用者本地瀏覽器讀。

所以如果在 server 端看不到最近搜尋，是正常的。

## 一般搜尋怎麼寫入最近搜尋

首頁使用者不是只有點熱門搜尋才會寫入最近搜尋。一般自己選條件後送出搜尋時，也會寫入最近搜尋。

這時候不是固定 `「關鍵字」`，而是會先跑：

```ts
buildRecentSearchLabel()
```

去組出比較像人能看懂的 label。

## `buildRecentSearchLabel()` 的角色

這個 function 的用途，是把目前使用者的搜尋條件整理成一段簡潔 label，方便之後顯示在「最近搜尋」chip 上。

根據目前程式行為，這類 label 可能會由下列資訊組成：

- 人生事件
- 受助情況
- 年齡區間
- 戶籍地
- 關鍵字

因此最近搜尋和熱門搜尋最大的差異之一就是：

- 熱門搜尋 label：固定只是一個熱門詞
- 最近搜尋 label：會反映使用者當時的整體查詢條件

## 熱門搜尋如何寫進最近搜尋

當使用者點熱門搜尋時，也會走：

```ts
recentSearches.add({
  label: `「${keyword}」`,
  query: { query: keyword }
});
```

所以熱門搜尋其實也會「轉化成一筆最近搜尋」，只是這筆最近搜尋的 query 結構相對單純。

## 去重邏輯

最近搜尋目前不是單純一直 append。`useRecentSearches.ts` 會拿 `query` 做：

```ts
JSON.stringify(a.query)
JSON.stringify(b.query)
```

來判斷是不是同一筆搜尋。

這代表它的「重複判定」是看整個 query 物件內容是否完全一致。

實際效果是：

1. 如果同一組搜尋條件再次被加入
2. 舊資料會先被拿掉
3. 最新這次會放到最前面

所以列表會保留「最近使用順序」，而不是保留完全重複的多份紀錄。

## 刪除與清空

`useRecentSearches.ts` 目前提供：

- `remove(index)`
- `clear()`

首頁 template 已經接上：

- 單筆刪除按鈕
- 清空最近搜尋按鈕

而且這些按鈕也都有 `data-mascot-tip`，所以 IP 會同步說明：

- 這會移除哪一筆最近搜尋
- 這會清掉全部最近搜尋

## 點最近搜尋後的流程

首頁目前有：

```ts
function applyRecentSearch(item) {
  $router.push({ path: '/ifare/result', query: item.query });
}
```

也就是說，最近搜尋的作用是把使用者之前那組 query 直接重新套回結果頁，而不是重新拆成首頁表單再回填。

這點很重要，因為它代表目前設計是「快速重查」，不是「回首頁編輯舊搜尋」。

## 熱門搜尋與最近搜尋的關係

可以把目前設計理解成：

1. 熱門搜尋是系統給的捷徑
2. 最近搜尋是使用者自己累積出的捷徑
3. 熱門搜尋被點擊後，也會順便沉澱成最近搜尋的一筆

所以熱門搜尋和最近搜尋不是互斥，而是前者有機會進入後者。

## 常見維護情境

### 想改熱門搜尋字

改 `ifare.vue` 的 `HOT_KEYWORDS`。

### 想調整熱門搜尋點下去的行為

改 `applyHotKeyword()`。

### 想調整最近搜尋最多顯示幾筆

改 `useRecentSearches.ts` 的 `MAX_ITEMS`。

### 想調整最近搜尋資料格式

改：

1. `RecentSearch` interface
2. `load()`
3. `add()`
4. 可能要一起升 `STORAGE_KEY` 版本

### 想讓最近搜尋跨裝置同步

這已經不是 localStorage 能解決的範圍，需要改成後端儲存。

## 已知限制

1. 熱門搜尋目前完全是前端寫死，營運端無法自行調整。
2. 最近搜尋只存在本地瀏覽器，不跨帳號、不跨裝置。
3. 最近搜尋的重複判定依賴 `JSON.stringify(query)`，如果未來 query 結構順序或格式改變，要注意相容性。
4. 熱門搜尋目前只支援單一關鍵字跳轉，不支援複合條件模板。

## 建議後續重構方向

### 1. 熱門搜尋改成可配置資料源

如果未來要給 PM / 營運可調，建議把 `HOT_KEYWORDS` 改成 API 或 CMS 設定，前台只保留 fallback。

### 2. 最近搜尋資料結構再標準化

如果未來 query 條件會越來越多，建議把最近搜尋的 `query` 型別收斂成更明確的 schema，減少前後頁判讀差異。

### 3. 如果要做真正的搜尋推薦，熱門搜尋與最近搜尋要拆責任

目前這兩個都還是「捷徑型入口」。如果未來要做個人化推薦，不應直接把熱門搜尋和最近搜尋硬湊成同一個功能。

## 總結

這份功能最重要的交接觀念是：

「熱門搜尋是系統預設字，最近搜尋是使用者本地歷史，而熱門搜尋點下去後也會寫進最近搜尋。」

先抓住這個關係，後續不管是要改畫面、改資料流、還是往後台管理擴，都比較不會走錯方向。
