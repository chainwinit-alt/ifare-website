# iFare 模糊搜尋與查詢門檻交接


## 文件目的

這份文件是交接 iFare 搜尋的「模糊比對」與「查詢門檻 UX」。

前者是讓使用者輸入不完全精準時，仍有機會命中福利資料；後者是避免首頁 / 結果頁在條件不足時就送出無效搜尋。

## 主要檔案

### 前端

- `Dev/Dev Code/iFare_Frontend/pages/ifare.vue`
- `Dev/Dev Code/iFare_Frontend/pages/ifare/result.vue`

### 前端 API / domain

- `Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Application/Fare/Policy/Dto/FarePolicyFilterParamDto.cs`
- `Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Core/TaskManager/Fare/Policy/ValueModel/FarePolicyFilterParam.cs`
- `Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Core/TaskManager/Fare/Policy/Common/FilterParamChecker.cs`
- `Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Core/TaskManager/Common/TraditionalChineseFuzzyMatcher.cs`
- `Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Core/TaskManager/Fare/Policy/FarePolicyTaskManager.cs`

## 第一部分：查詢門檻 UX

## 功能定位

首頁與結果頁目前都不是「完全空條件也可以直接搜」。畫面上有一個 `canSearch` 判斷，用來限制：

1. 沒選條件也沒輸入關鍵字時，不送出搜尋
2. 按鈕 disabled
3. 顯示對應提示文案

這塊是為了降低空查詢、誤觸查詢，以及看起來像壞掉的體驗。

## 首頁

首頁在 `pages/ifare.vue` 內用 `canSearch` 控制搜尋按鈕是否可按，也會在使用者點過搜尋但條件不足時顯示提示。

接手時如果想放寬查詢條件，優先看：

1. `canSearch`
2. 送出搜尋前的 guard
3. 提示訊息是否也要同步改

## 結果頁

結果頁 `pages/ifare/result.vue` 也有自己的 `canSearch` 判斷。這代表重新搜尋時，同樣不會允許完全空條件直接送。

這塊和結果頁 route sync 是連動的，所以不要只改 template 的 `disabled`，要一起看 `Search()` 內的 early return。

## 第二部分：模糊搜尋

## 功能定位

模糊搜尋的目標不是做語意向量搜尋，而是在既有福利資料上，提升使用者輸入「近似詞、片段詞、常見寫法」時的命中機率。

目前實作核心在：

- `TraditionalChineseFuzzyMatcher.cs`
- `FarePolicyTaskManager.cs`

## `TraditionalChineseFuzzyMatcher.cs`

這個類別負責提供模糊比對基礎工具，至少包含：

1. `Normalize`
2. `TokenizeForBm25`
3. `BuildTermFrequencyMap`
4. `BuildDocumentFrequencyMap`
5. `BuildQueryTokenWeights`
6. `ComputeBm25Score`
7. `Score`

所以它不是單一一個 `Contains` 包裝，而是一組查詢正規化與加權比對工具。

## `FarePolicyTaskManager.cs`

目前 task manager 會把使用者 query 正規化，並把政策資料多個欄位一起納入比對，例如：

1. title
2. qualification
3. keyword list
4. policy label
5. domicile label
6. recipient list
7. identity list
8. income list

也就是說，模糊搜尋不是只比標題，而是跨多欄位綜合算分。

## 實作特性

目前從程式可看出的方向包含：

1. 先做正規化
2. 對 query 與資料欄位做 token 化
3. 使用 BM25 相關分數輔助排序
4. 另外保留直接字串命中的分數補強

這表示它是「規則加權排序」，不是外部搜尋引擎。

## 維護時要注意

1. 前端是否允許送出查詢，和後端 fuzzy match 是兩條線，不要混成同一件事。
2. 如果有人回報「輸入某詞搜不到」，要分開看：
   - 前端是否根本沒送出查詢
   - 後端是否有進 fuzzy 流程
   - 排序後是否被其他結果壓掉
3. 如果要再加比對欄位，優先從 `FarePolicyTaskManager.cs` 下手。

## 和其他 handover 的關係

這份文件和下面幾份 handover 相鄰，但不是同一題：

1. `iFare_關鍵字推薦補齊與AI摘要.md`
2. `iFare_結果頁搜尋狀態與快取流程.md`
3. `iFare_搜尋詞典初始化與維運流程.md`

差別是：

- 關鍵字推薦：前端提示你可以搜什麼
- 模糊搜尋：你真的送出 query 後，後端怎麼幫你更容易命中
- AI 摘要：查到結果之後再做整理

## 一句話總結

Vincent 在這條線做的不是單純 UI 微調，而是把「能不能搜」和「搜了之後怎麼更容易命中」兩件事一起補強。
