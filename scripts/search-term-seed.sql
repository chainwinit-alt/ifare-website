USE [IFare];
GO

SET NOCOUNT ON;
GO

/*
    Purpose:
    1. Seed [search_term] from existing IFare business tables
    2. Seed [search_term_source] with traceable source mappings
    3. Generate synthetic [search_term_stat_daily] rows from existing policy relations

    Notes:
    - This script does not hardcode term text.
    - It pulls terms from IFarePolicy / CodeKeyword / CodeRecipient / CodeIdentity / CodeIncome / CodePolicy.
    - It uses simple SQL normalization so autocomplete can start working immediately.
*/

DECLARE @today DATE = CAST(GETDATE() AS DATE);

;WITH valid_policy AS (
    SELECT
        p.ID,
        p.Title,
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
source_terms AS (
    SELECT
        CAST(p.ID AS NVARCHAR(100)) AS source_ref_id,
        N'ifare_policy' AS source_kind,
        N'policy_title' AS term_type,
        p.Title AS term,
        p.Title AS display_term,
        CAST(1.2000 AS DECIMAL(10,4)) AS base_weight
    FROM valid_policy p
    WHERE NULLIF(LTRIM(RTRIM(p.Title)), N'') IS NOT NULL

    UNION ALL

    SELECT
        CAST(k.ID AS NVARCHAR(100)) AS source_ref_id,
        N'code_keyword' AS source_kind,
        N'keyword' AS term_type,
        k.LabelName AS term,
        k.LabelName AS display_term,
        CAST(1.1000 AS DECIMAL(10,4)) AS base_weight
    FROM [dbo].[CodeKeyword] k
    WHERE
        k.State NOT IN (N'Disabled', N'Delete')
        AND NULLIF(LTRIM(RTRIM(k.LabelName)), N'') IS NOT NULL

    UNION ALL

    SELECT
        CAST(r.ID AS NVARCHAR(100)) AS source_ref_id,
        N'code_recipient' AS source_kind,
        N'recipient' AS term_type,
        r.LabelName AS term,
        r.LabelName AS display_term,
        CAST(1.0000 AS DECIMAL(10,4)) AS base_weight
    FROM [dbo].[CodeRecipient] r
    WHERE
        r.State NOT IN (N'Disabled', N'Delete')
        AND NULLIF(LTRIM(RTRIM(r.LabelName)), N'') IS NOT NULL

    UNION ALL

    SELECT
        CAST(i.ID AS NVARCHAR(100)) AS source_ref_id,
        N'code_identity' AS source_kind,
        N'identity' AS term_type,
        i.LabelName AS term,
        i.LabelName AS display_term,
        CAST(0.9500 AS DECIMAL(10,4)) AS base_weight
    FROM [dbo].[CodeIdentity] i
    WHERE
        i.State NOT IN (N'Disabled', N'Delete')
        AND NULLIF(LTRIM(RTRIM(i.LabelName)), N'') IS NOT NULL

    UNION ALL

    SELECT
        CAST(i.ID AS NVARCHAR(100)) AS source_ref_id,
        N'code_income' AS source_kind,
        N'income' AS term_type,
        i.LabelName AS term,
        i.LabelName AS display_term,
        CAST(0.9000 AS DECIMAL(10,4)) AS base_weight
    FROM [dbo].[CodeIncome] i
    WHERE
        i.State NOT IN (N'Disabled', N'Delete')
        AND NULLIF(LTRIM(RTRIM(i.LabelName)), N'') IS NOT NULL

    UNION ALL

    SELECT
        CAST(p.ID AS NVARCHAR(100)) AS source_ref_id,
        N'code_policy' AS source_kind,
        N'policy' AS term_type,
        p.LabelName AS term,
        p.LabelName AS display_term,
        CAST(1.0500 AS DECIMAL(10,4)) AS base_weight
    FROM [dbo].[CodePolicy] p
    WHERE
        p.State NOT IN (N'Disabled', N'Delete')
        AND NULLIF(LTRIM(RTRIM(p.LabelName)), N'') IS NOT NULL
),
normalized_terms AS (
    SELECT DISTINCT
        term,
        display_term,
        term_type,
        source_kind,
        source_ref_id,
        base_weight,
        LOWER(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(LTRIM(RTRIM(term)), N'　', N''),
                        N' ', N''),
                    N'-', N''),
                N'_', N''),
            N'／', N'/')
        ) AS normalized_term
    FROM source_terms
),
ranked_terms AS (
    SELECT
        term,
        normalized_term,
        display_term,
        term_type,
        source_kind,
        source_ref_id,
        base_weight,
        ROW_NUMBER() OVER (
            PARTITION BY normalized_term, term_type
            ORDER BY
                base_weight DESC,
                CASE source_kind
                    WHEN N'ifare_policy' THEN 1
                    WHEN N'code_keyword' THEN 2
                    WHEN N'code_policy' THEN 3
                    WHEN N'code_recipient' THEN 4
                    WHEN N'code_identity' THEN 5
                    WHEN N'code_income' THEN 6
                    ELSE 99
                END,
                source_ref_id
        ) AS rn
    FROM normalized_terms
)
MERGE [dbo].[search_term] AS target
USING (
    SELECT
        term,
        normalized_term,
        display_term,
        term_type,
        source_kind,
        source_ref_id,
        base_weight
    FROM ranked_terms
    WHERE rn = 1
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
    INSERT (
        term,
        normalized_term,
        display_term,
        term_type,
        status,
        language,
        base_weight,
        manual_boost,
        source_kind,
        source_ref_id,
        created_at,
        updated_at
    )
    VALUES (
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
GO

DECLARE @today DATE = CAST(GETDATE() AS DATE);

;WITH source_terms AS (
    SELECT
        term.id AS term_id,
        term.source_kind,
        term.source_ref_id
    FROM [dbo].[search_term] term
    WHERE
        term.status = N'active'
        AND term.source_kind IN (
            N'ifare_policy',
            N'code_keyword',
            N'code_recipient',
            N'code_identity',
            N'code_income',
            N'code_policy'
        )
        AND NULLIF(term.source_ref_id, N'') IS NOT NULL
)
MERGE [dbo].[search_term_source] AS target
USING (
    SELECT
        term_id,
        source_kind,
        source_ref_id AS source_ref,
        CAST(1.0000 AS DECIMAL(10,4)) AS source_score
    FROM source_terms
) AS src
ON target.term_id = src.term_id
AND target.source_kind = src.source_kind
AND ISNULL(target.source_ref, N'') = ISNULL(src.source_ref, N'')
WHEN MATCHED THEN
    UPDATE SET
        target.source_score = src.source_score
WHEN NOT MATCHED THEN
    INSERT (
        term_id,
        source_kind,
        source_ref,
        source_score,
        created_at
    )
    VALUES (
        src.term_id,
        src.source_kind,
        src.source_ref,
        src.source_score,
        SYSUTCDATETIME()
    );
GO

DECLARE @today DATE = CAST(GETDATE() AS DATE);

;WITH valid_policy AS (
    SELECT
        p.ID,
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
term_usage AS (
    SELECT
        term.id AS term_id,
        COUNT(DISTINCT policy.ID) AS related_policy_count
    FROM [dbo].[search_term] term
    INNER JOIN valid_policy policy
        ON term.term_type = N'policy_title'
        AND term.source_kind = N'ifare_policy'
        AND term.source_ref_id = CAST(policy.ID AS NVARCHAR(100))
    GROUP BY term.id

    UNION ALL

    SELECT
        term.id AS term_id,
        COUNT(DISTINCT map.IFarePolicy_ID) AS related_policy_count
    FROM [dbo].[search_term] term
    INNER JOIN [dbo].[IFarePolicy_CodeKeyword] map
        ON term.term_type = N'keyword'
        AND term.source_kind = N'code_keyword'
        AND term.source_ref_id = CAST(map.CodeKeyword_ID AS NVARCHAR(100))
    INNER JOIN valid_policy policy
        ON policy.ID = map.IFarePolicy_ID
    GROUP BY term.id

    UNION ALL

    SELECT
        term.id AS term_id,
        COUNT(DISTINCT map.IFarePolicy_ID) AS related_policy_count
    FROM [dbo].[search_term] term
    INNER JOIN [dbo].[IFarePolicy_CodeRecipient] map
        ON term.term_type = N'recipient'
        AND term.source_kind = N'code_recipient'
        AND term.source_ref_id = CAST(map.CodeRecipient_ID AS NVARCHAR(100))
    INNER JOIN valid_policy policy
        ON policy.ID = map.IFarePolicy_ID
    GROUP BY term.id

    UNION ALL

    SELECT
        term.id AS term_id,
        COUNT(DISTINCT map.IFarePolicy_ID) AS related_policy_count
    FROM [dbo].[search_term] term
    INNER JOIN [dbo].[IFarePolicy_CodeIdentity] map
        ON term.term_type = N'identity'
        AND term.source_kind = N'code_identity'
        AND term.source_ref_id = CAST(map.CodeIdentity_ID AS NVARCHAR(100))
    INNER JOIN valid_policy policy
        ON policy.ID = map.IFarePolicy_ID
    GROUP BY term.id

    UNION ALL

    SELECT
        term.id AS term_id,
        COUNT(DISTINCT map.IFarePolicy_ID) AS related_policy_count
    FROM [dbo].[search_term] term
    INNER JOIN [dbo].[IFarePolicy_CodeIncome] map
        ON term.term_type = N'income'
        AND term.source_kind = N'code_income'
        AND term.source_ref_id = CAST(map.CodeIncome_ID AS NVARCHAR(100))
    INNER JOIN valid_policy policy
        ON policy.ID = map.IFarePolicy_ID
    GROUP BY term.id

    UNION ALL

    SELECT
        term.id AS term_id,
        COUNT(DISTINCT policy.ID) AS related_policy_count
    FROM [dbo].[search_term] term
    INNER JOIN valid_policy policy
        ON term.term_type = N'policy'
        AND term.source_kind = N'code_policy'
        AND term.source_ref_id = CAST(policy.CodePolicy_ID AS NVARCHAR(100))
    GROUP BY term.id
),
aggregated_usage AS (
    SELECT
        term_id,
        SUM(related_policy_count) AS related_policy_count
    FROM term_usage
    GROUP BY term_id
),
stat_seed AS (
    SELECT
        term.id AS term_id,
        @today AS stat_date,
        CAST(CASE WHEN usage.related_policy_count IS NULL OR usage.related_policy_count <= 0 THEN 1 ELSE usage.related_policy_count END AS INT) AS result_count,
        CAST(CASE WHEN usage.related_policy_count IS NULL OR usage.related_policy_count <= 0 THEN 1 ELSE usage.related_policy_count * 4 END AS INT) AS search_count,
        CAST(CASE WHEN usage.related_policy_count IS NULL OR usage.related_policy_count <= 0 THEN 1 ELSE usage.related_policy_count * 3 END AS INT) AS select_count,
        0 AS zero_result_count,
        CAST(
            (CASE WHEN usage.related_policy_count IS NULL OR usage.related_policy_count <= 0 THEN 1 ELSE usage.related_policy_count * 4 END) * 0.6 +
            (CASE WHEN usage.related_policy_count IS NULL OR usage.related_policy_count <= 0 THEN 1 ELSE usage.related_policy_count * 3 END) * 0.4 +
            (term.base_weight * 10.0) +
            (term.manual_boost * 10.0)
            AS DECIMAL(12,4)
        ) AS trend_score
    FROM [dbo].[search_term] term
    LEFT JOIN aggregated_usage usage
        ON usage.term_id = term.id
    WHERE term.status = N'active'
)
MERGE [dbo].[search_term_stat_daily] AS target
USING stat_seed AS src
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

DECLARE @today DATE = CAST(GETDATE() AS DATE);

SELECT TOP (20)
    term.id,
    term.term,
    term.term_type,
    term.source_kind,
    stat.search_count,
    stat.select_count,
    stat.result_count,
    stat.trend_score
FROM [dbo].[search_term] term
LEFT JOIN [dbo].[search_term_stat_daily] stat
    ON stat.term_id = term.id
    AND stat.stat_date = @today
WHERE term.status = N'active'
ORDER BY
    stat.trend_score DESC,
    stat.search_count DESC,
    term.term ASC;
GO
