# iFare 搜尋詞典初始化與維運流程

更新日期：2026-05-18

## 目的

這份文件記錄目前 iFare 搜尋詞典的實際維運方式，包含：

- 正式搜尋詞典 `search_term`
- 別名詞典 `search_term_alias`
- 詞來源追蹤 `search_term_source`
- 熱度快照表 `search_term_stat_daily`
- 候選詞池 `search_policy_term_candidate`
- 外部趨勢原始表 `search_term_trend_daily`

目前流程已經和早期版本不同，重點變更如下：

- `search_term_stat_daily` 不再當作長期 daily history
- `search_term_stat_daily` 現在視為「當前熱門快照表」
- 每次重建 hot snapshot 時，會先清空 `search_term_stat_daily` 再重算
- Google Trends `relatedQueries` 主要用於擴詞 / trend snapshot，不再強依賴 `pytrends`

## 表用途

### `search_term`

正式搜尋詞典主表。

用途：

- autocomplete 正式詞
- suggestion 正式詞
- hot keyword 對應 term 主檔

### `search_term_alias`

正式詞的別名 / 同義詞表。

用途：

- 將民眾常用說法映射回正式詞
- 提高搜尋召回率

### `search_term_source`

正式詞來源追蹤表。

用途：

- 記錄一個正式詞來自哪個來源
- 保留 traceability

### `search_policy_term_candidate`

政策 / 補助領域候選詞池。

用途：

- 存放內容抽詞候選
- 存放 Google related query 候選
- 後續人工審核或 promote 到 `search_term`

### `search_term_trend_daily`

外部趨勢原始表。

目前可做兩種用途：

- 傳統 daily timeline 原始資料
- summary snapshot 類型資料

目前實務上以「summary snapshot」為主，也就是一個詞只保留當次匯入的一筆 trend 值。

### `search_term_stat_daily`

目前定義為「熱門關鍵字快照表」。

雖然表名還叫 `daily`，但目前不再保留長期每日歷史，而是每次重建時：

1. 清空整張表
2. 依據最新視窗資料重算
3. 每個 `term_id` 只保留一筆最新快照

用途：

- 空白熱門關鍵字推薦
- hot suggestions 排序
- 搜尋字典熱門度 materialized ranking table

## 目前推薦資料流

### A. 正式詞典

```text
IFarePolicy / Code* / 人工匯入 / Google 擴詞
-> search_policy_term_candidate
-> promote
-> search_term
-> search_term_alias / search_term_source
```

### B. 熱門快照

```text
search_query_log
+ search_term_trend_daily
+ search_term / search_policy_term_candidate
-> rebuild snapshot
-> search_term_stat_daily
-> Hot Suggestions / Hot Keywords
```

## 初始化 / 更新流程

### Step 1. 更新 schema 與 stored procedure

先套用這兩支 SQL：

1. [scripts/ifare-search-hybrid-keyword-schema.sql](../scripts/ifare-search-hybrid-keyword-schema.sql)
2. [scripts/ifare-policy-content-term-pipeline.sql](../scripts/ifare-policy-content-term-pipeline.sql)

建議執行：

```sql
USE [iFare];
GO

:r ..\scripts\ifare-search-hybrid-keyword-schema.sql
GO

:r ..\scripts\ifare-policy-content-term-pipeline.sql
GO
```

這兩支會更新：

- `search_term_stat_daily` schema
- `sp_rebuild_search_term_stat_daily`
- `sp_rebuild_policy_term_hot_stat`
- `vw_search_term_hot_score_7d`

目前這些流程都已改為 snapshot 模式。

### Step 2. 匯入正式詞 / 候選詞

依需求執行以下任一流程。

#### 2A. 從內candidate容抽詞 CSV 匯入 

使用：

- [scripts/import-policy-term-candidates.py](../scripts/import-policy-term-candidates.py)

示例：

```powershell
python scripts\import-policy-term-candidates.py --replace-source-kind --min-score 5 --min-policy-count 2
```

若要一起清掉舊的同來源正式詞並 promote：

```powershell
python scripts\import-policy-term-candidates.py --replace-source-kind --replace-search-term --min-score 5 --min-policy-count 2 --promote --promote-min-quality-score 5 --promote-min-policy-count 2
```

#### 2B. 從 Google related queries 匯入 candidate

使用：

- [scripts/import-google-related-queries.py](../scripts/import-google-related-queries.py)

它會掃：

- `scripts/Google_Trend/relatedQueries*.csv`

示例：

```powershell
python scripts\import-google-related-queries.py --replace-source-kind
```

用途：

- 將 `TOP` / `RISING` 匯入 `search_policy_term_candidate`
- 後續人工審核或 promote

#### 2C. 從可信來源重建正式詞典

使用：

- [scripts/rebuild-search-term-table.py](../scripts/rebuild-search-term-table.py)

示例：

```powershell
python scripts\rebuild-search-term-table.py --preview-csv scripts\search-term-preview.csv
python scripts\rebuild-search-term-table.py --apply
```

### Step 3. 匯入外部趨勢 snapshot

目前不建議直接用 `pytrends` 批次抓全量詞。

推薦做法是使用 Google Trends 網頁匯出的 `relatedQueries*.csv`，再匯入成 summary trend snapshot。

使用：

- [scripts/import-google-related-queries-to-trend.py](../scripts/import-google-related-queries-to-trend.py)

示例：

```powershell
python scripts\import-google-related-queries-to-trend.py --replace-source-region-date
```

這支會：

- 掃 `scripts/Google_Trend/relatedQueries*.csv`
- 每個 query 只寫一筆到 `search_term_trend_daily`
- 不展開時間序列

如果只想寫 raw trend table，不同步 stat：

```powershell
python scripts\import-google-related-queries-to-trend.py --replace-source-region-date --skip-stat-sync
```

## Hot Snapshot 重建

### 目前正式做法

目前熱門快照表以 `search_term_stat_daily` 為唯一前台熱門來源。

每次重建時：

1. 清空 `search_term_stat_daily`
2. 聚合最近一段時間的 `search_query_log`
3. 補入內容分數與外部 trend 分數
4. 每個 `term_id` 只寫一筆

### 手動執行方式

#### SQL 版

使用：

- [scripts/rebuild-search-term-hot-snapshot.sql](../scripts/rebuild-search-term-hot-snapshot.sql)

```sql
:r ..\scripts\rebuild-search-term-hot-snapshot.sql
GO
```

#### Python 觸發版

使用：

- [scripts/run-search-hot-snapshot.py](../scripts/run-search-hot-snapshot.py)

```powershell
python scripts\run-search-hot-snapshot.py
```

如果要改視窗：

```powershell
python scripts\run-search-hot-snapshot.py --window-days 7
```

或指定日期：

```powershell
python scripts\run-search-hot-snapshot.py --start-date 2026-05-01 --end-date 2026-05-18
```

### 目前重建入口

目前建議以這支 stored procedure 當主要 rebuild 入口：

```sql
EXEC [dbo].[sp_rebuild_policy_term_hot_stat]
    @start_date = '2026-04-18',
    @end_date = '2026-05-18';
```

## 空白熱門關鍵字推薦

目前空白狀態下的熱門關鍵字推薦來自：

- `search_term`
- `search_term_stat_daily`

後端讀取位置：

- `FarePolicyTaskManager.GetDictionaryHotKeywords(...)`

排序邏輯目前已整合：

- `final_hot_score`
- `external_trend_score`
- `search_count`
- `manual_boost`
- `base_weight`
- `source_kind` 權重

其中：

- `search_query_log` 會間接影響 hot keyword
- 它不是直接被前台讀取
- 而是先彙總進 `search_term_stat_daily`

## 維運建議

### 建議固定節奏

1. 搜尋事件持續寫入 `search_query_log`
2. 候選詞 / Google related queries 視需要匯入
3. 手動或定時執行 hot snapshot rebuild
4. 前台熱門推薦只讀 `search_term_stat_daily`

### SQL Server Express 環境

若環境是 SQL Server Express，沒有 SQL Server Agent，可使用：

- 手動執行 Python：
  [scripts/run-search-hot-snapshot.py](../scripts/run-search-hot-snapshot.py)
- 或 Windows Task Scheduler + Python / sqlcmd

### 不建議的做法

- 每次使用者搜尋後就即時重建整張 hot snapshot
- 直接把 Google `relatedQueries` 的分數當作全域最終熱門分數
- 讓前台直接讀 `search_query_log`

## 常用檢查 SQL

### 看目前 hot snapshot

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

### 看某個 query 有沒有進 log

```sql
SELECT TOP (50)
    id,
    query,
    normalized_query,
    source_page,
    created_at
FROM dbo.search_query_log
WHERE query LIKE N'%學雜費補助%'
   OR normalized_query LIKE N'%學雜費補助%'
ORDER BY created_at DESC;
```

### 看某個詞是否已存在正式詞典

```sql
SELECT
    id,
    term,
    display_term,
    normalized_term,
    term_type,
    source_kind,
    status
FROM dbo.search_term
WHERE normalized_term = N'學雜費補助';
```

### 看某個詞是否只存在 candidate

```sql
SELECT
    term,
    normalized_term,
    source_kind,
    evidence_field,
    quality_score,
    status
FROM dbo.search_policy_term_candidate
WHERE normalized_term = N'學雜費補助'
ORDER BY quality_score DESC;
```
