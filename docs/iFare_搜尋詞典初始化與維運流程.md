# iFare 搜尋詞典初始化與維運流程

更新日期：2026-05-15

## 目的

這份文件說明當 `[iFare].[dbo]` 中還沒有搜尋詞典相關資料，或資料量很少時，要如何透過現有 SQL 建立：

- `search_term`
- `search_term_alias`
- `search_term_source`
- `search_term_stat_daily`
- `search_policy_term_candidate`
- `search_term_candidate`

同時整理目前四支 SQL 的用途，避免後續維運時重複執行或跑錯版本。

## SQL 檔案角色

### 正式保留

1. [`../scripts/ifare-search-hybrid-keyword-schema.sql`](../scripts/ifare-search-hybrid-keyword-schema.sql)
用途：
- 建立或補齊搜尋詞典相關資料表
- 補 `search_term_stat_daily` 的 hybrid score 欄位
- 建立 `sp_rebuild_search_term_stat_daily`
- 建立 `vw_search_term_hot_score_7d`

這支是 `schema / migration` 用。

2. [`../scripts/ifare-policy-content-term-pipeline.sql`](../scripts/ifare-policy-content-term-pipeline.sql)
用途：
- 從 `IFarePolicy + Code*` 建立內容導向候選詞
- 升級 candidate 到 `search_term`
- 用 `search_query_log` 回填熱門分數

這支是 `內容建詞 + 熱門統計` 用。

### 歷史保留，不建議當正式主流程

3. [`../scripts/search-query-log.sql`](../scripts/search-query-log.sql)
用途：
- 建立 `search_query_log`
- 建立 `search_query_log` 相關 index
- 內含舊版 aggregation 範例

這支在「全新資料庫且連搜尋事件表都不存在」時仍然有用，但只建議使用其中的 `search_query_log` 建表與 index 功能。

4. [`../scripts/search-term-seed.sql`](../scripts/search-term-seed.sql)
用途：
- 舊版 seed script
- 可當初始化參考，但與新 pipeline 重疊

## 適用情境

### 情境 A：全新資料庫，還沒有搜尋詞典表

這是最完整的初始化流程。

### 情境 B：搜尋詞典表已存在，但 `search_term` / `search_term_stat_daily` 幾乎沒資料

這時不用重建表，只要跑內容建詞與統計流程。

### 情境 C：搜尋詞典表已存在，但 `search_query_log` 還不存在

這時要先補 `search_query_log`，再決定是否回填熱門統計。

## 前置條件

在執行前，請先確認這些業務表已經有資料：

- `IFarePolicy`
- `CodeKeyword`
- `CodeRecipient`
- `CodeIdentity`
- `CodeIncome`
- `CodePolicy`
- 以及對應的 mapping table，例如 `IFarePolicy_CodeKeyword`

如果上面表本身沒有資料，內容建詞流程就不會產出有效詞典。

另外，若要算搜尋熱度，還需要：

- `search_query_log`

注意這裡分兩種情況：

1. `search_query_log` 表不存在
這時要先建立表。

2. `search_query_log` 表存在，但沒有資料
這時可以先完成內容詞典初始化，熱門分數之後再回填。

## 建議初始化順序

### Step 1：建立或補齊搜尋詞典 schema

執行：

```sql
USE [iFare];
GO

:r ..\scripts\ifare-search-hybrid-keyword-schema.sql
GO
```

如果你的工具不支援 `:r`，就直接開啟該 SQL 檔後整份執行。

執行完成後，至少應該存在：

- `search_term`
- `search_term_alias`
- `search_term_source`
- `search_term_stat_daily`
- `search_term_candidate`
- `vw_search_term_hot_score_7d`
- `sp_rebuild_search_term_stat_daily`

### Step 1.5：如果 `search_query_log` 不存在，先建立它

先檢查：

```sql
SELECT OBJECT_ID(N'[dbo].[search_query_log]', N'U') AS search_query_log_object_id;
```

如果結果是 `NULL`，代表表不存在。

這時請執行 [`../scripts/search-query-log.sql`](../scripts/search-query-log.sql)，但用途只限於：

- 建立 `search_query_log`
- 建立 `search_query_log` index

如果你是手動分段執行，建議只執行這份 SQL 前半段的：

- `CREATE TABLE [dbo].[search_query_log]`
- `CREATE INDEX IX_search_query_log_created_at`
- `CREATE INDEX IX_search_query_log_normalized_query`
- `CREATE INDEX IX_search_query_log_source_page_created_at`

不要把這支檔案後半段的舊版 aggregation 當成正式主流程反覆執行。

### Step 2：建立內容導向候選詞流程

執行：

```sql
USE [iFare];
GO

:r ..\scripts\ifare-policy-content-term-pipeline.sql
GO
```

執行完成後，至少應該存在：

- `search_policy_term_candidate`
- `sp_refresh_policy_term_candidate`
- `sp_promote_policy_term_candidate_to_search_term`
- `sp_rebuild_policy_term_hot_stat`

### Step 3：從政策與 code table 刷新候選詞

執行：

```sql
EXEC [dbo].[sp_refresh_policy_term_candidate];
```

這一步會從：

- `IFarePolicy.Title`
- `CodeKeyword`
- `CodeRecipient`
- `CodeIdentity`
- `CodeIncome`
- `CodePolicy`

建立 `search_policy_term_candidate`。

### Step 4：將候選詞升級為正式詞典

執行：

```sql
EXEC [dbo].[sp_promote_policy_term_candidate_to_search_term]
    @min_quality_score = 2.0,
    @min_policy_count = 1;
```

這一步會把符合條件的 candidate 寫入：

- `search_term`
- `search_term_source`

### Step 5：如果已有搜尋紀錄，回填熱門統計

若 `search_query_log` 已經有資料，執行：

```sql
EXEC [dbo].[sp_rebuild_policy_term_hot_stat]
    @start_date = '2026-04-01',
    @end_date = '2026-05-15';
```

日常維運時，改成你要重算的日期區間即可。

如果目前沒有任何搜尋紀錄，這一步可以先跳過。

## 全新資料庫的最小初始化順序

如果今天 `[iFare].[dbo]` 裡完全沒有搜尋相關表，建議順序如下：

1. 執行 [`../scripts/ifare-search-hybrid-keyword-schema.sql`](../scripts/ifare-search-hybrid-keyword-schema.sql)
2. 執行 [`../scripts/search-query-log.sql`](../scripts/search-query-log.sql) 的 `search_query_log` 建表與 index 段
3. 執行 [`../scripts/ifare-policy-content-term-pipeline.sql`](../scripts/ifare-policy-content-term-pipeline.sql)
4. 執行：

```sql
EXEC [dbo].[sp_refresh_policy_term_candidate];
EXEC [dbo].[sp_promote_policy_term_candidate_to_search_term]
    @min_quality_score = 2.0,
    @min_policy_count = 1;
```

5. 等 `search_query_log` 開始累積資料後，再執行：

```sql
EXEC [dbo].[sp_rebuild_policy_term_hot_stat]
    @start_date = DATEADD(DAY, -30, CAST(GETUTCDATE() AS DATE)),
    @end_date = CAST(GETUTCDATE() AS DATE);
```

## 初始化完成後的驗證查詢

### 1. 驗證候選詞有沒有產生

```sql
SELECT TOP (50)
    term,
    normalized_term,
    term_type,
    source_kind,
    policy_count,
    content_score,
    quality_score,
    status
FROM [dbo].[search_policy_term_candidate]
ORDER BY quality_score DESC, policy_count DESC, term ASC;
```

### 2. 驗證正式詞典有沒有資料

```sql
SELECT TOP (50)
    id,
    term,
    normalized_term,
    term_type,
    source_kind,
    base_weight,
    manual_boost,
    status,
    updated_at
FROM [dbo].[search_term]
ORDER BY updated_at DESC, id DESC;
```

### 3. 驗證熱門統計有沒有資料

```sql
SELECT TOP (50)
    t.term,
    t.term_type,
    t.source_kind,
    s.stat_date,
    s.search_count,
    s.select_count,
    s.result_count,
    s.zero_result_count,
    s.trend_score,
    s.content_match_count,
    s.final_hot_score
FROM [dbo].[search_term_stat_daily] s
INNER JOIN [dbo].[search_term] t
    ON t.id = s.term_id
ORDER BY s.final_hot_score DESC, s.search_count DESC;
```

## 沒有 `search_query_log` 資料時的預期

如果資料庫中還沒有使用者搜尋紀錄，初始化後你應該看到：

- `search_policy_term_candidate` 有資料
- `search_term` 有資料
- `search_term_source` 有資料
- `search_query_log` 表存在，但可能是空的
- `search_term_stat_daily` 可能沒有資料，或只有很少資料

這是正常的。

因為：

- `search_term` 是內容詞典
- `search_term_stat_daily` 是行為熱度統計

沒有搜尋行為，就不會有真實熱門度。

## 日常維運建議

### 每次政策內容大量更新後

執行：

```sql
EXEC [dbo].[sp_refresh_policy_term_candidate];
EXEC [dbo].[sp_promote_policy_term_candidate_to_search_term]
    @min_quality_score = 2.0,
    @min_policy_count = 1;
```

### 每天或每週重算熱門分數

執行：

```sql
EXEC [dbo].[sp_rebuild_policy_term_hot_stat]
    @start_date = DATEADD(DAY, -30, CAST(GETUTCDATE() AS DATE)),
    @end_date = CAST(GETUTCDATE() AS DATE);
```

如果 SQL Server Agent 有排程，建議把這支 proc 納入排程。

## 不建議的做法

- 不要把 `search-term-seed.sql` 當日常主流程反覆執行
- 不要把 `search-query-log.sql` 的 aggregation 段和新 proc 混著跑
- 不要同時維護兩套不同的 `search_term_stat_daily` 計算方式

## 建議最終主流程

後續維運只要記住這三段：

1. `schema migration`
執行 [`../scripts/ifare-search-hybrid-keyword-schema.sql`](../scripts/ifare-search-hybrid-keyword-schema.sql)

2. `search event log bootstrap`
只在 `search_query_log` 不存在時執行 [`../scripts/search-query-log.sql`](../scripts/search-query-log.sql) 的建表與 index 段

3. `content dictionary refresh`

```sql
EXEC [dbo].[sp_refresh_policy_term_candidate];
EXEC [dbo].[sp_promote_policy_term_candidate_to_search_term]
    @min_quality_score = 2.0,
    @min_policy_count = 1;
```

4. `behavior hot stat refresh`

```sql
EXEC [dbo].[sp_rebuild_policy_term_hot_stat]
    @start_date = DATEADD(DAY, -30, CAST(GETUTCDATE() AS DATE)),
    @end_date = CAST(GETUTCDATE() AS DATE);
```

這樣即可完成：

- 詞典結構建立
- 內容導向候選詞建立
- 正式詞典更新
- 熱門分數更新
