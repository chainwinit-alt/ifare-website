/*
    iFare policy/content-driven term pipeline
    Target DB: [iFare]
    Target schema: [dbo]

    Goal:
    1. Build candidate terms from IFarePolicy + code tables instead of hardcoded words
    2. Promote good candidates into dbo.search_term
    3. Reuse dbo.search_query_log to compute behavior-based hot scores

    Existing table assumptions:
    - dbo.search_term
    - dbo.search_term_alias
    - dbo.search_term_source
    - dbo.search_term_stat_daily
    - dbo.search_query_log

    Suggested run order:
    1. EXEC dbo.sp_refresh_policy_term_candidate;
    2. EXEC dbo.sp_promote_policy_term_candidate_to_search_term;
    3. EXEC dbo.sp_rebuild_policy_term_hot_stat @start_date='2026-04-01', @end_date='2026-05-15';
*/

USE [iFare];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'[dbo].[search_policy_term_candidate]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[search_policy_term_candidate]
    (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [term] NVARCHAR(200) NOT NULL,
        [normalized_term] NVARCHAR(200) NOT NULL,
        [display_term] NVARCHAR(200) NULL,
        [term_type] NVARCHAR(50) NOT NULL,
        [source_kind] NVARCHAR(50) NOT NULL,
        [source_ref_id] NVARCHAR(100) NULL,
        [evidence_field] NVARCHAR(50) NOT NULL,
        [policy_count] INT NOT NULL CONSTRAINT [DF_search_policy_term_candidate_policy_count] DEFAULT ((0)),
        [title_hit_count] INT NOT NULL CONSTRAINT [DF_search_policy_term_candidate_title_hit_count] DEFAULT ((0)),
        [keyword_hit_count] INT NOT NULL CONSTRAINT [DF_search_policy_term_candidate_keyword_hit_count] DEFAULT ((0)),
        [recipient_hit_count] INT NOT NULL CONSTRAINT [DF_search_policy_term_candidate_recipient_hit_count] DEFAULT ((0)),
        [identity_hit_count] INT NOT NULL CONSTRAINT [DF_search_policy_term_candidate_identity_hit_count] DEFAULT ((0)),
        [income_hit_count] INT NOT NULL CONSTRAINT [DF_search_policy_term_candidate_income_hit_count] DEFAULT ((0)),
        [policy_type_hit_count] INT NOT NULL CONSTRAINT [DF_search_policy_term_candidate_policy_type_hit_count] DEFAULT ((0)),
        [content_score] DECIMAL(18,6) NOT NULL CONSTRAINT [DF_search_policy_term_candidate_content_score] DEFAULT ((0)),
        [quality_score] DECIMAL(18,6) NOT NULL CONSTRAINT [DF_search_policy_term_candidate_quality_score] DEFAULT ((0)),
        [status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_search_policy_term_candidate_status] DEFAULT (N'candidate'),
        [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_search_policy_term_candidate_created_at] DEFAULT (SYSUTCDATETIME()),
        [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_search_policy_term_candidate_updated_at] DEFAULT (SYSUTCDATETIME())
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_search_policy_term_candidate_norm_type_source'
      AND object_id = OBJECT_ID(N'[dbo].[search_policy_term_candidate]')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_search_policy_term_candidate_norm_type_source]
        ON [dbo].[search_policy_term_candidate] ([normalized_term], [term_type], [source_kind], [source_ref_id]);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_policy_term_candidate_status_quality'
      AND object_id = OBJECT_ID(N'[dbo].[search_policy_term_candidate]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_search_policy_term_candidate_status_quality]
        ON [dbo].[search_policy_term_candidate] ([status], [quality_score] DESC)
        INCLUDE ([term], [term_type], [policy_count], [content_score]);
END;
GO

IF OBJECT_ID(N'[dbo].[sp_refresh_policy_term_candidate]', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE [dbo].[sp_refresh_policy_term_candidate];
END;
GO

CREATE PROCEDURE [dbo].[sp_refresh_policy_term_candidate]
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH valid_policy AS
    (
        SELECT
            p.ID,
            p.Title,
            p.Qualification,
            p.CodePolicy_ID,
            p.ReleaseTime,
            p.CreateTime
        FROM [dbo].[IFarePolicy] p
        WHERE
            p.State NOT IN (N'Disabled', N'Delete')
            AND p.ReleaseTime IS NOT NULL
            AND p.ReleaseTime <= GETDATE()
            AND (p.DiscontinuedTime IS NULL OR p.DiscontinuedTime > GETDATE())
    ),
    source_terms AS
    (
        SELECT
            p.Title AS term,
            p.Title AS display_term,
            LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(p.Title)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')) AS normalized_term,
            N'policy_title' AS term_type,
            N'ifare_policy' AS source_kind,
            CAST(p.ID AS NVARCHAR(100)) AS source_ref_id,
            N'title' AS evidence_field,
            CAST(1 AS INT) AS policy_count,
            CAST(1 AS INT) AS title_hit_count,
            CAST(0 AS INT) AS keyword_hit_count,
            CAST(0 AS INT) AS recipient_hit_count,
            CAST(0 AS INT) AS identity_hit_count,
            CAST(0 AS INT) AS income_hit_count,
            CAST(0 AS INT) AS policy_type_hit_count
        FROM valid_policy p
        WHERE NULLIF(LTRIM(RTRIM(p.Title)), N'') IS NOT NULL

        UNION ALL

        SELECT
            k.LabelName,
            k.LabelName,
            LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(k.LabelName)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')),
            N'keyword',
            N'code_keyword',
            CAST(k.ID AS NVARCHAR(100)),
            N'code_keyword',
            COUNT(DISTINCT map.IFarePolicy_ID),
            0,
            COUNT(DISTINCT map.IFarePolicy_ID),
            0,
            0,
            0,
            0
        FROM [dbo].[CodeKeyword] k
        INNER JOIN [dbo].[IFarePolicy_CodeKeyword] map
            ON map.CodeKeyword_ID = k.ID
        INNER JOIN valid_policy p
            ON p.ID = map.IFarePolicy_ID
        WHERE
            k.State NOT IN (N'Disabled', N'Delete')
            AND NULLIF(LTRIM(RTRIM(k.LabelName)), N'') IS NOT NULL
        GROUP BY k.ID, k.LabelName

        UNION ALL

        SELECT
            r.LabelName,
            r.LabelName,
            LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(r.LabelName)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')),
            N'recipient',
            N'code_recipient',
            CAST(r.ID AS NVARCHAR(100)),
            N'code_recipient',
            COUNT(DISTINCT map.IFarePolicy_ID),
            0,
            0,
            COUNT(DISTINCT map.IFarePolicy_ID),
            0,
            0,
            0
        FROM [dbo].[CodeRecipient] r
        INNER JOIN [dbo].[IFarePolicy_CodeRecipient] map
            ON map.CodeRecipient_ID = r.ID
        INNER JOIN valid_policy p
            ON p.ID = map.IFarePolicy_ID
        WHERE
            r.State NOT IN (N'Disabled', N'Delete')
            AND NULLIF(LTRIM(RTRIM(r.LabelName)), N'') IS NOT NULL
        GROUP BY r.ID, r.LabelName

        UNION ALL

        SELECT
            i.LabelName,
            i.LabelName,
            LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(i.LabelName)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')),
            N'identity',
            N'code_identity',
            CAST(i.ID AS NVARCHAR(100)),
            N'code_identity',
            COUNT(DISTINCT map.IFarePolicy_ID),
            0,
            0,
            0,
            COUNT(DISTINCT map.IFarePolicy_ID),
            0,
            0
        FROM [dbo].[CodeIdentity] i
        INNER JOIN [dbo].[IFarePolicy_CodeIdentity] map
            ON map.CodeIdentity_ID = i.ID
        INNER JOIN valid_policy p
            ON p.ID = map.IFarePolicy_ID
        WHERE
            i.State NOT IN (N'Disabled', N'Delete')
            AND NULLIF(LTRIM(RTRIM(i.LabelName)), N'') IS NOT NULL
        GROUP BY i.ID, i.LabelName

        UNION ALL

        SELECT
            inc.LabelName,
            inc.LabelName,
            LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(inc.LabelName)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')),
            N'income',
            N'code_income',
            CAST(inc.ID AS NVARCHAR(100)),
            N'code_income',
            COUNT(DISTINCT map.IFarePolicy_ID),
            0,
            0,
            0,
            0,
            COUNT(DISTINCT map.IFarePolicy_ID),
            0
        FROM [dbo].[CodeIncome] inc
        INNER JOIN [dbo].[IFarePolicy_CodeIncome] map
            ON map.CodeIncome_ID = inc.ID
        INNER JOIN valid_policy p
            ON p.ID = map.IFarePolicy_ID
        WHERE
            inc.State NOT IN (N'Disabled', N'Delete')
            AND NULLIF(LTRIM(RTRIM(inc.LabelName)), N'') IS NOT NULL
        GROUP BY inc.ID, inc.LabelName

        UNION ALL

        SELECT
            cp.LabelName,
            cp.LabelName,
            LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(cp.LabelName)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')),
            N'policy',
            N'code_policy',
            CAST(cp.ID AS NVARCHAR(100)),
            N'code_policy',
            COUNT(DISTINCT p.ID),
            0,
            0,
            0,
            0,
            0,
            COUNT(DISTINCT p.ID)
        FROM [dbo].[CodePolicy] cp
        INNER JOIN valid_policy p
            ON p.CodePolicy_ID = cp.ID
        WHERE
            cp.State NOT IN (N'Disabled', N'Delete')
            AND NULLIF(LTRIM(RTRIM(cp.LabelName)), N'') IS NOT NULL
        GROUP BY cp.ID, cp.LabelName
    ),
    scored_terms AS
    (
        SELECT
            s.term,
            s.normalized_term,
            s.display_term,
            s.term_type,
            s.source_kind,
            s.source_ref_id,
            s.evidence_field,
            s.policy_count,
            s.title_hit_count,
            s.keyword_hit_count,
            s.recipient_hit_count,
            s.identity_hit_count,
            s.income_hit_count,
            s.policy_type_hit_count,
            CAST(
                (s.policy_count * 1.0) +
                (s.title_hit_count * 1.5) +
                (s.keyword_hit_count * 1.2) +
                (s.recipient_hit_count * 1.0) +
                (s.identity_hit_count * 1.0) +
                (s.income_hit_count * 1.0) +
                (s.policy_type_hit_count * 1.1)
                AS DECIMAL(18,6)
            ) AS content_score,
            CAST(
                (
                    (s.policy_count * 1.0) +
                    (s.title_hit_count * 1.5) +
                    (s.keyword_hit_count * 1.2) +
                    (s.recipient_hit_count * 1.0) +
                    (s.identity_hit_count * 1.0) +
                    (s.income_hit_count * 1.0) +
                    (s.policy_type_hit_count * 1.1)
                )
                +
                CASE
                    WHEN LEN(s.normalized_term) BETWEEN 4 AND 12 THEN 1.5
                    WHEN LEN(s.normalized_term) BETWEEN 2 AND 3 THEN 0.3
                    ELSE 0.8
                END
                AS DECIMAL(18,6)
            ) AS quality_score
        FROM source_terms s
        WHERE
            NULLIF(s.normalized_term, N'') IS NOT NULL
            AND LEN(s.normalized_term) >= 2
    )
    MERGE [dbo].[search_policy_term_candidate] AS target
    USING scored_terms AS src
    ON target.normalized_term = src.normalized_term
       AND target.term_type = src.term_type
       AND target.source_kind = src.source_kind
       AND ISNULL(target.source_ref_id, N'') = ISNULL(src.source_ref_id, N'')
    WHEN MATCHED THEN
        UPDATE SET
            target.term = src.term,
            target.display_term = src.display_term,
            target.evidence_field = src.evidence_field,
            target.policy_count = src.policy_count,
            target.title_hit_count = src.title_hit_count,
            target.keyword_hit_count = src.keyword_hit_count,
            target.recipient_hit_count = src.recipient_hit_count,
            target.identity_hit_count = src.identity_hit_count,
            target.income_hit_count = src.income_hit_count,
            target.policy_type_hit_count = src.policy_type_hit_count,
            target.content_score = src.content_score,
            target.quality_score = src.quality_score,
            target.status = CASE WHEN src.quality_score >= 2.0 THEN N'ready' ELSE N'candidate' END,
            target.updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT
        (
            [term],
            [normalized_term],
            [display_term],
            [term_type],
            [source_kind],
            [source_ref_id],
            [evidence_field],
            [policy_count],
            [title_hit_count],
            [keyword_hit_count],
            [recipient_hit_count],
            [identity_hit_count],
            [income_hit_count],
            [policy_type_hit_count],
            [content_score],
            [quality_score],
            [status],
            [created_at],
            [updated_at]
        )
        VALUES
        (
            src.term,
            src.normalized_term,
            src.display_term,
            src.term_type,
            src.source_kind,
            src.source_ref_id,
            src.evidence_field,
            src.policy_count,
            src.title_hit_count,
            src.keyword_hit_count,
            src.recipient_hit_count,
            src.identity_hit_count,
            src.income_hit_count,
            src.policy_type_hit_count,
            src.content_score,
            src.quality_score,
            CASE WHEN src.quality_score >= 2.0 THEN N'ready' ELSE N'candidate' END,
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
        );
END;
GO

IF OBJECT_ID(N'[dbo].[sp_promote_policy_term_candidate_to_search_term]', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE [dbo].[sp_promote_policy_term_candidate_to_search_term];
END;
GO

CREATE PROCEDURE [dbo].[sp_promote_policy_term_candidate_to_search_term]
    @min_quality_score DECIMAL(18,6) = 2.0,
    @min_policy_count INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    MERGE [dbo].[search_term] AS target
    USING
    (
        SELECT
            ranked.term,
            ranked.normalized_term,
            ranked.display_term,
            ranked.term_type,
            ranked.source_kind,
            ranked.source_ref_id,
            ranked.base_weight
        FROM
        (
            SELECT
                c.term,
                c.normalized_term,
                c.display_term,
                c.term_type,
                c.source_kind,
                c.source_ref_id,
                CAST(
                    CASE
                        WHEN c.term_type = N'policy_title' THEN 1.20
                        WHEN c.term_type = N'keyword' THEN 1.10
                        WHEN c.term_type = N'policy' THEN 1.05
                        WHEN c.term_type = N'recipient' THEN 1.00
                        WHEN c.term_type = N'identity' THEN 0.95
                        WHEN c.term_type = N'income' THEN 0.90
                        ELSE 1.00
                    END
                    AS DECIMAL(10,4)
                ) AS base_weight,
                ROW_NUMBER() OVER
                (
                    PARTITION BY c.normalized_term, c.term_type
                    ORDER BY
                        c.quality_score DESC,
                        c.policy_count DESC,
                        CASE c.source_kind
                            WHEN N'code_keyword' THEN 1
                            WHEN N'code_policy' THEN 2
                            WHEN N'code_recipient' THEN 3
                            WHEN N'code_identity' THEN 4
                            WHEN N'code_income' THEN 5
                            WHEN N'ifare_policy' THEN 6
                            ELSE 99
                        END,
                        ISNULL(c.source_ref_id, N'')
                ) AS rn
            FROM [dbo].[search_policy_term_candidate] c
            WHERE
                c.quality_score >= @min_quality_score
                AND c.policy_count >= @min_policy_count
                AND c.status IN (N'ready', N'approved', N'candidate')
        ) ranked
        WHERE ranked.rn = 1
    ) AS src
    ON target.normalized_term = src.normalized_term
       AND target.term_type = src.term_type
    WHEN MATCHED THEN
        UPDATE SET
            target.term = src.term,
            target.display_term = src.display_term,
            target.status = N'active',
            target.base_weight = CASE WHEN src.base_weight > target.base_weight THEN src.base_weight ELSE target.base_weight END,
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
            0.0000,
            src.source_kind,
            src.source_ref_id,
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
        );

    MERGE [dbo].[search_term_source] AS target
    USING
    (
        SELECT
            t.id AS term_id,
            c.source_kind,
            c.source_ref_id AS source_ref,
            CAST(c.content_score AS DECIMAL(10,4)) AS source_score
        FROM [dbo].[search_policy_term_candidate] c
        INNER JOIN [dbo].[search_term] t
            ON t.normalized_term = c.normalized_term
           AND t.term_type = c.term_type
        WHERE
            c.quality_score >= @min_quality_score
            AND c.policy_count >= @min_policy_count
    ) AS src
    ON target.term_id = src.term_id
       AND target.source_kind = src.source_kind
       AND ISNULL(target.source_ref, N'') = ISNULL(src.source_ref, N'')
    WHEN MATCHED THEN
        UPDATE SET
            target.source_score = src.source_score
    WHEN NOT MATCHED THEN
        INSERT ([term_id], [source_kind], [source_ref], [source_score], [created_at])
        VALUES (src.term_id, src.source_kind, src.source_ref, src.source_score, SYSUTCDATETIME());
END;
GO

IF OBJECT_ID(N'[dbo].[sp_rebuild_policy_term_hot_stat]', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE [dbo].[sp_rebuild_policy_term_hot_stat];
END;
GO

CREATE PROCEDURE [dbo].[sp_rebuild_policy_term_hot_stat]
    @start_date DATE = NULL,
    @end_date DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @effective_start_date DATE = ISNULL(@start_date, DATEADD(DAY, -30, CAST(GETUTCDATE() AS DATE)));
    DECLARE @effective_end_date DATE = ISNULL(@end_date, CAST(GETUTCDATE() AS DATE));

    ;WITH mapped_query AS
    (
        SELECT
            CAST(q.created_at AS DATE) AS stat_date,
            COALESCE(term.id, alias_term.id) AS term_id,
            q.result_count,
            q.source_page
        FROM [dbo].[search_query_log] q
        LEFT JOIN [dbo].[search_term] term
            ON term.normalized_term = q.normalized_query
           AND term.status = N'active'
        LEFT JOIN [dbo].[search_term_alias] alias
            ON alias.normalized_alias = q.normalized_query
           AND alias.status = N'active'
        LEFT JOIN [dbo].[search_term] alias_term
            ON alias_term.id = alias.term_id
           AND alias_term.status = N'active'
        WHERE
            CAST(q.created_at AS DATE) BETWEEN @effective_start_date AND @effective_end_date
            AND NULLIF(LTRIM(RTRIM(q.normalized_query)), N'') IS NOT NULL
    ),
    daily_behavior AS
    (
        SELECT
            mq.stat_date,
            mq.term_id,
            COUNT(*) AS search_count,
            SUM(CASE WHEN mq.source_page = N'ifare_search_result' THEN 1 ELSE 0 END) AS select_count,
            SUM(ISNULL(mq.result_count, 0)) AS result_count,
            SUM(CASE WHEN ISNULL(mq.result_count, 0) <= 0 THEN 1 ELSE 0 END) AS zero_result_count
        FROM mapped_query mq
        WHERE mq.term_id IS NOT NULL
        GROUP BY mq.stat_date, mq.term_id
    ),
    content_support AS
    (
        SELECT
            c.normalized_term,
            c.term_type,
            MAX(c.policy_count) AS policy_count,
            MAX(c.content_score) AS content_score,
            MAX(c.quality_score) AS quality_score
        FROM [dbo].[search_policy_term_candidate] c
        GROUP BY c.normalized_term, c.term_type
    ),
    payload AS
    (
        SELECT
            b.term_id,
            b.stat_date,
            b.search_count,
            b.select_count,
            b.result_count,
            b.zero_result_count,
            CAST(
                (b.search_count * 0.50) +
                (b.select_count * 0.30) +
                ((b.result_count - b.zero_result_count) * 0.20)
                AS DECIMAL(12,4)
            ) AS trend_score,
            CAST(0 AS DECIMAL(18,6)) AS external_trend_score,
            CAST(0 AS DECIMAL(18,6)) AS trend_growth_score,
            ISNULL(cs.policy_count, 0) AS content_match_count,
            CAST(ISNULL(cs.content_score, 0) AS DECIMAL(18,6)) AS content_freshness_score,
            CAST(ISNULL(t.manual_boost, 0) AS DECIMAL(18,6)) AS editorial_boost_score,
            CAST(
                (
                    ((b.search_count * 0.50) +
                     (b.select_count * 0.30) +
                     ((b.result_count - b.zero_result_count) * 0.20)) * 0.40
                ) +
                (ISNULL(cs.content_score, 0) * 0.20) +
                (ISNULL(t.manual_boost, 0) * 0.10) +
                (ISNULL(t.base_weight, 1.0) * 0.10)
                AS DECIMAL(18,6)
            ) AS final_hot_score
        FROM daily_behavior b
        INNER JOIN [dbo].[search_term] t
            ON t.id = b.term_id
        LEFT JOIN content_support cs
            ON cs.normalized_term = t.normalized_term
           AND cs.term_type = t.term_type
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

/*
    Validation queries

    EXEC [dbo].[sp_refresh_policy_term_candidate];
    EXEC [dbo].[sp_promote_policy_term_candidate_to_search_term] @min_quality_score = 2.0, @min_policy_count = 1;
    EXEC [dbo].[sp_rebuild_policy_term_hot_stat] @start_date = '2026-04-01', @end_date = '2026-05-15';

    SELECT TOP (50)
        term, term_type, source_kind, policy_count, content_score, quality_score, status
    FROM [dbo].[search_policy_term_candidate]
    ORDER BY quality_score DESC, policy_count DESC, term ASC;

    SELECT TOP (50)
        t.term,
        t.term_type,
        s.search_count,
        s.trend_score,
        s.content_match_count,
        s.final_hot_score,
        s.stat_date
    FROM [dbo].[search_term_stat_daily] s
    INNER JOIN [dbo].[search_term] t
        ON t.id = s.term_id
    ORDER BY s.final_hot_score DESC, s.search_count DESC;
*/
