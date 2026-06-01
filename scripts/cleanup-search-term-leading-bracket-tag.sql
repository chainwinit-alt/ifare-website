/*
    One-time cleanup for leading county/city tags like:
    【台北市】就業服務

    Behavior:
    1. For policy_title rows, remove leading 【...】 tag
    2. If multiple rows become the same normalized_term + term_type after cleanup,
       keep one row and delete the rest
    3. Before deleting duplicate search_term rows, delete dependent rows in search_term_source
    4. Apply the same cleanup to search_policy_term_candidate
*/

USE [iFare];
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID('tempdb..#search_term_dedup') IS NOT NULL
    DROP TABLE #search_term_dedup;
GO

;WITH prepared AS
(
    SELECT
        t.id,
        t.term_type,
        CASE
            WHEN LEFT(LTRIM(RTRIM(t.term)), 1) = N'【'
                 AND CHARINDEX(N'】', LTRIM(RTRIM(t.term))) > 1
            THEN LTRIM(SUBSTRING(
                LTRIM(RTRIM(t.term)),
                CHARINDEX(N'】', LTRIM(RTRIM(t.term))) + 1,
                200
            ))
            ELSE LTRIM(RTRIM(t.term))
        END AS cleaned_term
    FROM [dbo].[search_term] t
    WHERE t.term_type = N'policy_title'
),
ranked AS
(
    SELECT
        p.id AS delete_id,
        MIN(p.id) OVER
        (
            PARTITION BY
                LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(p.cleaned_term)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')),
                p.term_type
        ) AS keep_id,
        p.cleaned_term,
        LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(p.cleaned_term)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')) AS cleaned_normalized_term,
        ROW_NUMBER() OVER
        (
            PARTITION BY
                LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(p.cleaned_term)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')),
                p.term_type
            ORDER BY p.id
        ) AS rn
    FROM prepared p
)
SELECT
    delete_id,
    keep_id,
    cleaned_term,
    cleaned_normalized_term
INTO #search_term_dedup
FROM ranked
WHERE rn > 1;
GO

DELETE src
FROM [dbo].[search_term_source] src
INNER JOIN #search_term_dedup d
    ON d.delete_id = src.term_id;
GO

DELETE t
FROM [dbo].[search_term] t
INNER JOIN #search_term_dedup d
    ON d.delete_id = t.id;
GO

;WITH prepared AS
(
    SELECT
        t.id,
        CASE
            WHEN LEFT(LTRIM(RTRIM(t.term)), 1) = N'【'
                 AND CHARINDEX(N'】', LTRIM(RTRIM(t.term))) > 1
            THEN LTRIM(SUBSTRING(
                LTRIM(RTRIM(t.term)),
                CHARINDEX(N'】', LTRIM(RTRIM(t.term))) + 1,
                200
            ))
            ELSE LTRIM(RTRIM(t.term))
        END AS cleaned_term
    FROM [dbo].[search_term] t
    WHERE t.term_type = N'policy_title'
)
UPDATE t
SET
    t.term = p.cleaned_term,
    t.display_term = p.cleaned_term,
    t.normalized_term = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(p.cleaned_term)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')),
    t.updated_at = SYSUTCDATETIME()
FROM [dbo].[search_term] t
INNER JOIN prepared p
    ON p.id = t.id
WHERE t.term_type = N'policy_title';
GO

IF OBJECT_ID('tempdb..#candidate_dedup') IS NOT NULL
    DROP TABLE #candidate_dedup;
GO

;WITH prepared AS
(
    SELECT
        c.id,
        c.term_type,
        CASE
            WHEN LEFT(LTRIM(RTRIM(c.term)), 1) = N'【'
                 AND CHARINDEX(N'】', LTRIM(RTRIM(c.term))) > 1
            THEN LTRIM(SUBSTRING(
                LTRIM(RTRIM(c.term)),
                CHARINDEX(N'】', LTRIM(RTRIM(c.term))) + 1,
                200
            ))
            ELSE LTRIM(RTRIM(c.term))
        END AS cleaned_term
    FROM [dbo].[search_policy_term_candidate] c
    WHERE c.term_type = N'policy_title'
),
ranked AS
(
    SELECT
        p.id,
        ROW_NUMBER() OVER
        (
            PARTITION BY
                LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(p.cleaned_term)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')),
                p.term_type
            ORDER BY p.id
        ) AS rn
    FROM prepared p
)
SELECT id
INTO #candidate_dedup
FROM ranked
WHERE rn > 1;
GO

DELETE c
FROM [dbo].[search_policy_term_candidate] c
INNER JOIN #candidate_dedup d
    ON d.id = c.id;
GO

;WITH prepared AS
(
    SELECT
        c.id,
        CASE
            WHEN LEFT(LTRIM(RTRIM(c.term)), 1) = N'【'
                 AND CHARINDEX(N'】', LTRIM(RTRIM(c.term))) > 1
            THEN LTRIM(SUBSTRING(
                LTRIM(RTRIM(c.term)),
                CHARINDEX(N'】', LTRIM(RTRIM(c.term))) + 1,
                200
            ))
            ELSE LTRIM(RTRIM(c.term))
        END AS cleaned_term
    FROM [dbo].[search_policy_term_candidate] c
    WHERE c.term_type = N'policy_title'
)
UPDATE c
SET
    c.term = p.cleaned_term,
    c.display_term = p.cleaned_term,
    c.normalized_term = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(p.cleaned_term)), N' ', N''), N'-', N''), N'_', N''), N'　', N'')),
    c.updated_at = SYSUTCDATETIME()
FROM [dbo].[search_policy_term_candidate] c
INNER JOIN prepared p
    ON p.id = c.id
WHERE c.term_type = N'policy_title';
GO

DROP TABLE IF EXISTS #search_term_dedup;
DROP TABLE IF EXISTS #candidate_dedup;
GO

SELECT TOP (100)
    id,
    term,
    normalized_term,
    term_type,
    source_kind,
    updated_at
FROM [dbo].[search_term]
WHERE term_type = N'policy_title'
ORDER BY updated_at DESC, id DESC;
GO
