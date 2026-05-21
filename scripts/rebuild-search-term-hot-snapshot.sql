/*
    Rebuild hot keyword daily history for iFare search.

    Purpose:
    - Recompute dbo.search_term_stat_daily for the requested date range
    - Use recent search_query_log behavior plus policy/content support
    - Keep recent daily history so 7-day / 30-day scoring can aggregate correctly

    Recommended usage:
    - Run by SQL Agent every 5 to 15 minutes
    - Or run manually after importing search terms / trend data

    Notes:
    - dbo.sp_rebuild_policy_term_hot_stat updates only the requested date range
      and preserves external trend values already merged into dbo.search_term_stat_daily
*/

USE [iFare];
GO

SET NOCOUNT ON;
GO

DECLARE @end_date DATE = CAST(GETUTCDATE() AS DATE);
DECLARE @start_date DATE = DATEADD(DAY, -30, @end_date);

EXEC [dbo].[sp_rebuild_policy_term_hot_stat]
    @start_date = @start_date,
    @end_date = @end_date;
GO

/*
    Validation
*/

SELECT TOP (50)
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
FROM [dbo].[search_term_stat_daily] s
INNER JOIN [dbo].[search_term] t
    ON t.id = s.term_id
WHERE t.status = N'active'
ORDER BY
    s.final_hot_score DESC,
    s.search_count DESC,
    t.term ASC;
GO
