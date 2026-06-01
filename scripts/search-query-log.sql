USE [IFare];
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'[dbo].[search_query_log]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[search_query_log] (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        query_text NVARCHAR(200) NOT NULL,
        normalized_query NVARCHAR(200) NOT NULL,
        selected_term_id BIGINT NULL,
        source_page NVARCHAR(50) NOT NULL,
        filters_json NVARCHAR(MAX) NULL,
        result_count INT NOT NULL CONSTRAINT DF_search_query_log_result_count DEFAULT (0),
        clicked_policy_id BIGINT NULL,
        session_id NVARCHAR(100) NULL,
        user_id BIGINT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_search_query_log_created_at DEFAULT (SYSUTCDATETIME())
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_query_log_created_at'
      AND object_id = OBJECT_ID(N'[dbo].[search_query_log]')
)
BEGIN
    CREATE INDEX IX_search_query_log_created_at
        ON [dbo].[search_query_log](created_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_query_log_normalized_query'
      AND object_id = OBJECT_ID(N'[dbo].[search_query_log]')
)
BEGIN
    CREATE INDEX IX_search_query_log_normalized_query
        ON [dbo].[search_query_log](normalized_query);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_query_log_source_page_created_at'
      AND object_id = OBJECT_ID(N'[dbo].[search_query_log]')
)
BEGIN
    CREATE INDEX IX_search_query_log_source_page_created_at
        ON [dbo].[search_query_log](source_page, created_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_query_log_created_at_normalized_query'
      AND object_id = OBJECT_ID(N'[dbo].[search_query_log]')
)
BEGIN
    CREATE INDEX IX_search_query_log_created_at_normalized_query
        ON [dbo].[search_query_log](created_at ASC, normalized_query ASC)
        INCLUDE (source_page, result_count);
END;
GO

/*
    Aggregate query log into [search_term_stat_daily] as daily history.
    Each rebuild should upsert per-term, per-day rows instead of replacing the whole table.
*/

DECLARE @target_date DATE = CAST(GETDATE() AS DATE);
DECLARE @window_start_date DATE = DATEADD(DAY, -30, @target_date);

DELETE FROM [dbo].[search_term_stat_daily];

;WITH daily_logs AS (
    SELECT
        log.id,
        log.normalized_query,
        log.source_page,
        log.result_count
    FROM [dbo].[search_query_log] log
    WHERE
        CAST(log.created_at AS DATE) BETWEEN @window_start_date AND @target_date
        AND NULLIF(LTRIM(RTRIM(log.normalized_query)), N'') IS NOT NULL
),
matched_terms AS (
    SELECT
        log.id AS log_id,
        term.id AS term_id,
        log.source_page,
        log.result_count
    FROM daily_logs log
    INNER JOIN [dbo].[search_term] term
        ON term.status = N'active'
       AND term.normalized_term = log.normalized_query

    UNION

    SELECT
        log.id AS log_id,
        alias.term_id,
        log.source_page,
        log.result_count
    FROM daily_logs log
    INNER JOIN [dbo].[search_term_alias] alias
        ON alias.status = N'active'
       AND alias.normalized_alias = log.normalized_query
),
aggregated AS (
    SELECT
        match.term_id,
        @target_date AS stat_date,
        COUNT(*) AS search_count,
        SUM(CASE WHEN match.source_page = N'ifare_search_result' THEN 1 ELSE 0 END) AS select_count,
        SUM(match.result_count) AS result_count,
        SUM(CASE WHEN match.result_count <= 0 THEN 1 ELSE 0 END) AS zero_result_count
    FROM matched_terms match
    GROUP BY match.term_id
),
final_payload AS (
    SELECT
        agg.term_id,
        agg.stat_date,
        agg.search_count,
        agg.select_count,
        agg.result_count,
        agg.zero_result_count,
        CAST(
            (agg.search_count * 0.50) +
            (agg.select_count * 0.30) +
            ((agg.result_count - agg.zero_result_count) * 0.20)
            AS DECIMAL(12,4)
        ) AS trend_score
    FROM aggregated agg
)
MERGE [dbo].[search_term_stat_daily] AS target
USING final_payload AS src
ON target.term_id = src.term_id
AND target.stat_date = src.stat_date
WHEN MATCHED THEN
    UPDATE SET
        target.search_count = src.search_count,
        target.select_count = src.select_count,
        target.result_count = src.result_count,
        target.zero_result_count = src.zero_result_count,
        target.trend_score = src.trend_score,
        target.updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT (
        term_id,
        stat_date,
        search_count,
        select_count,
        result_count,
        zero_result_count,
        trend_score,
        created_at,
        updated_at
    )
    VALUES (
        src.term_id,
        src.stat_date,
        src.search_count,
        src.select_count,
        src.result_count,
        src.zero_result_count,
        src.trend_score,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );
GO

SELECT TOP (20)
    stat.stat_date,
    term.term,
    term.term_type,
    stat.search_count,
    stat.select_count,
    stat.result_count,
    stat.zero_result_count,
    stat.trend_score
FROM [dbo].[search_term_stat_daily] stat
INNER JOIN [dbo].[search_term] term
    ON term.id = stat.term_id
WHERE stat.stat_date = DATEADD(DAY, -1, CAST(GETDATE() AS DATE))
ORDER BY
    stat.trend_score DESC,
    stat.search_count DESC,
    term.term ASC;
GO
