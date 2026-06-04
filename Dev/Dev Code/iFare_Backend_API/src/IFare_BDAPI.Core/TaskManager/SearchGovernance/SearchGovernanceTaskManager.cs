using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.SearchGovernance.ValueModel;
using Microsoft.Data.SqlClient;

namespace IFare_BDAPI.TaskManager.SearchGovernance
{
    public class SearchGovernanceTaskManager : ISearchGovernanceTaskManager
    {
        private static readonly string[] ManagedSourceKinds =
        {
            "ifare_policy",
            "code_keyword",
            "code_recipient",
            "code_identity",
            "code_income",
            "code_policy"
        };

        private static readonly Dictionary<string, int> SourcePriority = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ifare_policy"] = 1,
            ["code_keyword"] = 2,
            ["code_policy"] = 3,
            ["code_recipient"] = 4,
            ["code_identity"] = 5,
            ["code_income"] = 6,
        };

        private readonly ICommonToolsManager _commonTools;

        public SearchGovernanceTaskManager(ICommonToolsManager commonTools)
        {
            _commonTools = commonTools;
        }

        public SearchGovernanceDashboardResult GetDashboard(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return new SearchGovernanceDashboardResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "IFare connection string is missing."),
                    null);
            }

            try
            {
                using var connection = new SqlConnection(connectionString);
                connection.Open();

                var dashboard = new SearchGovernanceDashboardData
                {
                    OverviewStats = BuildOverviewStats(connection),
                    TrendPoints = BuildTrendPoints(connection),
                    QueueItems = BuildQueueItems(connection),
                    TopTerms = BuildTopTerms(connection)
                };

                return new SearchGovernanceDashboardResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), dashboard);
            }
            catch
            {
                return new SearchGovernanceDashboardResult(
                    _commonTools.GetErrorInfo_API(ErrAPI.Code_Success),
                    new SearchGovernanceDashboardData());
            }
        }

        public SearchGovernanceTermResult GetTerms(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return new SearchGovernanceTermResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "IFare connection string is missing."),
                    null);
            }

            try
            {
                using var connection = new SqlConnection(connectionString);
                connection.Open();

                var list = BuildTermList(connection, limit: 200);
                return new SearchGovernanceTermResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
            }
            catch
            {
                return new SearchGovernanceTermResult(
                    _commonTools.GetErrorInfo_API(ErrAPI.Code_Success),
                    new List<SearchGovernanceTermData>());
            }
        }

        public SearchGovernanceAliasResult GetAliases(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return new SearchGovernanceAliasResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "IFare connection string is missing."),
                    null);
            }

            try
            {
                using var connection = new SqlConnection(connectionString);
                connection.Open();

                var list = BuildAliasList(connection, limit: 200);
                return new SearchGovernanceAliasResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
            }
            catch
            {
                return new SearchGovernanceAliasResult(
                    _commonTools.GetErrorInfo_API(ErrAPI.Code_Success),
                    new List<SearchGovernanceAliasData>());
            }
        }

        public SearchGovernanceTermItemResult CreateTerm(string connectionString, SearchGovernanceTermCreateData createData)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return new SearchGovernanceTermItemResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "IFare connection string is missing."),
                    null);
            }

            if (createData == null || string.IsNullOrWhiteSpace(createData.DisplayTerm))
            {
                return new SearchGovernanceTermItemResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, "Search term payload is invalid."),
                    null);
            }

            using var connection = new SqlConnection(connectionString);
            connection.Open();

            var normalizedTerm = NormalizeSearchText(createData.DisplayTerm);
            using var command = connection.CreateCommand();
            command.CommandText = @"
INSERT INTO [dbo].[search_term]
(
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
VALUES
(
    @term,
    @normalizedTerm,
    @displayTerm,
    @termType,
    @status,
    N'zh-TW',
    @baseWeight,
    @manualBoost,
    @sourceKind,
    NULL,
    SYSUTCDATETIME(),
    SYSUTCDATETIME()
);
SELECT CAST(SCOPE_IDENTITY() AS BIGINT);";
            command.Parameters.AddWithValue("@term", normalizedTerm);
            command.Parameters.AddWithValue("@normalizedTerm", normalizedTerm);
            command.Parameters.AddWithValue("@displayTerm", createData.DisplayTerm.Trim());
            command.Parameters.AddWithValue("@termType", (object)(createData.TermType?.Trim() ?? "keyword"));
            command.Parameters.AddWithValue("@status", (object)(createData.Status?.Trim().ToLowerInvariant() ?? "active"));
            command.Parameters.AddWithValue("@baseWeight", createData.BaseWeight <= 0 ? 1 : createData.BaseWeight);
            command.Parameters.AddWithValue("@manualBoost", createData.ManualBoost);
            command.Parameters.AddWithValue("@sourceKind", (object)(createData.SourceKind?.Trim() ?? "manual"));

            var newId = Convert.ToInt64(command.ExecuteScalar(), CultureInfo.InvariantCulture);
            var createdItem = GetTermById(connection, newId);
            return new SearchGovernanceTermItemResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success_Create), createdItem);
        }

        public SearchGovernanceTermItemResult UpdateTerm(string connectionString, SearchGovernanceTermUpdateData updateData)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return new SearchGovernanceTermItemResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "IFare connection string is missing."),
                    null);
            }

            if (updateData == null || updateData.Id <= 0 || string.IsNullOrWhiteSpace(updateData.Status))
            {
                return new SearchGovernanceTermItemResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, "Search term payload is invalid."),
                    null);
            }

            using var connection = new SqlConnection(connectionString);
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = @"
UPDATE [dbo].[search_term]
SET
    display_term = @displayTerm,
    term = @term,
    normalized_term = @normalizedTerm,
    term_type = @termType,
    source_kind = @sourceKind,
    status = @status,
    manual_boost = @manualBoost,
    base_weight = @baseWeight,
    updated_at = SYSUTCDATETIME()
WHERE id = @id;";
            var normalizedTerm = NormalizeSearchText(updateData.DisplayTerm);
            command.Parameters.AddWithValue("@id", updateData.Id);
            command.Parameters.AddWithValue("@displayTerm", (object)(updateData.DisplayTerm?.Trim() ?? string.Empty));
            command.Parameters.AddWithValue("@term", normalizedTerm);
            command.Parameters.AddWithValue("@normalizedTerm", normalizedTerm);
            command.Parameters.AddWithValue("@termType", (object)(updateData.TermType?.Trim() ?? string.Empty));
            command.Parameters.AddWithValue("@sourceKind", (object)(updateData.SourceKind?.Trim() ?? string.Empty));
            command.Parameters.AddWithValue("@status", updateData.Status.Trim().ToLowerInvariant());
            command.Parameters.AddWithValue("@manualBoost", updateData.ManualBoost);
            command.Parameters.AddWithValue("@baseWeight", updateData.BaseWeight);

            var affected = command.ExecuteNonQuery();
            if (affected <= 0)
            {
                return new SearchGovernanceTermItemResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail_Update, "Search term not found."),
                    null);
            }

            var updatedItem = GetTermById(connection, updateData.Id);
            return new SearchGovernanceTermItemResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success_Update), updatedItem);
        }

        public SearchGovernanceAliasItemResult CreateAlias(string connectionString, SearchGovernanceAliasCreateData createData)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return new SearchGovernanceAliasItemResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "IFare connection string is missing."),
                    null);
            }

            if (createData == null || createData.TermId <= 0 || string.IsNullOrWhiteSpace(createData.Alias))
            {
                return new SearchGovernanceAliasItemResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, "Search alias payload is invalid."),
                    null);
            }

            using var connection = new SqlConnection(connectionString);
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = @"
INSERT INTO [dbo].[search_term_alias]
(
    term_id,
    alias,
    normalized_alias,
    alias_type,
    status,
    created_at,
    updated_at
)
VALUES
(
    @termId,
    @alias,
    @normalizedAlias,
    @aliasType,
    @status,
    SYSUTCDATETIME(),
    SYSUTCDATETIME()
);
SELECT CAST(SCOPE_IDENTITY() AS BIGINT);";
            command.Parameters.AddWithValue("@termId", createData.TermId);
            command.Parameters.AddWithValue("@alias", createData.Alias.Trim());
            command.Parameters.AddWithValue("@normalizedAlias", NormalizeSearchText(createData.Alias));
            command.Parameters.AddWithValue("@aliasType", NormalizeAliasType(createData.MatchMode));
            command.Parameters.AddWithValue("@status", (object)(createData.Status?.Trim().ToLowerInvariant() ?? "active"));

            var newId = Convert.ToInt64(command.ExecuteScalar(), CultureInfo.InvariantCulture);
            var createdItem = GetAliasById(connection, newId);
            return new SearchGovernanceAliasItemResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success_Create), createdItem);
        }

        public SearchGovernanceAliasItemResult UpdateAlias(string connectionString, SearchGovernanceAliasUpdateData updateData)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return new SearchGovernanceAliasItemResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "IFare connection string is missing."),
                    null);
            }

            if (updateData == null || updateData.Id <= 0 || updateData.TermId <= 0 || string.IsNullOrWhiteSpace(updateData.Alias))
            {
                return new SearchGovernanceAliasItemResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, "Search alias payload is invalid."),
                    null);
            }

            using var connection = new SqlConnection(connectionString);
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = @"
UPDATE [dbo].[search_term_alias]
SET
    term_id = @termId,
    alias = @alias,
    normalized_alias = @normalizedAlias,
    alias_type = @aliasType,
    status = @status,
    updated_at = SYSUTCDATETIME()
WHERE id = @id;";
            command.Parameters.AddWithValue("@id", updateData.Id);
            command.Parameters.AddWithValue("@termId", updateData.TermId);
            command.Parameters.AddWithValue("@alias", updateData.Alias.Trim());
            command.Parameters.AddWithValue("@normalizedAlias", NormalizeSearchText(updateData.Alias));
            command.Parameters.AddWithValue("@aliasType", NormalizeAliasType(updateData.MatchMode));
            command.Parameters.AddWithValue("@status", (object)(updateData.Status?.Trim().ToLowerInvariant() ?? "active"));

            var affected = command.ExecuteNonQuery();
            if (affected <= 0)
            {
                return new SearchGovernanceAliasItemResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail_Update, "Search alias not found."),
                    null);
            }

            var updatedItem = GetAliasById(connection, updateData.Id);
            return new SearchGovernanceAliasItemResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success_Update), updatedItem);
        }

        public SearchGovernanceRefreshHotStatsResult RefreshHotStats(string connectionString, SearchGovernanceRefreshHotStatsInputData inputData)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return new SearchGovernanceRefreshHotStatsResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "IFare connection string is missing."),
                    null);
            }

            var windowDays = Math.Max(1, inputData?.WindowDays ?? 30);
            var endDate = DateTime.UtcNow.Date;
            var startDate = endDate.AddDays(-(windowDays - 1));

            using var connection = new SqlConnection(connectionString);
            connection.Open();

            using (var command = connection.CreateCommand())
            {
                command.CommandType = CommandType.StoredProcedure;
                command.CommandText = "[dbo].[sp_rebuild_policy_term_hot_stat]";
                command.Parameters.Add("@start_date", SqlDbType.Date).Value = startDate;
                command.Parameters.Add("@end_date", SqlDbType.Date).Value = endDate;
                command.CommandTimeout = 300;
                command.ExecuteNonQuery();
            }

            var rowCount = GetScalarInt(connection, "SELECT COUNT(*) FROM [dbo].[search_term_stat_daily];");
            var lastUpdatedAt = GetScalarString(connection, @"
SELECT CONVERT(NVARCHAR(19), MAX(updated_at), 120)
FROM [dbo].[search_term_stat_daily];");

            return new SearchGovernanceRefreshHotStatsResult(
                _commonTools.GetErrorInfo_API(ErrAPI.Code_Success_Update),
                new SearchGovernanceRefreshHotStatsData
                {
                    StartDate = startDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    EndDate = endDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    WindowDays = windowDays,
                    RowCount = rowCount,
                    LastUpdatedAt = lastUpdatedAt
                });
        }

        public SearchGovernanceSyncTermsResult SyncTerms(string connectionString, SearchGovernanceSyncTermsInputData inputData)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return new SearchGovernanceSyncTermsResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "IFare connection string is missing."),
                    null);
            }

            using var connection = new SqlConnection(connectionString);
            connection.Open();

            var sourceTerms = FetchSourceTerms(connection);
            var finalTerms = DeduplicateSourceTerms(sourceTerms);
            ApplySearchTermSync(connection, finalTerms, inputData?.PruneMissing == true);

            return new SearchGovernanceSyncTermsResult(
                _commonTools.GetErrorInfo_API(ErrAPI.Code_Success_Update),
                new SearchGovernanceSyncTermsData
                {
                    SourceTermCount = sourceTerms.Count,
                    FinalTermCount = finalTerms.Count,
                    PruneMissing = inputData?.PruneMissing == true,
                    SyncedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)
                });
        }

        private List<SearchGovernanceOverviewStatData> BuildOverviewStats(SqlConnection connection)
        {
            var stats = new List<SearchGovernanceOverviewStatData>();

            var searchCount30d = GetScalarInt(connection, @"
SELECT COUNT(1)
FROM [dbo].[search_query_log]
WHERE created_at >= DATEADD(DAY, -30, SYSUTCDATETIME());");

            var searchCountPrev30d = GetScalarInt(connection, @"
SELECT COUNT(1)
FROM [dbo].[search_query_log]
WHERE created_at >= DATEADD(DAY, -60, SYSUTCDATETIME())
  AND created_at < DATEADD(DAY, -30, SYSUTCDATETIME());");

            var zeroResult30d = GetScalarInt(connection, @"
SELECT COUNT(1)
FROM [dbo].[search_query_log]
WHERE created_at >= DATEADD(DAY, -30, SYSUTCDATETIME())
  AND result_count = 0;");

            var zeroResultPrev30d = GetScalarInt(connection, @"
SELECT COUNT(1)
FROM [dbo].[search_query_log]
WHERE created_at >= DATEADD(DAY, -60, SYSUTCDATETIME())
  AND created_at < DATEADD(DAY, -30, SYSUTCDATETIME())
  AND result_count = 0;");

            var managedTerms = GetScalarInt(connection, @"
SELECT COUNT(1)
FROM [dbo].[search_term]
WHERE status = N'active';");

            var pendingActions = GetScalarInt(connection, @"
SELECT COUNT(1)
FROM (
    SELECT normalized_query
    FROM [dbo].[search_query_log]
    WHERE created_at >= DATEADD(DAY, -7, SYSUTCDATETIME())
      AND ISNULL(normalized_query, N'') <> N''
    GROUP BY normalized_query
    HAVING SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) > 0
) queue;");

            stats.Add(new SearchGovernanceOverviewStatData
            {
                Key = "searches",
                Label = "30日搜尋數",
                Value = searchCount30d.ToString("N0", CultureInfo.InvariantCulture),
                Delta = FormatDelta(searchCount30d, searchCountPrev30d),
                Tone = GetDeltaTone(searchCount30d, searchCountPrev30d, inverse: false)
            });
            stats.Add(new SearchGovernanceOverviewStatData
            {
                Key = "zero-result",
                Label = "零結果查詢",
                Value = zeroResult30d.ToString("N0", CultureInfo.InvariantCulture),
                Delta = FormatDelta(zeroResult30d, zeroResultPrev30d),
                Tone = GetDeltaTone(zeroResult30d, zeroResultPrev30d, inverse: true)
            });
            stats.Add(new SearchGovernanceOverviewStatData
            {
                Key = "hot-terms",
                Label = "啟用中搜尋詞筆數",
                Value = managedTerms.ToString("N0", CultureInfo.InvariantCulture),
                Delta = $"{managedTerms} 筆啟用中",
                Tone = "default"
            });
            stats.Add(new SearchGovernanceOverviewStatData
            {
                Key = "pending",
                Label = "待處理項目",
                Value = pendingActions.ToString("N0", CultureInfo.InvariantCulture),
                Delta = "待人工檢查",
                Tone = pendingActions > 0 ? "warning" : "success"
            });

            return stats;
        }

        private List<SearchGovernanceTrendPointData> BuildTrendPoints(SqlConnection connection)
        {
            var points = new List<SearchGovernanceTrendPointData>();

            using var command = connection.CreateCommand();
            command.CommandText = @"
WITH last_7_days AS (
    SELECT CAST(DATEADD(DAY, -offset_day, CAST(SYSUTCDATETIME() AS DATE)) AS DATE) AS stat_date
    FROM (VALUES (6),(5),(4),(3),(2),(1),(0)) v(offset_day)
)
SELECT
    day_item.stat_date,
    COUNT(log_item.normalized_query) AS total_count
FROM last_7_days day_item
LEFT JOIN [dbo].[search_query_log] log_item
    ON CAST(log_item.created_at AS DATE) = day_item.stat_date
GROUP BY day_item.stat_date
ORDER BY day_item.stat_date ASC;";

            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                var date = reader.GetDateTime(0);
                var value = reader.IsDBNull(1) ? 0 : reader.GetInt32(1);

                points.Add(new SearchGovernanceTrendPointData
                {
                    Label = date.ToString("MM/dd", CultureInfo.InvariantCulture),
                    Value = value
                });
            }

            return points;
        }

        private List<SearchGovernanceQueueItemData> BuildQueueItems(SqlConnection connection)
        {
            var queue = new List<SearchGovernanceQueueItemData>();

            using var command = connection.CreateCommand();
            command.CommandText = @"
WITH query_stats AS (
    SELECT
        COALESCE(NULLIF(normalized_query, N''), normalized_query) AS normalized_query,
        MAX(NULLIF(query_text, N'')) AS sample_query,
        COUNT(1) AS searches_7d,
        MIN(result_count) AS min_result_count,
        SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS zero_result_hits
    FROM [dbo].[search_query_log]
    WHERE created_at >= DATEADD(DAY, -7, SYSUTCDATETIME())
      AND ISNULL(normalized_query, N'') <> N''
    GROUP BY normalized_query
)
SELECT TOP (10)
    normalized_query,
    sample_query,
    searches_7d,
    min_result_count,
    zero_result_hits
FROM query_stats
WHERE zero_result_hits > 0 OR min_result_count <= 2
ORDER BY zero_result_hits DESC, searches_7d DESC, normalized_query ASC;";

            using var reader = command.ExecuteReader();
            var index = 1;
            while (reader.Read())
            {
                var normalizedQuery = reader.IsDBNull(0) ? string.Empty : reader.GetString(0);
                var query = reader.IsDBNull(1) ? normalizedQuery : reader.GetString(1);
                var searches7d = reader.IsDBNull(2) ? 0 : reader.GetInt32(2);
                var resultCount = reader.IsDBNull(3) ? 0 : reader.GetInt32(3);
                var zeroResultHits = reader.IsDBNull(4) ? 0 : reader.GetInt32(4);

                queue.Add(new SearchGovernanceQueueItemData
                {
                    Id = $"Q-{index:000}",
                    Query = query,
                    Status = resultCount == 0 ? "pending" : "reviewing",
                    Searches7d = searches7d,
                    ResultCount = resultCount,
                    Suggestion = BuildQueueSuggestion(resultCount, zeroResultHits),
                    Owner = "搜尋維運"
                });

                index += 1;
            }

            return queue;
        }

        private List<SearchGovernanceTermData> BuildTopTerms(SqlConnection connection)
        {
            return BuildTermList(connection, 3);
        }

        private List<SearchGovernanceTermData> BuildTermList(SqlConnection connection, int limit)
        {
            var list = new List<SearchGovernanceTermData>();

            using var command = connection.CreateCommand();
            command.CommandText = @"
WITH alias_counts AS (
    SELECT term_id, COUNT(1) AS alias_count
    FROM [dbo].[search_term_alias]
    GROUP BY term_id
),
term_scores AS (
    SELECT
        stat.term_id,
        CAST(SUM(CASE
            WHEN stat.stat_date >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
            THEN COALESCE(stat.final_hot_score, 0)
            ELSE 0
        END) AS INT) AS hot_score_7d,
        CAST(SUM(COALESCE(stat.search_count, 0)) AS INT) AS total_search_count_30d
    FROM [dbo].[search_term_stat_daily] stat
    WHERE stat.stat_date >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
    GROUP BY stat.term_id
)
SELECT TOP (@limit)
    term.id,
    COALESCE(NULLIF(term.display_term, N''), term.term) AS display_term,
    term.normalized_term,
    term.term_type,
    term.source_kind,
    COALESCE(term.status, N'inactive') AS status,
    CAST(COALESCE(term.manual_boost, 0) AS FLOAT) AS manual_boost,
    CAST(COALESCE(term.base_weight, 1) AS FLOAT) AS base_weight,
    COALESCE(score.hot_score_7d, 0) AS hot_score_7d,
    COALESCE(score.total_search_count_30d, 0) AS total_search_count_30d,
    CONVERT(NVARCHAR(19), COALESCE(term.updated_at, term.created_at), 120) AS last_updated,
    COALESCE(alias_item.alias_count, 0) AS alias_count
FROM [dbo].[search_term] term
LEFT JOIN term_scores score
    ON score.term_id = term.id
LEFT JOIN alias_counts alias_item
    ON alias_item.term_id = term.id
ORDER BY
    COALESCE(score.hot_score_7d, 0) DESC,
    COALESCE(score.total_search_count_30d, 0) DESC,
    COALESCE(term.manual_boost, 0) DESC,
    term.id ASC;";
            command.Parameters.Add("@limit", SqlDbType.Int).Value = limit;

            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                var status = reader.IsDBNull(5) ? "inactive" : reader.GetString(5);
                var sourceKind = reader.IsDBNull(4) ? string.Empty : reader.GetString(4);
                var hotScore = reader.IsDBNull(8) ? 0 : reader.GetInt32(8);
                var searchCount = reader.IsDBNull(9) ? 0 : reader.GetInt32(9);

                list.Add(new SearchGovernanceTermData
                {
                    Id = reader.GetInt64(0),
                    DisplayTerm = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                    NormalizedTerm = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                    TermType = reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                    SourceKind = sourceKind,
                    Status = status,
                    ManualBoost = reader.IsDBNull(6) ? 0d : Convert.ToDouble(reader.GetValue(6), CultureInfo.InvariantCulture),
                    BaseWeight = reader.IsDBNull(7) ? 1d : Convert.ToDouble(reader.GetValue(7), CultureInfo.InvariantCulture),
                    HotScore7d = hotScore,
                    SearchCount30d = searchCount,
                    LastUpdated = reader.IsDBNull(10) ? string.Empty : reader.GetString(10),
                    AliasCount = reader.IsDBNull(11) ? 0 : reader.GetInt32(11),
                    Note = BuildTermNote(sourceKind, status, hotScore, searchCount)
                });
            }

            return list;
        }

        private List<SearchGovernanceAliasData> BuildAliasList(SqlConnection connection, int limit)
        {
            var list = new List<SearchGovernanceAliasData>();

            using var command = connection.CreateCommand();
            command.CommandText = @"
SELECT TOP (@limit)
    alias.id,
    alias.alias,
    alias.normalized_alias,
    term.id AS term_id,
    COALESCE(NULLIF(term.display_term, N''), term.term) AS target_term,
    term.term_type,
    COALESCE(alias.status, N'inactive') AS status,
    COALESCE(term.source_kind, N'manual') AS source_kind,
    CONVERT(NVARCHAR(19), COALESCE(alias.updated_at, alias.created_at), 120) AS last_updated
FROM [dbo].[search_term_alias] alias
INNER JOIN [dbo].[search_term] term
    ON term.id = alias.term_id
ORDER BY
    alias.id DESC;";
            command.Parameters.Add("@limit", SqlDbType.Int).Value = limit;

            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                var aliasText = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);

                list.Add(new SearchGovernanceAliasData
                {
                    Id = reader.GetInt64(0),
                    Alias = aliasText,
                    NormalizedAlias = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                    TermId = reader.GetInt64(3),
                    TargetTerm = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                    TargetType = reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
                    MatchMode = InferAliasMatchMode(aliasText),
                    Status = reader.IsDBNull(6) ? "inactive" : reader.GetString(6),
                    Source = reader.IsDBNull(7) ? "manual" : reader.GetString(7),
                    UpdatedBy = "System",
                    LastUpdated = reader.IsDBNull(8) ? string.Empty : reader.GetString(8),
                    Note = "別名已對應至標準搜尋詞。"
                });
            }

            return list;
        }

        private SearchGovernanceTermData GetTermById(SqlConnection connection, long termId)
        {
            return BuildTermList(connection, 500).FirstOrDefault(item => item.Id == termId);
        }

        private SearchGovernanceAliasData GetAliasById(SqlConnection connection, long aliasId)
        {
            return BuildAliasList(connection, 500).FirstOrDefault(item => item.Id == aliasId);
        }

        private static int GetScalarInt(SqlConnection connection, string sql)
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            var value = command.ExecuteScalar();
            return value == null || value == DBNull.Value ? 0 : Convert.ToInt32(value, CultureInfo.InvariantCulture);
        }

        private static string GetScalarString(SqlConnection connection, string sql)
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            var value = command.ExecuteScalar();
            return value == null || value == DBNull.Value ? string.Empty : Convert.ToString(value, CultureInfo.InvariantCulture);
        }

        private static List<SearchSourceTermRow> FetchSourceTerms(SqlConnection connection)
        {
            const string query = @"
WITH valid_policy AS (
    SELECT
        p.ID,
        p.Title
    FROM [dbo].[IFarePolicy] p
    WHERE
        p.State NOT IN (N'Disabled', N'Delete')
        AND p.ReleaseTime IS NOT NULL
        AND p.ReleaseTime <= GETDATE()
        AND (p.DiscontinuedTime IS NULL OR p.DiscontinuedTime > GETDATE())
)
SELECT
    CAST(vp.Title AS NVARCHAR(200)) AS term,
    CAST(N'policy_title' AS NVARCHAR(50)) AS term_type,
    CAST(N'ifare_policy' AS NVARCHAR(50)) AS source_kind,
    CAST(vp.ID AS NVARCHAR(100)) AS source_ref_id,
    CAST(1.2000 AS DECIMAL(10,4)) AS base_weight
FROM valid_policy vp
WHERE NULLIF(LTRIM(RTRIM(vp.Title)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(k.LabelName AS NVARCHAR(200)),
    CAST(N'keyword' AS NVARCHAR(50)),
    CAST(N'code_keyword' AS NVARCHAR(50)),
    CAST(k.ID AS NVARCHAR(100)),
    CAST(1.1000 AS DECIMAL(10,4))
FROM [dbo].[CodeKeyword] k
WHERE
    k.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(k.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(r.LabelName AS NVARCHAR(200)),
    CAST(N'recipient' AS NVARCHAR(50)),
    CAST(N'code_recipient' AS NVARCHAR(50)),
    CAST(r.ID AS NVARCHAR(100)),
    CAST(1.0000 AS DECIMAL(10,4))
FROM [dbo].[CodeRecipient] r
WHERE
    r.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(r.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(i.LabelName AS NVARCHAR(200)),
    CAST(N'identity' AS NVARCHAR(50)),
    CAST(N'code_identity' AS NVARCHAR(50)),
    CAST(i.ID AS NVARCHAR(100)),
    CAST(0.9500 AS DECIMAL(10,4))
FROM [dbo].[CodeIdentity] i
WHERE
    i.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(i.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(i.LabelName AS NVARCHAR(200)),
    CAST(N'income' AS NVARCHAR(50)),
    CAST(N'code_income' AS NVARCHAR(50)),
    CAST(i.ID AS NVARCHAR(100)),
    CAST(0.9000 AS DECIMAL(10,4))
FROM [dbo].[CodeIncome] i
WHERE
    i.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(i.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(p.LabelName AS NVARCHAR(200)),
    CAST(N'policy' AS NVARCHAR(50)),
    CAST(N'code_policy' AS NVARCHAR(50)),
    CAST(p.ID AS NVARCHAR(100)),
    CAST(1.0500 AS DECIMAL(10,4))
FROM [dbo].[CodePolicy] p
WHERE
    p.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(p.LabelName)), N'') IS NOT NULL;";

            var rows = new List<SearchSourceTermRow>();
            using var command = connection.CreateCommand();
            command.CommandText = query;
            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                var rawTerm = reader.IsDBNull(0) ? string.Empty : reader.GetString(0).Trim();
                var sourceKind = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
                var displayTerm = string.Equals(sourceKind, "ifare_policy", StringComparison.OrdinalIgnoreCase)
                    ? CleanPolicyTitle(rawTerm)
                    : NormalizeWhitespace(rawTerm);
                var normalizedTerm = NormalizeSearchText(displayTerm);

                if (string.IsNullOrWhiteSpace(displayTerm) || string.IsNullOrWhiteSpace(normalizedTerm))
                {
                    continue;
                }

                rows.Add(new SearchSourceTermRow
                {
                    Term = displayTerm,
                    NormalizedTerm = normalizedTerm,
                    DisplayTerm = displayTerm,
                    TermType = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                    SourceKind = sourceKind,
                    SourceRefId = reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                    BaseWeight = reader.IsDBNull(4) ? 1d : Convert.ToDouble(reader.GetValue(4), CultureInfo.InvariantCulture)
                });
            }

            return rows;
        }

        private static List<SearchSourceTermRow> DeduplicateSourceTerms(List<SearchSourceTermRow> sourceTerms)
        {
            var bestByKey = new Dictionary<string, SearchSourceTermRow>(StringComparer.OrdinalIgnoreCase);

            foreach (var item in sourceTerms)
            {
                var key = $"{item.NormalizedTerm}||{item.TermType}";
                if (!bestByKey.TryGetValue(key, out var current))
                {
                    bestByKey[key] = item;
                    continue;
                }

                if (GetSourceTermPriority(item) > GetSourceTermPriority(current))
                {
                    bestByKey[key] = item;
                }
            }

            return bestByKey.Values
                .OrderBy(item => item.TermType)
                .ThenBy(item => item.NormalizedTerm)
                .ThenBy(item => item.SourceKind)
                .ThenBy(item => item.SourceRefId)
                .ToList();
        }

        private static double GetSourceTermPriority(SearchSourceTermRow item)
        {
            var sourcePriority = SourcePriority.TryGetValue(item.SourceKind ?? string.Empty, out var priority) ? priority : 99;
            var sourceRefRank = long.TryParse(item.SourceRefId, out var sourceRefId) ? sourceRefId : long.MaxValue;
            return (item.BaseWeight * 1000000000d) - (sourcePriority * 1000000d) - sourceRefRank;
        }

        private static void ApplySearchTermSync(SqlConnection connection, List<SearchSourceTermRow> rows, bool pruneMissing)
        {
            using (var setupCommand = connection.CreateCommand())
            {
                setupCommand.CommandText = @"
IF OBJECT_ID('tempdb..#search_term_stage') IS NOT NULL DROP TABLE #search_term_stage;
IF OBJECT_ID('tempdb..#search_term_source_stage') IS NOT NULL DROP TABLE #search_term_source_stage;

CREATE TABLE #search_term_stage
(
    term NVARCHAR(200) NOT NULL,
    normalized_term NVARCHAR(200) NOT NULL,
    display_term NVARCHAR(200) NOT NULL,
    term_type NVARCHAR(50) NOT NULL,
    source_kind NVARCHAR(50) NOT NULL,
    source_ref_id NVARCHAR(100) NOT NULL,
    base_weight DECIMAL(10,4) NOT NULL
);

CREATE TABLE #search_term_source_stage
(
    normalized_term NVARCHAR(200) NOT NULL,
    term_type NVARCHAR(50) NOT NULL,
    source_kind NVARCHAR(50) NOT NULL,
    source_ref_id NVARCHAR(100) NOT NULL,
    source_score DECIMAL(10,4) NOT NULL
);";
                setupCommand.ExecuteNonQuery();
            }

            using (var bulkStage = new SqlBulkCopy(connection))
            {
                bulkStage.DestinationTableName = "#search_term_stage";
                bulkStage.WriteToServer(BuildSearchTermStageTable(rows));
            }

            using (var bulkSource = new SqlBulkCopy(connection))
            {
                bulkSource.DestinationTableName = "#search_term_source_stage";
                bulkSource.WriteToServer(BuildSearchTermSourceStageTable(rows));
            }

            using (var mergeCommand = connection.CreateCommand())
            {
                mergeCommand.CommandText = @"
MERGE [dbo].[search_term] AS target
USING #search_term_stage AS src
ON target.normalized_term = src.normalized_term
AND target.term_type = src.term_type
WHEN MATCHED THEN
    UPDATE SET
        target.term = src.term,
        target.display_term = src.display_term,
        target.status = N'active',
        target.language = N'zh-TW',
        target.base_weight = src.base_weight,
        target.source_kind = src.source_kind,
        target.source_ref_id = src.source_ref_id,
        target.updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT
    (
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
        s.source_kind,
        s.source_ref_id AS source_ref,
        s.source_score
    FROM #search_term_source_stage s
    INNER JOIN [dbo].[search_term] t
        ON t.normalized_term = s.normalized_term
       AND t.term_type = s.term_type
) AS src
ON target.term_id = src.term_id
AND target.source_kind = src.source_kind
AND ISNULL(target.source_ref, N'') = ISNULL(src.source_ref, N'')
WHEN MATCHED THEN
    UPDATE SET
        target.source_score = src.source_score
WHEN NOT MATCHED THEN
    INSERT (term_id, source_kind, source_ref, source_score, created_at)
    VALUES (src.term_id, src.source_kind, src.source_ref, src.source_score, SYSUTCDATETIME());";
                mergeCommand.ExecuteNonQuery();
            }

            if (pruneMissing)
            {
                using var pruneCommand = connection.CreateCommand();
                pruneCommand.CommandText = $@"
UPDATE t
SET
    t.status = N'inactive',
    t.updated_at = SYSUTCDATETIME()
FROM [dbo].[search_term] t
WHERE
    t.source_kind IN ({string.Join(", ", ManagedSourceKinds.Select(kind => $"N'{kind}'"))})
    AND NOT EXISTS
    (
        SELECT 1
        FROM #search_term_stage s
        WHERE s.normalized_term = t.normalized_term
          AND s.term_type = t.term_type
    );";
                pruneCommand.ExecuteNonQuery();
            }
        }

        private static DataTable BuildSearchTermStageTable(List<SearchSourceTermRow> rows)
        {
            var table = new DataTable();
            table.Columns.Add("term", typeof(string));
            table.Columns.Add("normalized_term", typeof(string));
            table.Columns.Add("display_term", typeof(string));
            table.Columns.Add("term_type", typeof(string));
            table.Columns.Add("source_kind", typeof(string));
            table.Columns.Add("source_ref_id", typeof(string));
            table.Columns.Add("base_weight", typeof(decimal));

            foreach (var row in rows)
            {
                table.Rows.Add(row.Term, row.NormalizedTerm, row.DisplayTerm, row.TermType, row.SourceKind, row.SourceRefId, Convert.ToDecimal(row.BaseWeight, CultureInfo.InvariantCulture));
            }

            return table;
        }

        private static DataTable BuildSearchTermSourceStageTable(List<SearchSourceTermRow> rows)
        {
            var table = new DataTable();
            table.Columns.Add("normalized_term", typeof(string));
            table.Columns.Add("term_type", typeof(string));
            table.Columns.Add("source_kind", typeof(string));
            table.Columns.Add("source_ref_id", typeof(string));
            table.Columns.Add("source_score", typeof(decimal));

            foreach (var row in rows)
            {
                table.Rows.Add(row.NormalizedTerm, row.TermType, row.SourceKind, row.SourceRefId, Convert.ToDecimal(row.BaseWeight, CultureInfo.InvariantCulture));
            }

            return table;
        }

        private static string NormalizeWhitespace(string text)
        {
            return Regex.Replace(text ?? string.Empty, @"\s+", " ").Trim();
        }

        private static string CleanPolicyTitle(string text)
        {
            var normalized = NormalizeWhitespace(text);
            normalized = Regex.Replace(normalized, @"^[\[\(（【][^\]\)）】]{1,30}[\]\)）】]\s*", string.Empty);
            return normalized.Trim();
        }

        private static string FormatDelta(int current, int previous)
        {
            if (previous <= 0)
            {
                return current <= 0 ? "0.0%" : "+100.0%";
            }

            var delta = ((double)current - previous) / previous * 100d;
            return $"{(delta >= 0 ? "+" : string.Empty)}{delta:F1}%";
        }

        private static string GetDeltaTone(int current, int previous, bool inverse)
        {
            if (current == previous)
            {
                return "default";
            }

            var improved = inverse ? current < previous : current > previous;
            return improved ? "success" : "warning";
        }

        private static string BuildQueueSuggestion(int resultCount, int zeroResultHits)
        {
            if (resultCount == 0 || zeroResultHits > 0)
            {
                return "建議為這個搜尋意圖建立別名或標準搜尋詞對應。";
            }

            if (resultCount <= 2)
            {
                return "請檢查排序，並評估是否提高更相關搜尋詞群組的權重。";
            }

            return "持續觀察查詢品質，暫時維持目前的對應設定。";
        }

        private static string BuildTermNote(string sourceKind, string status, int hotScore, int searchCount)
        {
            var sourceLabel = GetSourceKindLabel(sourceKind);

            if (!string.Equals(status, "active", StringComparison.OrdinalIgnoreCase))
            {
                return "此搜尋詞目前停用中，重新啟用前請先確認建議詞策略。";
            }

            if (hotScore >= 50 || searchCount >= 100)
            {
                return $"此搜尋詞來自「{sourceLabel}」，需求較高，請持續檢查排序與別名設定。";
            }

            return $"此搜尋詞來自「{sourceLabel}」，目前流量相對穩定。";
        }

        private static string InferAliasMatchMode(string alias)
        {
            var normalized = NormalizeSearchText(alias);
            return normalized.Length <= 4 ? "exact" : "synonym";
        }

        private static string NormalizeAliasType(string aliasType)
        {
            if (string.IsNullOrWhiteSpace(aliasType))
            {
                return "synonym";
            }

            var normalized = aliasType.Trim().ToLowerInvariant();
            return normalized switch
            {
                "exact" => "exact",
                "prefix" => "prefix",
                "contains" => "contains",
                _ => "synonym"
            };
        }

        private static string GetSourceKindLabel(string sourceKind)
        {
            if (string.IsNullOrWhiteSpace(sourceKind))
            {
                return "人工建立";
            }

            return sourceKind.Trim().ToLowerInvariant() switch
            {
                "code_keyword" => "程式關鍵字",
                "policy_extract" => "政策擷取",
                "ifare_policy" => "iFare 政策",
                "google_trends_related_query" => "Google 趨勢關聯字",
                _ => "人工建立"
            };
        }

        private static string NormalizeSearchText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            var normalized = text.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormKC);
            var builder = new StringBuilder(normalized.Length);

            foreach (var ch in normalized)
            {
                if (char.IsWhiteSpace(ch) || char.IsPunctuation(ch) || char.IsControl(ch))
                {
                    continue;
                }

                builder.Append(ch);
            }

            return builder.ToString();
        }

        private sealed class SearchSourceTermRow
        {
            public string Term { get; set; }
            public string NormalizedTerm { get; set; }
            public string DisplayTerm { get; set; }
            public string TermType { get; set; }
            public string SourceKind { get; set; }
            public string SourceRefId { get; set; }
            public double BaseWeight { get; set; }
        }
    }
}
