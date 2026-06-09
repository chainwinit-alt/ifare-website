# iFare 搜尋詞典初始化與維運流程

最後更新：2026-05-21

## 目的

這份文件整理 iFare 搜尋詞典、熱門關鍵字排行、外部趨勢匯入與 production 維運方式。

目前主要資料表：

- `search_term`
- `search_term_alias`
- `search_term_source`
- `search_term_stat_daily`
- `search_policy_term_candidate`
- `search_term_trend_daily`
- `search_query_log`

## 目前設計重點

- `search_term_stat_daily` 現在是熱門關鍵字的 daily history，不是單次 snapshot。
- `sp_rebuild_policy_term_hot_stat` 只重算指定日期區間，使用 upsert，不再每次清空整張表。
- `search_term_stat_daily` 會保留既有 `external_trend_score` 與 `trend_growth_score`。
- 前台 autocomplete / hot suggestions 主要依賴搜尋詞典與 `search_term_stat_daily` 這類彙總資料；但頁面上的 `keywordSuggestionList` 仍是前端規則組字提示，不是直接從這張表讀出。
- Google Trends `relatedQueries` 主要用於擴詞與 summary trend 匯入，不再強依賴 `pytrends`。

## 資料流

### A. 搜尋詞典

```text
IFarePolicy / Code* / Google related queries / 其他候選詞
-> search_policy_term_candidate
-> promote
-> search_term
-> search_term_alias / search_term_source
```

### B. 熱門排行

```text
search_query_log
+ search_term_trend_daily
+ search_term / search_policy_term_candidate
-> rebuild daily history
-> search_term_stat_daily
-> Hot Suggestions / Hot Keywords
```

## 核心表說明

### `search_term`

搜尋詞典主表。

用途：

- autocomplete
- suggestion
- hot keyword ranking 的 term 主體

### `search_term_alias`

同義詞、別名、常見變形。

用途：

- 讓不同 query 可 map 到同一個 term

### `search_term_source`

記錄詞從哪裡來，保留 traceability。

### `search_policy_term_candidate`

候選詞暫存表。

用途：

- 存政策內容抽出的候選詞
- 存 Google related queries 匯入結果
- 經過條件篩選後 promote 到 `search_term`

### `search_term_trend_daily`

外部趨勢表。

目前實務上以 summary snapshot 匯入為主，一次匯入視窗對每個詞保留一筆 trend 值，之後再同步到 `search_term_stat_daily` 對應日期。

### `search_term_stat_daily`

熱門關鍵字日統計表。

目前定義：

- 以 `term_id + stat_date` 保存 daily history
- 用來提供 7 天 / 30 天聚合排行
- 也是前台熱門推薦的主要 materialized ranking table

## 初始化順序

### Step 1. 建 schema 與 stored procedure

依序執行：

1. [scripts/ifare-search-hybrid-keyword-schema.sql](../scripts/ifare-search-hybrid-keyword-schema.sql)
2. [scripts/ifare-policy-content-term-pipeline.sql](../scripts/ifare-policy-content-term-pipeline.sql)

SSMS 範例：

```sql
USE [iFare];
GO

:r ..\scripts\ifare-search-hybrid-keyword-schema.sql
GO

:r ..\scripts\ifare-policy-content-term-pipeline.sql
GO
```

重點物件：

- `search_term_stat_daily`
- `sp_rebuild_search_term_stat_daily`
- `sp_rebuild_policy_term_hot_stat`

其中要特別區分：

- `sp_rebuild_search_term_stat_daily` 比較偏 schema / 基礎統計 rebuild，用來把 `search_query_log` 聚合成 daily stat。
- `sp_rebuild_policy_term_hot_stat` 才是目前詞典、候選詞、外部趨勢與熱門詞整合後的主要 hot stat 重算流程。

## 詞典與候選詞維運

### 2A. 匯入 candidate CSV

使用：

- [scripts/import-policy-term-candidates.py](../scripts/import-policy-term-candidates.py)

```powershell
python scripts\import-policy-term-candidates.py --replace-source-kind --min-score 5 --min-policy-count 2
```

若要直接 promote：

```powershell
python scripts\import-policy-term-candidates.py --replace-source-kind --replace-search-term --min-score 5 --min-policy-count 2 --promote --promote-min-quality-score 5 --promote-min-policy-count 2
```

### 2B. 匯入 Google related queries candidate

使用：

- [scripts/import-google-related-queries.py](../scripts/import-google-related-queries.py)

來源：

- `scripts/Google_Trend/relatedQueries*.csv`

```powershell
python scripts\import-google-related-queries.py --replace-source-kind
```

### 2C. 重建 search term table

使用：

- [scripts/rebuild-search-term-table.py](../scripts/rebuild-search-term-table.py)

```powershell
python scripts\rebuild-search-term-table.py --preview-csv scripts\search-term-preview.csv
python scripts\rebuild-search-term-table.py --apply
```

## 外部趨勢匯入

### Step 3. 匯入 Google Trends summary trend

使用：

- [scripts/import-google-related-queries-to-trend.py](../scripts/import-google-related-queries-to-trend.py)

```powershell
python scripts\import-google-related-queries-to-trend.py --replace-source-region-date
```

若只匯 raw trend，不同步到 stat table：

```powershell
python scripts\import-google-related-queries-to-trend.py --replace-source-region-date --skip-stat-sync
```

## 熱門排行重建

### 核心 procedure

熱門關鍵字排行由下列 SP 重建：

```sql
EXEC [dbo].[sp_rebuild_policy_term_hot_stat];
```

指定日期區間：

```sql
EXEC [dbo].[sp_rebuild_policy_term_hot_stat]
    @start_date = '2026-04-18',
    @end_date = '2026-05-18',
    @retention_days = 120;
```

### 重建邏輯

1. 掃描指定日期區間的 `search_query_log`
2. 依 `normalized_query` 對應 `search_term` / `search_term_alias`
3. 依 `term_id + stat_date` 計算 daily behavior
4. 保留既有 `external_trend_score` / `trend_growth_score`
5. 重算 `final_hot_score`
6. 清除 retention 之外的舊資料

### 目前權重公式

`trend_score`：

```text
trend_score =
    (search_count * 0.70) +
    (select_count * 0.20) +
    ((result_count - zero_result_count) * 0.10)
```

`final_hot_score`：

```text
final_hot_score =
    (trend_score * 0.70) +
    (external_trend_score * 0.10) +
    (positive_trend_growth_score * 0.05) +
    (content_freshness_score * 0.10) +
    (editorial_boost_score * 0.03) +
    (base_weight * 0.02)
```

註：

- `positive_trend_growth_score` 代表只有 `trend_growth_score > 0` 時才納入計分
- 現在排行已改為「搜尋行為主導，靜態內容分數輔助」

## Python 觸發器

使用：

- [scripts/run-search-hot-snapshot.py](../scripts/run-search-hot-snapshot.py)

```powershell
python scripts\run-search-hot-snapshot.py
```

指定 7 天視窗：

```powershell
python scripts\run-search-hot-snapshot.py --window-days 7
```

指定日期區間：

```powershell
python scripts\run-search-hot-snapshot.py --start-date 2026-05-01 --end-date 2026-05-18
```

## Production 維運建議

### 一次性初始化 / 回補

建議回補最近 120 天：

```sql
EXEC dbo.sp_rebuild_policy_term_hot_stat
    @start_date = '2026-01-21',
    @end_date = '2026-05-21',
    @retention_days = 120;
```

### 日常排程

每天排程跑一次即可：

```sql
EXEC dbo.sp_rebuild_policy_term_hot_stat;
```

建議離峰時段執行，例如凌晨 1:00。

### SQL Server Express

若 production 是 SQL Server Express，沒有 SQL Server Agent，建議：

- 用 Windows Task Scheduler
- 直接跑 `sqlcmd` 執行 SP
- 或以 Python 觸發器 [scripts/run-search-hot-snapshot.py](../scripts/run-search-hot-snapshot.py) 代跑

### 不建議

- 每次使用者搜尋後就即時重建整段熱門排行資料
- 把 Google `relatedQueries` 分數直接當作最終熱門分數
- 直接從 `search_query_log` 即時做前台熱門推薦

## 排行結果來源

前台熱門推薦主要參考：

- `final_hot_score`
- `external_trend_score`
- `trend_growth_score`
- `search_count`
- `select_count`
- `content_freshness_score`
- `manual_boost`
- `base_weight`

說明：

- `search_query_log` 只負責提供搜尋行為原始資料
- 熱門推薦不直接讀 log，而是先彙總進 `search_term_stat_daily` 的 daily history

## 常用查詢

### 看目前熱門排行

```sql
SELECT
    t.id,
    t.term,
    t.display_term,
    t.term_type,
    t.source_kind,
    s.stat_date,
    s.search_count,
    s.select_count,
    s.trend_score,
    s.external_trend_score,
    s.final_hot_score
FROM dbo.search_term_stat_daily s
INNER JOIN dbo.search_term t
    ON t.id = s.term_id
ORDER BY s.final_hot_score DESC, s.search_count DESC, t.term ASC;
```

### 看最新一天排行榜

```sql
WITH latest_date AS (
    SELECT MAX(stat_date) AS stat_date
    FROM dbo.search_term_stat_daily
)
SELECT TOP (50)
    s.stat_date,
    t.term,
    t.display_term,
    s.search_count,
    s.select_count,
    s.final_hot_score
FROM dbo.search_term_stat_daily s
INNER JOIN dbo.search_term t
    ON t.id = s.term_id
WHERE s.stat_date = (SELECT stat_date FROM latest_date)
ORDER BY s.final_hot_score DESC, s.search_count DESC, t.term ASC;
```

### 查特定 query 的 log

```sql
SELECT TOP (50)
    id,
    query_text,
    normalized_query,
    source_page,
    created_at
FROM dbo.search_query_log
WHERE query_text LIKE N'%關鍵字%'
   OR normalized_query LIKE N'%關鍵字%'
ORDER BY created_at DESC;
```

### 查特定 term

```sql
SELECT
    id,
    term,
    display_term,
    normalized_term,
    term_type,
    source_kind,
    status,
    base_weight,
    manual_boost
FROM dbo.search_term
WHERE normalized_term = N'關鍵字';
```

### 查特定 candidate

```sql
SELECT
    term,
    normalized_term,
    source_kind,
    evidence_field,
    quality_score,
    status
FROM dbo.search_policy_term_candidate
WHERE normalized_term = N'關鍵字'
ORDER BY quality_score DESC;
```
