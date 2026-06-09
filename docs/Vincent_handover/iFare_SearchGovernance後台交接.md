# iFare SearchGovernance 後台交接


## 文件目的

這份文件主要交接搜尋治理後台 `SearchGovernance` 模組，讓接手的人知道：

1. 後台入口在哪裡
2. 前後端 API 怎麼接
3. 目前能做哪些治理操作
4. 哪些動作其實會影響搜尋詞典與熱門詞統計

## 主要檔案

### 後台前端

- `Dev/Dev Code/iFare_Backend/src/router/index.ts`
- `Dev/Dev Code/iFare_Backend/src/data/AsideMenu.json`
- `Dev/Dev Code/iFare_Backend/src/data/SearchGovernance.ts`
- `Dev/Dev Code/iFare_Backend/src/plugins/WebAPI.ts`
- `Dev/Dev Code/iFare_Backend/src/views/SearchGovernance/SearchGovernance_IndexView.vue`
- `Dev/Dev Code/iFare_Backend/src/views/SearchGovernance/SearchGovernance_DashboardView.vue`
- `Dev/Dev Code/iFare_Backend/src/views/SearchGovernance/SearchGovernance_TermListView.vue`
- `Dev/Dev Code/iFare_Backend/src/views/SearchGovernance/SearchGovernance_AliasListView.vue`

### 後端 API

- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Application/SearchGovernance/ISearchGovernanceAppService.cs`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Application/SearchGovernance/SearchGovernanceAppService.cs`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Application/SearchGovernance/Dto/SearchGovernanceDto.cs`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Core/TaskManager/SearchGovernance/ISearchGovernanceTaskManager.cs`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Core/TaskManager/SearchGovernance/SearchGovernanceTaskManager.cs`
- `Dev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Core/TaskManager/SearchGovernance/ValueModel/SearchGovernanceResult.cs`

## 功能定位

`SearchGovernance` 不是一般內容後台頁，而是搜尋治理面板。它的責任比較接近：

1. 看搜尋詞目前長什麼樣
2. 看 alias 對照是否合理
3. 看熱門詞統計是否有刷新
4. 手動觸發同步或重算

也就是說，這塊是把 Vincent 在前台搜尋建議、熱門詞統計、搜尋詞典 schema 做的事，往後台治理端延伸。

## 路由與選單

後台路由掛在 `SearchGovernance` 底下，包含三個主要頁面：

1. `SearchGovernance_Dashboard`
2. `SearchGovernance_Terms`
3. `SearchGovernance_Aliases`

選單則在 `AsideMenu.json` 裡註冊，權限目前配置給 `Editor`。

## 前端 WebAPI 封裝

後台前端透過 `src/plugins/WebAPI.ts` 呼叫 API，已封裝的方法包含：

1. `GetSearchGovernanceDashboard`
2. `GetSearchGovernanceTerms`
3. `GetSearchGovernanceAliases`
4. `CreateSearchGovernanceTerm`
5. `UpdateSearchGovernanceTerm`
6. `CreateSearchGovernanceAlias`
7. `UpdateSearchGovernanceAlias`
8. `RefreshSearchGovernanceHotStats`
9. `SyncSearchGovernanceTerms`

接手時如果要加新按鈕，通常要一起改：

1. view
2. `WebAPI.ts`
3. 後端 app service / task manager

## 三個主要頁面分工

### Dashboard

`SearchGovernance_DashboardView.vue` 主要看總覽資料，包含：

1. overview stats
2. trend points
3. queue items
4. top terms

這頁也有兩個重要操作：

1. `RefreshHotStats`
2. `SyncTerms`

前者比較偏重算熱門詞統計，後者偏把候選詞 / 詞典資料同步到正式表。

### Terms

`SearchGovernance_TermListView.vue` 主要管理正式搜尋詞：

1. 讀列表
2. 建立 term
3. 更新 term
4. 從 term 跳去看 alias

如果前台搜尋建議或熱門詞排名怪怪的，這頁通常是第一個檢查點。

### Aliases

`SearchGovernance_AliasListView.vue` 主要管理 alias 對照：

1. 讀 alias 列表
2. 建立 alias
3. 更新 alias
4. 看 alias 對應哪個 term

這塊和搜尋命中品質直接相關，尤其是使用者常用詞和正式詞不一致時。

## 後端責任

後端 app service 主要做 DTO 對外暴露與資料 mapping；真正邏輯重心在 `SearchGovernanceTaskManager.cs`。

目前至少包含這幾類責任：

1. 撈 dashboard 聚合資料
2. 撈 terms / aliases 列表
3. create / update term
4. create / update alias
5. refresh hot stats
6. sync terms

所以接手這塊時，不要只改前台 view；很多規則其實都在 task manager。

## 和搜尋詞典 / 熱門詞的關係

這個模組不是獨立存在，它跟下面幾塊是一條線：

1. `search_term`
2. `search_term_alias`
3. `search_policy_term_candidate`
4. `search_term_stat_daily`
5. `sp_rebuild_policy_term_hot_stat`

也就是說：

- 前台看到的搜尋建議
- 熱門詞快照
- 後台治理資料

本質上共用同一套詞典治理基礎。

## 目前要注意的邊界

1. 這份模組是 Vincent 在 `Add-summary-Feat` 內實際完成的重要交付，原 handover 漏掉了。
2. 它不是純 UI 頁面，很多按鈕都會打到真正會改資料或重算統計的 API。
3. 如果未來要補權限、審批、操作紀錄，這塊會是第一個要加治理規則的地方。

## 一句話總結

`SearchGovernance` 是 Vincent 在 `Add-summary-Feat` 補上的搜尋治理後台，負責把搜尋詞、alias、熱門詞統計這條鏈條公開成可操作的後台能力。
