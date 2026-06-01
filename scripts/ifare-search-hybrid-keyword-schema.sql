/*
    iFare hybrid keyword recommendation schema / migration
    Target DB: [iFare]
    Target schema: [dbo]

    This version is compatible with the existing iFare search dictionary design:
    - [dbo].[search_term] uses [source_kind] / [source_ref_id]
    - [dbo].[search_term_stat_daily] uses [search_count] / [select_count] / [result_count] / [zero_result_count] / [trend_score]
    - unique key on [search_term] should be ([normalized_term], [term_type]), not only [normalized_term]

    Purpose:
    1. Create missing search dictionary tables when absent
    2. Add hybrid-score columns to existing [search_term_stat_daily]
    3. Provide a rebuild proc that aggregates [search_query_log] into daily stats
    4. Keep existing app queries compatible by continuing to maintain [trend_score]
*/

USE [iFare];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'[dbo].[search_term]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[search_term]
    (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [term] NVARCHAR(200) NOT NULL,
        [normalized_term] NVARCHAR(200) NOT NULL,
        [display_term] NVARCHAR(200) NULL,
        [term_type] NVARCHAR(50) NOT NULL,
        [status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_search_term_status] DEFAULT (N'active'),
        [language] NVARCHAR(20) NOT NULL CONSTRAINT [DF_search_term_language] DEFAULT (N'zh-TW'),
        [base_weight] DECIMAL(10,4) NOT NULL CONSTRAINT [DF_search_term_base_weight] DEFAULT ((1.0000)),
        [manual_boost] DECIMAL(10,4) NOT NULL CONSTRAINT [DF_search_term_manual_boost] DEFAULT ((0.0000)),
        [source_kind] NVARCHAR(50) NOT NULL,
        [source_ref_id] NVARCHAR(100) NULL,
        [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_search_term_created_at] DEFAULT (SYSUTCDATETIME()),
        [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_search_term_updated_at] DEFAULT (SYSUTCDATETIME())
    );
END;
GO

IF COL_LENGTH(N'dbo.search_term', N'language') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term]
        ADD [language] NVARCHAR(20) NOT NULL
            CONSTRAINT [DF_search_term_language_migration] DEFAULT (N'zh-TW');
END;
GO

IF COL_LENGTH(N'dbo.search_term', N'base_weight') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term]
        ADD [base_weight] DECIMAL(10,4) NOT NULL
            CONSTRAINT [DF_search_term_base_weight_migration] DEFAULT ((1.0000));
END;
GO

IF COL_LENGTH(N'dbo.search_term', N'manual_boost') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term]
        ADD [manual_boost] DECIMAL(10,4) NOT NULL
            CONSTRAINT [DF_search_term_manual_boost_migration] DEFAULT ((0.0000));
END;
GO

IF COL_LENGTH(N'dbo.search_term', N'source_kind') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term]
        ADD [source_kind] NVARCHAR(50) NOT NULL
            CONSTRAINT [DF_search_term_source_kind_migration] DEFAULT (N'manual');
END;
GO

IF COL_LENGTH(N'dbo.search_term', N'source_ref_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term]
        ADD [source_ref_id] NVARCHAR(100) NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_search_term_normalized_term_type'
      AND object_id = OBJECT_ID(N'[dbo].[search_term]')
)
AND NOT EXISTS (
    SELECT normalized_term, term_type
    FROM [dbo].[search_term]
    GROUP BY normalized_term, term_type
    HAVING COUNT(*) > 1
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_search_term_normalized_term_type]
        ON [dbo].[search_term] ([normalized_term] ASC, [term_type] ASC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_term_status_term_type'
      AND object_id = OBJECT_ID(N'[dbo].[search_term]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_search_term_status_term_type]
        ON [dbo].[search_term] ([status] ASC, [term_type] ASC)
        INCLUDE ([display_term], [base_weight], [manual_boost], [source_kind]);
END;
GO

IF OBJECT_ID(N'[dbo].[search_term_alias]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[search_term_alias]
    (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [term_id] BIGINT NOT NULL,
        [alias] NVARCHAR(200) NOT NULL,
        [normalized_alias] NVARCHAR(200) NOT NULL,
        [alias_type] NVARCHAR(50) NOT NULL,
        [status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_search_term_alias_status] DEFAULT (N'active'),
        [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_search_term_alias_created_at] DEFAULT (SYSUTCDATETIME()),
        [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_search_term_alias_updated_at] DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT [FK_search_term_alias_term_id]
            FOREIGN KEY ([term_id]) REFERENCES [dbo].[search_term]([id])
    );
END;
GO

IF COL_LENGTH(N'dbo.search_term_alias', N'alias_type') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_alias]
        ADD [alias_type] NVARCHAR(50) NOT NULL
            CONSTRAINT [DF_search_term_alias_type_migration] DEFAULT (N'manual');
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_term_alias_term_id'
      AND object_id = OBJECT_ID(N'[dbo].[search_term_alias]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_search_term_alias_term_id]
        ON [dbo].[search_term_alias] ([term_id] ASC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_term_alias_normalized_alias'
      AND object_id = OBJECT_ID(N'[dbo].[search_term_alias]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_search_term_alias_normalized_alias]
        ON [dbo].[search_term_alias] ([normalized_alias] ASC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_term_alias_normalized_alias_status'
      AND object_id = OBJECT_ID(N'[dbo].[search_term_alias]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_search_term_alias_normalized_alias_status]
        ON [dbo].[search_term_alias] ([normalized_alias] ASC, [status] ASC)
        INCLUDE ([term_id]);
END;
GO

IF OBJECT_ID(N'[dbo].[search_term_source]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[search_term_source]
    (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [term_id] BIGINT NOT NULL,
        [source_kind] NVARCHAR(50) NOT NULL,
        [source_ref] NVARCHAR(200) NULL,
        [source_score] DECIMAL(10,4) NOT NULL CONSTRAINT [DF_search_term_source_score] DEFAULT ((0.0000)),
        [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_search_term_source_created_at] DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT [FK_search_term_source_term_id]
            FOREIGN KEY ([term_id]) REFERENCES [dbo].[search_term]([id])
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_term_source_term_id'
      AND object_id = OBJECT_ID(N'[dbo].[search_term_source]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_search_term_source_term_id]
        ON [dbo].[search_term_source] ([term_id] ASC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_term_source_kind'
      AND object_id = OBJECT_ID(N'[dbo].[search_term_source]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_search_term_source_kind]
        ON [dbo].[search_term_source] ([source_kind] ASC);
END;
GO

IF OBJECT_ID(N'[dbo].[search_term_stat_daily]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[search_term_stat_daily]
    (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [term_id] BIGINT NOT NULL,
        [stat_date] DATE NOT NULL,
        [search_count] INT NOT NULL CONSTRAINT [DF_search_term_stat_daily_search_count] DEFAULT ((0)),
        [select_count] INT NOT NULL CONSTRAINT [DF_search_term_stat_daily_select_count] DEFAULT ((0)),
        [result_count] INT NOT NULL CONSTRAINT [DF_search_term_stat_daily_result_count] DEFAULT ((0)),
        [zero_result_count] INT NOT NULL CONSTRAINT [DF_search_term_stat_daily_zero_result_count] DEFAULT ((0)),
        [trend_score] DECIMAL(12,4) NOT NULL CONSTRAINT [DF_search_term_stat_daily_trend_score] DEFAULT ((0.0000)),
        [external_trend_score] DECIMAL(18,6) NOT NULL CONSTRAINT [DF_search_term_stat_daily_external_trend_score] DEFAULT ((0)),
        [trend_growth_score] DECIMAL(18,6) NOT NULL CONSTRAINT [DF_search_term_stat_daily_trend_growth_score] DEFAULT ((0)),
        [content_match_count] INT NOT NULL CONSTRAINT [DF_search_term_stat_daily_content_match_count] DEFAULT ((0)),
        [content_freshness_score] DECIMAL(18,6) NOT NULL CONSTRAINT [DF_search_term_stat_daily_content_freshness_score] DEFAULT ((0)),
        [editorial_boost_score] DECIMAL(18,6) NOT NULL CONSTRAINT [DF_search_term_stat_daily_editorial_boost_score] DEFAULT ((0)),
        [final_hot_score] DECIMAL(18,6) NOT NULL CONSTRAINT [DF_search_term_stat_daily_final_hot_score] DEFAULT ((0)),
        [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_search_term_stat_daily_created_at] DEFAULT (SYSUTCDATETIME()),
        [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_search_term_stat_daily_updated_at] DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT [FK_search_term_stat_daily_term_id]
            FOREIGN KEY ([term_id]) REFERENCES [dbo].[search_term]([id])
    );
END;
GO

IF COL_LENGTH(N'dbo.search_term_stat_daily', N'search_count') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_stat_daily]
        ADD [search_count] INT NOT NULL
            CONSTRAINT [DF_search_term_stat_daily_search_count_migration] DEFAULT ((0));
END;
GO

IF COL_LENGTH(N'dbo.search_term_stat_daily', N'select_count') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_stat_daily]
        ADD [select_count] INT NOT NULL
            CONSTRAINT [DF_search_term_stat_daily_select_count_migration] DEFAULT ((0));
END;
GO

IF COL_LENGTH(N'dbo.search_term_stat_daily', N'result_count') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_stat_daily]
        ADD [result_count] INT NOT NULL
            CONSTRAINT [DF_search_term_stat_daily_result_count_migration] DEFAULT ((0));
END;
GO

IF COL_LENGTH(N'dbo.search_term_stat_daily', N'zero_result_count') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_stat_daily]
        ADD [zero_result_count] INT NOT NULL
            CONSTRAINT [DF_search_term_stat_daily_zero_result_count_migration] DEFAULT ((0));
END;
GO

IF COL_LENGTH(N'dbo.search_term_stat_daily', N'trend_score') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_stat_daily]
        ADD [trend_score] DECIMAL(12,4) NOT NULL
            CONSTRAINT [DF_search_term_stat_daily_trend_score_migration] DEFAULT ((0.0000));
END;
GO

IF COL_LENGTH(N'dbo.search_term_stat_daily', N'external_trend_score') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_stat_daily]
        ADD [external_trend_score] DECIMAL(18,6) NOT NULL
            CONSTRAINT [DF_search_term_stat_daily_external_trend_score_migration] DEFAULT ((0));
END;
GO

IF COL_LENGTH(N'dbo.search_term_stat_daily', N'trend_growth_score') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_stat_daily]
        ADD [trend_growth_score] DECIMAL(18,6) NOT NULL
            CONSTRAINT [DF_search_term_stat_daily_trend_growth_score_migration] DEFAULT ((0));
END;
GO

IF COL_LENGTH(N'dbo.search_term_stat_daily', N'content_match_count') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_stat_daily]
        ADD [content_match_count] INT NOT NULL
            CONSTRAINT [DF_search_term_stat_daily_content_match_count_migration] DEFAULT ((0));
END;
GO

IF COL_LENGTH(N'dbo.search_term_stat_daily', N'content_freshness_score') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_stat_daily]
        ADD [content_freshness_score] DECIMAL(18,6) NOT NULL
            CONSTRAINT [DF_search_term_stat_daily_content_freshness_score_migration] DEFAULT ((0));
END;
GO

IF COL_LENGTH(N'dbo.search_term_stat_daily', N'editorial_boost_score') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_stat_daily]
        ADD [editorial_boost_score] DECIMAL(18,6) NOT NULL
            CONSTRAINT [DF_search_term_stat_daily_editorial_boost_score_migration] DEFAULT ((0));
END;
GO

IF COL_LENGTH(N'dbo.search_term_stat_daily', N'final_hot_score') IS NULL
BEGIN
    ALTER TABLE [dbo].[search_term_stat_daily]
        ADD [final_hot_score] DECIMAL(18,6) NOT NULL
            CONSTRAINT [DF_search_term_stat_daily_final_hot_score_migration] DEFAULT ((0));
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_search_term_stat_daily_term_date'
      AND object_id = OBJECT_ID(N'[dbo].[search_term_stat_daily]')
)
AND NOT EXISTS (
    SELECT term_id, stat_date
    FROM [dbo].[search_term_stat_daily]
    GROUP BY term_id, stat_date
    HAVING COUNT(*) > 1
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_search_term_stat_daily_term_date]
        ON [dbo].[search_term_stat_daily] ([term_id] ASC, [stat_date] ASC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_term_stat_daily_stat_date_hot_score'
      AND object_id = OBJECT_ID(N'[dbo].[search_term_stat_daily]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_search_term_stat_daily_stat_date_hot_score]
        ON [dbo].[search_term_stat_daily] ([stat_date] DESC, [final_hot_score] DESC)
        INCLUDE ([term_id], [search_count], [trend_score], [external_trend_score]);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_term_stat_daily_stat_date_term_id'
      AND object_id = OBJECT_ID(N'[dbo].[search_term_stat_daily]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_search_term_stat_daily_stat_date_term_id]
        ON [dbo].[search_term_stat_daily] ([stat_date] DESC, [term_id] ASC)
        INCLUDE ([search_count], [select_count], [result_count], [zero_result_count], [trend_score], [external_trend_score], [trend_growth_score], [final_hot_score]);
END;
GO

IF OBJECT_ID(N'[dbo].[search_term_candidate]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[search_term_candidate]
    (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [raw_term] NVARCHAR(200) NOT NULL,
        [normalized_term] NVARCHAR(200) NOT NULL,
        [first_seen_at] DATETIME2 NOT NULL CONSTRAINT [DF_search_term_candidate_first_seen_at] DEFAULT (SYSUTCDATETIME()),
        [last_seen_at] DATETIME2 NOT NULL CONSTRAINT [DF_search_term_candidate_last_seen_at] DEFAULT (SYSUTCDATETIME()),
        [seen_count] INT NOT NULL CONSTRAINT [DF_search_term_candidate_seen_count] DEFAULT ((1)),
        [sample_source_page] NVARCHAR(50) NULL,
        [status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_search_term_candidate_status] DEFAULT (N'pending'),
        [review_note] NVARCHAR(500) NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_term_candidate_normalized_term'
      AND object_id = OBJECT_ID(N'[dbo].[search_term_candidate]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_search_term_candidate_normalized_term]
        ON [dbo].[search_term_candidate] ([normalized_term] ASC);
END;
GO

IF OBJECT_ID(N'[dbo].[sp_upsert_search_term_candidate]', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE [dbo].[sp_upsert_search_term_candidate];
END;
GO

CREATE PROCEDURE [dbo].[sp_upsert_search_term_candidate]
    @raw_term NVARCHAR(200),
    @normalized_term NVARCHAR(200),
    @source_page NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@normalized_term)), N'') IS NULL
    BEGIN
        RETURN;
    END;

    MERGE [dbo].[search_term_candidate] AS target
    USING (
        SELECT
            @raw_term AS raw_term,
            @normalized_term AS normalized_term,
            @source_page AS source_page
    ) AS source
    ON target.normalized_term = source.normalized_term
    WHEN MATCHED THEN
        UPDATE SET
            target.last_seen_at = SYSUTCDATETIME(),
            target.seen_count = target.seen_count + 1,
            target.raw_term = source.raw_term,
            target.sample_source_page = COALESCE(source.source_page, target.sample_source_page)
    WHEN NOT MATCHED THEN
        INSERT ([raw_term], [normalized_term], [sample_source_page])
        VALUES (source.raw_term, source.normalized_term, source.source_page);
END;
GO

IF OBJECT_ID(N'[dbo].[sp_rebuild_search_term_stat_daily]', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE [dbo].[sp_rebuild_search_term_stat_daily];
END;
GO

CREATE PROCEDURE [dbo].[sp_rebuild_search_term_stat_daily]
    @start_date DATE = NULL,
    @end_date DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF OBJECT_ID(N'[dbo].[search_query_log]', N'U') IS NULL
    BEGIN
        RAISERROR('Table [dbo].[search_query_log] does not exist.', 16, 1);
        RETURN;
    END;

    DECLARE @effective_start_date DATE = ISNULL(@start_date, DATEADD(DAY, -30, CAST(GETUTCDATE() AS DATE)));
    DECLARE @effective_end_date DATE = ISNULL(@end_date, CAST(GETUTCDATE() AS DATE));
    DECLARE @snapshot_date DATE = CAST(GETUTCDATE() AS DATE);

    IF @effective_start_date > @effective_end_date
    BEGIN
        RAISERROR('@start_date cannot be greater than @end_date.', 16, 1);
        RETURN;
    END;

    DELETE FROM [dbo].[search_term_stat_daily];

    ;WITH matched_log AS
    (
        SELECT
            t.id AS term_id,
            q.source_page,
            q.result_count
        FROM [dbo].[search_query_log] q
        INNER JOIN [dbo].[search_term] t
            ON t.normalized_term = q.normalized_query
           AND t.status = N'active'
        WHERE CAST(q.created_at AS DATE) BETWEEN @effective_start_date AND @effective_end_date

        UNION

        SELECT
            a.term_id,
            q.source_page,
            q.result_count
        FROM [dbo].[search_query_log] q
        INNER JOIN [dbo].[search_term_alias] a
            ON a.normalized_alias = q.normalized_query
           AND a.status = N'active'
        WHERE CAST(q.created_at AS DATE) BETWEEN @effective_start_date AND @effective_end_date
    ),
    deduped_match AS
    (
        SELECT
            term_id,
            source_page,
            result_count
        FROM matched_log
        GROUP BY
            term_id,
            source_page,
            result_count
    ),
    aggregated AS
    (
        SELECT
            m.term_id,
            @snapshot_date AS stat_date,
            COUNT(1) AS search_count,
            SUM(CASE WHEN m.source_page = N'ifare_search_result' THEN 1 ELSE 0 END) AS select_count,
            SUM(ISNULL(m.result_count, 0)) AS result_count,
            SUM(CASE WHEN ISNULL(m.result_count, 0) <= 0 THEN 1 ELSE 0 END) AS zero_result_count
        FROM deduped_match m
        GROUP BY
            m.term_id
    ),
    content_stats AS
    (
        SELECT
            term.id AS term_id,
            CAST(0 AS INT) AS content_match_count,
            CAST(0 AS DECIMAL(18,6)) AS content_freshness_score,
            CAST(ISNULL(term.manual_boost, 0) AS DECIMAL(18,6)) AS editorial_boost_score
        FROM [dbo].[search_term] term
    ),
    payload AS
    (
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
            ) AS trend_score,
            CAST(0 AS DECIMAL(18,6)) AS external_trend_score,
            CAST(0 AS DECIMAL(18,6)) AS trend_growth_score,
            cs.content_match_count,
            cs.content_freshness_score,
            cs.editorial_boost_score,
            CAST(
                (
                    ((agg.search_count * 0.50) +
                     (agg.select_count * 0.30) +
                     ((agg.result_count - agg.zero_result_count) * 0.20)) * 0.40
                ) +
                (0 * 0.30) +
                (cs.content_freshness_score * 0.20) +
                (cs.editorial_boost_score * 0.10)
                AS DECIMAL(18,6)
            ) AS final_hot_score
        FROM aggregated agg
        INNER JOIN content_stats cs
            ON cs.term_id = agg.term_id
    )
    MERGE [dbo].[search_term_stat_daily] AS target
    USING payload AS src
    ON target.term_id = src.term_id
       AND target.stat_date = src.stat_date
    WHEN MATCHED THEN
        UPDATE SET
            target.search_count = src.search_count,
            target.select_count = src.select_count,
            target.result_count = src.result_count,
            target.zero_result_count = src.zero_result_count,
            target.trend_score = src.trend_score,
            target.external_trend_score = src.external_trend_score,
            target.trend_growth_score = src.trend_growth_score,
            target.content_match_count = src.content_match_count,
            target.content_freshness_score = src.content_freshness_score,
            target.editorial_boost_score = src.editorial_boost_score,
            target.final_hot_score = src.final_hot_score,
            target.updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT
        (
            [term_id],
            [stat_date],
            [search_count],
            [select_count],
            [result_count],
            [zero_result_count],
            [trend_score],
            [external_trend_score],
            [trend_growth_score],
            [content_match_count],
            [content_freshness_score],
            [editorial_boost_score],
            [final_hot_score],
            [created_at],
            [updated_at]
        )
        VALUES
        (
            src.term_id,
            src.stat_date,
            src.search_count,
            src.select_count,
            src.result_count,
            src.zero_result_count,
            src.trend_score,
            src.external_trend_score,
            src.trend_growth_score,
            src.content_match_count,
            src.content_freshness_score,
            src.editorial_boost_score,
            src.final_hot_score,
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
        );
END;
GO

IF OBJECT_ID(N'[dbo].[vw_search_term_hot_score_7d]', N'V') IS NOT NULL
BEGIN
    DROP VIEW [dbo].[vw_search_term_hot_score_7d];
END;
GO

CREATE VIEW [dbo].[vw_search_term_hot_score_7d]
AS
SELECT
    t.id AS term_id,
    t.term,
    t.display_term,
    t.term_type,
    t.source_kind,
    SUM(s.search_count) AS total_search_count_7d,
    SUM(s.select_count) AS total_select_count_7d,
    SUM(s.trend_score) AS total_trend_score_7d,
    SUM(s.external_trend_score) AS total_external_trend_score_7d,
    SUM(s.final_hot_score) AS total_final_hot_score_7d,
    MAX(s.stat_date) AS latest_stat_date
FROM [dbo].[search_term] t
INNER JOIN [dbo].[search_term_stat_daily] s
    ON s.term_id = t.id
WHERE
    t.status = N'active'
    AND s.stat_date = (SELECT MAX(stat_date) FROM [dbo].[search_term_stat_daily])
GROUP BY
    t.id,
    t.term,
    t.display_term,
    t.term_type,
    t.source_kind;
GO

MERGE [dbo].[search_term] AS target
USING
(
    SELECT
        N'育兒津貼' AS term,
        N'育兒津貼' AS normalized_term,
        N'育兒津貼' AS display_term,
        N'keyword' AS term_type,
        N'manual' AS source_kind,
        CAST(NULL AS NVARCHAR(100)) AS source_ref_id,
        CAST(1.0000 AS DECIMAL(10,4)) AS base_weight,
        CAST(0.1500 AS DECIMAL(10,4)) AS manual_boost
    UNION ALL
    SELECT N'租屋補助', N'租屋補助', N'租屋補助', N'keyword', N'manual', NULL, CAST(1.0000 AS DECIMAL(10,4)), CAST(0.1500 AS DECIMAL(10,4))
    UNION ALL
    SELECT N'失業補助', N'失業補助', N'失業補助', N'keyword', N'manual', NULL, CAST(1.0000 AS DECIMAL(10,4)), CAST(0.1000 AS DECIMAL(10,4))
    UNION ALL
    SELECT N'長照補助', N'長照補助', N'長照補助', N'keyword', N'manual', NULL, CAST(1.0000 AS DECIMAL(10,4)), CAST(0.1000 AS DECIMAL(10,4))
) AS src
ON target.normalized_term = src.normalized_term
   AND target.term_type = src.term_type
WHEN MATCHED THEN
    UPDATE SET
        target.term = src.term,
        target.display_term = src.display_term,
        target.status = N'active',
        target.base_weight = src.base_weight,
        target.manual_boost = src.manual_boost,
        target.source_kind = src.source_kind,
        target.source_ref_id = src.source_ref_id,
        target.updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT
    (
        [term],
        [normalized_term],
        [display_term],
        [term_type],
        [status],
        [language],
        [base_weight],
        [manual_boost],
        [source_kind],
        [source_ref_id],
        [created_at],
        [updated_at]
    )
    VALUES
    (
        src.term,
        src.normalized_term,
        src.display_term,
        src.term_type,
        N'active',
        N'zh-TW',
        src.base_weight,
        src.manual_boost,
        src.source_kind,
        src.source_ref_id,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );
GO

MERGE [dbo].[search_term_alias] AS target
USING
(
    SELECT
        t.id AS term_id,
        N'租補' AS alias,
        N'租補' AS normalized_alias,
        N'synonym' AS alias_type
    FROM [dbo].[search_term] t
    WHERE t.normalized_term = N'租屋補助'
      AND t.term_type = N'keyword'

    UNION ALL

    SELECT
        t.id AS term_id,
        N'房租補貼' AS alias,
        N'房租補貼' AS normalized_alias,
        N'synonym' AS alias_type
    FROM [dbo].[search_term] t
    WHERE t.normalized_term = N'租屋補助'
      AND t.term_type = N'keyword'
) AS src
ON target.term_id = src.term_id
   AND target.normalized_alias = src.normalized_alias
WHEN MATCHED THEN
    UPDATE SET
        target.alias = src.alias,
        target.alias_type = src.alias_type,
        target.status = N'active',
        target.updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT
    (
        [term_id],
        [alias],
        [normalized_alias],
        [alias_type],
        [status],
        [created_at],
        [updated_at]
    )
    VALUES
    (
        src.term_id,
        src.alias,
        src.normalized_alias,
        src.alias_type,
        N'active',
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );
GO

/*
    Suggested execution after schema migration:

    EXEC [dbo].[sp_rebuild_search_term_stat_daily]
        @start_date = '2026-04-01',
        @end_date = '2026-05-15';

    SELECT TOP (20) *
    FROM [dbo].[vw_search_term_hot_score_7d]
    ORDER BY [total_final_hot_score_7d] DESC, [total_search_count_7d] DESC;
*/
