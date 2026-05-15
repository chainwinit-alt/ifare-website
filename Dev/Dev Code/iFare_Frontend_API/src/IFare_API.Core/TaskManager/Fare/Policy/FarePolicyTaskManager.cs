using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Abp.Domain.Repositories;
using Castle.Core.Logging;
using IFare_API.Common;
using IFare_API.Configuration;
using IFare_API.Constants;
using IFare_API.TaskManager.Code.ValueModel;
using IFare_API.TaskManager.Common;
using IFare_API.TaskManager.Fare.Policy.Common;
using IFare_API.TaskManager.Fare.Policy.ValueModel;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace IFare_API.TaskManager.Fare.Policy
{
    public class FarePolicyTaskManager : IFarePolicyTaskManager
    {
        private readonly IRepository<IfarePolicy> _repositoryIFarePolicy;
        private readonly ICommonToolsManager _commonTools;
        private readonly IDistributedCache _distributedCache;

        public ILogger Logger { get; set; }

        public FarePolicyTaskManager(
            IRepository<IfarePolicy> repositoryIFarePolicy,
            ICommonToolsManager commonTools,
            IDistributedCache distributedCache)
        {
            _repositoryIFarePolicy = repositoryIFarePolicy;
            _commonTools = commonTools;
            _distributedCache = distributedCache;
            Logger = NullLogger.Instance;
        }

        public FarePolicyDetail GetIFarePolicyDetail(long farePolicyID)
        {
            var detail = _repositoryIFarePolicy.GetAll()
                                    .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                    .Include(p => p.CodePolicy)
                                    .Where(p => p.CodePolicy.State != DataState.Disabled)
                                    .Include(p => p.CodeDomicile)
                                    .Where(p => p.CodeDomicile.State != DataState.Disabled)
                                    .Include(p => p.IfarePolicyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                    .Include(p => p.IfarePolicyCodeIdentities.Where(p2 => p2.CodeIdentity.State != DataState.Disabled))
                                    .Include(p => p.IfarePolicyCodeIncomes.Where(p2 => p2.CodeIncome.State != DataState.Disabled))
                                    .Include(p => p.IfarePolicyCodeRecipients.Where(p2 => p2.CodeRecipient.State != DataState.Disabled))
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                    .Where(p => p.Id == farePolicyID)
                                    .Select(p => new FarePolicyDetailData
                                    {
                                        ID = p.Id,
                                        Title = p.Title,
                                        Qualification = p.Qualification,
                                        WelfareInfo = p.WelfareInfo,
                                        Evidence = p.Evidence,
                                        Remark = p.Remark,
                                        IFareOfficeUnitID = p.IfareOfficeUnitId.Value,
                                        OfficeUnitInfo = p.OfficeUnitInfo,
                                        OfficeUnitTel = p.OfficeUnitTel,
                                        CompetentAuthority = p.CompetentAuthority,
                                        CodeDomicile_ID = p.CodeDomicileId.Value,
                                        CodeDomicile_LabelName = p.CodeDomicile.LabelName,
                                        CodePolicy_ID = p.CodePolicyId.Value,
                                        CodePolicy_LabelName = p.CodePolicy.LabelName,
                                        CodeKeywordList = p.IfarePolicyCodeKeywords.Select(p2 => new CodeData
                                        {
                                            ID = p2.CodeKeyword.Id,
                                            CodeName = p2.CodeKeyword.LabelName
                                        }).ToList(),
                                        CodeIncomeList = p.IfarePolicyCodeIncomes.Select(p2 => new CodeData
                                        {
                                            ID = p2.CodeIncome.Id,
                                            CodeName = p2.CodeIncome.LabelName
                                        }).ToList(),
                                        CodeIdentityList = p.IfarePolicyCodeIdentities.Select(p2 => new CodeData
                                        {
                                            ID = p2.CodeIdentity.Id,
                                            CodeName = p2.CodeIdentity.LabelName
                                        }).ToList(),
                                        CodeRecipientList = p.IfarePolicyCodeRecipients.Select(p2 => new CodeData
                                        {
                                            ID = p2.CodeRecipient.Id,
                                            CodeName = p2.CodeRecipient.LabelName
                                        }).ToList(),
                                        ReleaseTime = p.ReleaseTime.Value,
                                        DiscontinuedTime = p.DiscontinuedTime.Value,
                                        UpdateTime = p.UpdateTime
                                    })
                                    .OrderByDescending(p => p.ReleaseTime)
                                    .FirstOrDefault();

            return new FarePolicyDetail(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), detail);
        }

        public FarePolicyResult GetIFarePolicyList(FarePolicyFilterParam param)
        {
            var stopwatch = Stopwatch.StartNew();
            var paramChecker = new FilterParamChecker(param);
            var list = new List<FarePolicyData>();

            if (!paramChecker.IsCheckPass())
            {
                return new FarePolicyResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()),
                    null);
            }

            var cacheKey = BuildPolicyResultCacheKey(param);
            if (TryGetCachedValue(cacheKey, out List<FarePolicyData> cachedPolicyList))
            {
                stopwatch.Stop();
                WriteSearchMetricsLog(param, stopwatch.ElapsedMilliseconds, cachedPolicyList.Count);
                return new FarePolicyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), cachedPolicyList);
            }

            list = BuildProjectedPolicyList(param);

            if (param.IsQueryFiltered)
            {
                var normalizedQuery = TraditionalChineseFuzzyMatcher.Normalize(param.Query);
                var queryTokens = TraditionalChineseFuzzyMatcher.TokenizeForBm25(param.Query);
                var searchCorpus = list
                    .Select(item =>
                    {
                        var searchText = BuildSearchDocument(item);
                        var tokens = TraditionalChineseFuzzyMatcher.TokenizeForBm25(searchText);
                        return new
                        {
                            Item = item,
                            Tokens = tokens,
                            TermFrequencies = TraditionalChineseFuzzyMatcher.BuildTermFrequencyMap(tokens),
                            DocumentLength = tokens.Count
                        };
                    })
                    .ToList();

                var averageDocumentLength = searchCorpus.Count > 0
                    ? searchCorpus.Average(item => item.DocumentLength)
                    : 0d;
                var documentFrequencies = TraditionalChineseFuzzyMatcher.BuildDocumentFrequencyMap(
                    searchCorpus.Select(item => (IReadOnlyCollection<string>)item.Tokens));
                var queryTokenWeights = TraditionalChineseFuzzyMatcher.BuildQueryTokenWeights(
                    queryTokens,
                    documentFrequencies,
                    searchCorpus.Count);

                var maxBm25Score = 0d;
                var searchScores = searchCorpus
                    .Select(item =>
                    {
                        var fuzzyScore = GetSearchScore(normalizedQuery, item.Item);
                        var bm25Score = TraditionalChineseFuzzyMatcher.ComputeBm25Score(
                            queryTokens,
                            item.TermFrequencies,
                            item.DocumentLength,
                            documentFrequencies,
                            searchCorpus.Count,
                            averageDocumentLength,
                            queryTokenWeights);

                        if (bm25Score > maxBm25Score)
                        {
                            maxBm25Score = bm25Score;
                        }

                        return new
                        {
                            Item = item.Item,
                            FuzzyScore = fuzzyScore,
                            Bm25Score = bm25Score
                        };
                    })
                    .ToList();

                list = searchScores
                    .Select(result => new
                    {
                        result.Item,
                        Score = GetHybridSearchScore(result.FuzzyScore, result.Bm25Score, maxBm25Score)
                    })
                    .Where(result => result.Score > 0.08d)
                    .OrderByDescending(result => result.Score)
                    .ThenByDescending(result => result.Item.ReleaseTime)
                    .ThenByDescending(result => result.Item.CreateTime)
                    .Select(result => result.Item)
                    .ToList();
            }

            stopwatch.Stop();
            WriteSearchMetricsLog(param, stopwatch.ElapsedMilliseconds, list.Count);
            WriteSearchQueryLog("ifare_search_result", param, param.Query, list.Count);
            SetCachedValue(cacheKey, list, GetPolicyResultCacheTtl());

            return new FarePolicyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public FarePolicySuggestionResult GetIFareSearchSuggestions(FarePolicySuggestionParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            if (!paramChecker.IsCheckPass())
            {
                return new FarePolicySuggestionResult(
                    _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()),
                    null);
            }

            var hotLimit = Math.Clamp(param.HotLimit <= 0 ? 8 : param.HotLimit, 1, 12);
            var suggestionLimit = Math.Clamp(param.Limit <= 0 ? 8 : param.Limit, 1, 12);
            var normalizedQuery = TraditionalChineseFuzzyMatcher.Normalize(param.Query);
            var cacheKey = BuildSuggestionCacheKey(param, normalizedQuery, hotLimit, suggestionLimit);
            if (TryGetCachedValue(cacheKey, out FarePolicySuggestionPayload cachedPayload))
            {
                return new FarePolicySuggestionResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), cachedPayload);
            }

            List<FarePolicyData> baseList = null;
            List<FarePolicyData> GetBaseList()
            {
                baseList ??= BuildProjectedPolicyList(param);
                return baseList;
            }

            var dictionaryHotKeywords = GetDictionaryHotKeywords(hotLimit);
            var dictionarySuggestions = GetDictionarySuggestions(normalizedQuery, suggestionLimit);

            var result = new FarePolicySuggestionPayload
            {
                HotKeywords = dictionaryHotKeywords.Count > 0
                    ? dictionaryHotKeywords
                    : BuildHotKeywords(GetBaseList(), hotLimit),
                Suggestions = dictionarySuggestions.Count > 0
                    ? dictionarySuggestions
                    : BuildSuggestions(GetBaseList(), param.Query, normalizedQuery, suggestionLimit)
            };
            SetCachedValue(cacheKey, result, GetSuggestionCacheTtl(normalizedQuery));

            return new FarePolicySuggestionResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), result);
        }

        private IQueryable<IfarePolicy> BuildFilteredPolicyQuery(FarePolicyFilterParam param)
        {
            var query = _repositoryIFarePolicy.GetAll()
                                    .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                    .Include(p => p.CodePolicy)
                                    .Where(p => p.CodePolicy.State != DataState.Disabled)
                                    .Include(p => p.CodeDomicile)
                                    .Where(p => p.CodeDomicile.State != DataState.Disabled)
                                    .Include(p => p.IfarePolicyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                    .Include(p => p.IfarePolicyCodeIdentities.Where(p2 => p2.CodeIdentity.State != DataState.Disabled))
                                    .Include(p => p.IfarePolicyCodeIncomes.Where(p2 => p2.CodeIncome.State != DataState.Disabled))
                                    .Include(p => p.IfarePolicyCodeRecipients.Where(p2 => p2.CodeRecipient.State != DataState.Disabled))
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete);

            if (param.IsCodeDomicileFiltered)
            {
                query = query.Where(p => p.CodeDomicileId == param.CodeDomicile || p.CodeDomicileId == 1);
            }

            if (param.IsCodePolicyFiltered)
            {
                query = query.Where(p => p.CodePolicyId == param.CodePolicy);
            }

            if (param.IsCodeIncomeFiltered)
            {
                query = query.Where(p => p.IfarePolicyCodeIncomes.Where(p2 => p2.CodeIncomeId == param.CodeIncome || p2.CodeIncomeId == 1).Count() > 0);
            }

            if (param.IsCodeRecipientFiltered)
            {
                query = query.Where(p => p.IfarePolicyCodeRecipients.Where(p2 => p2.CodeRecipientId == param.CodeRecipient || p2.CodeRecipientId == 1).Count() > 0);
            }

            if (param.IsCodeIdentitiesFiltered)
            {
                query = query.Where(p => p.IfarePolicyCodeIdentities.Where(p2 => param.CodeIdentities.Contains(p2.CodeIdentityId) || p2.CodeIdentityId == 1).Count() > 0);
            }

            return query;
        }

        private List<FarePolicyData> BuildProjectedPolicyList(FarePolicyFilterParam param)
        {
            return BuildFilteredPolicyQuery(param)
                .Select(p => new FarePolicyData
                {
                    ID = p.Id,
                    Title = p.Title,
                    Qualification = p.Qualification,
                    CodeDomicile_ID = p.CodeDomicileId.Value,
                    CodeDomicile_LabelName = p.CodeDomicile.LabelName,
                    CodePolicy_ID = p.CodePolicyId.Value,
                    CodePolicy_LabelName = p.CodePolicy.LabelName,
                    CodeKeywordList = p.IfarePolicyCodeKeywords.Select(p2 => new CodeData
                    {
                        ID = p2.CodeKeyword.Id,
                        CodeName = p2.CodeKeyword.LabelName
                    }).ToList(),
                    CodeIncomeList = p.IfarePolicyCodeIncomes.Select(p2 => new CodeData
                    {
                        ID = p2.CodeIncome.Id,
                        CodeName = p2.CodeIncome.LabelName
                    }).ToList(),
                    CodeIdentityList = p.IfarePolicyCodeIdentities.Select(p2 => new CodeData
                    {
                        ID = p2.CodeIdentity.Id,
                        CodeName = p2.CodeIdentity.LabelName
                    }).ToList(),
                    CodeRecipientList = p.IfarePolicyCodeRecipients.Select(p2 => new CodeData
                    {
                        ID = p2.CodeRecipient.Id,
                        CodeName = p2.CodeRecipient.LabelName
                    }).ToList(),
                    CreateTime = p.CreateTime,
                    ReleaseTime = p.ReleaseTime.Value,
                    DiscontinuedTime = p.DiscontinuedTime.Value,
                })
                .OrderByDescending(p => p.ReleaseTime)
                .ThenByDescending(p => p.CreateTime)
                .ToList();
        }

        private static double GetSearchScore(string normalizedQuery, FarePolicyData item)
        {
            if (string.IsNullOrEmpty(normalizedQuery))
            {
                return 0d;
            }

            var titleScore = TraditionalChineseFuzzyMatcher.Score(normalizedQuery, item.Title);
            var qualificationScore = TraditionalChineseFuzzyMatcher.Score(normalizedQuery, item.Qualification);
            var keywordScore = TraditionalChineseFuzzyMatcher.Score(normalizedQuery, string.Join(" ", item.CodeKeywordList.Select(p => p.CodeName)));
            var policyScore = TraditionalChineseFuzzyMatcher.Score(normalizedQuery, item.CodePolicy_LabelName);
            var domicileScore = TraditionalChineseFuzzyMatcher.Score(normalizedQuery, item.CodeDomicile_LabelName);
            var recipientScore = TraditionalChineseFuzzyMatcher.Score(normalizedQuery, string.Join(" ", item.CodeRecipientList.Select(p => p.CodeName)));
            var identityScore = TraditionalChineseFuzzyMatcher.Score(normalizedQuery, string.Join(" ", item.CodeIdentityList.Select(p => p.CodeName)));
            var incomeScore = TraditionalChineseFuzzyMatcher.Score(normalizedQuery, string.Join(" ", item.CodeIncomeList.Select(p => p.CodeName)));

            return (titleScore * 0.5d) +
                   (qualificationScore * 0.12d) +
                   (keywordScore * 0.16d) +
                   (policyScore * 0.08d) +
                   (domicileScore * 0.04d) +
                   (recipientScore * 0.05d) +
                   (identityScore * 0.03d) +
                   (incomeScore * 0.02d);
        }

        private static double GetHybridSearchScore(double fuzzyScore, double bm25Score, double maxBm25Score)
        {
            var normalizedBm25Score = maxBm25Score > 0d
                ? Math.Min(1d, bm25Score / maxBm25Score)
                : 0d;

            return (fuzzyScore * 0.68d) + (normalizedBm25Score * 0.32d);
        }

        private static string BuildSearchDocument(FarePolicyData item)
        {
            return string.Join(" ", new[]
            {
                item.Title,
                item.Qualification,
                item.CodePolicy_LabelName,
                item.CodeDomicile_LabelName,
                string.Join(" ", item.CodeKeywordList.Select(p => p.CodeName)),
                string.Join(" ", item.CodeRecipientList.Select(p => p.CodeName)),
                string.Join(" ", item.CodeIdentityList.Select(p => p.CodeName)),
                string.Join(" ", item.CodeIncomeList.Select(p => p.CodeName))
            }.Where(text => !string.IsNullOrWhiteSpace(text)));
        }

        private static List<string> BuildHotKeywords(IEnumerable<FarePolicyData> list, int limit)
        {
            return list
                .SelectMany(item => item.CodeKeywordList.Select(keyword => new
                {
                    Text = keyword.CodeName?.Trim(),
                    item.ReleaseTime
                }))
                .Where(item => !string.IsNullOrWhiteSpace(item.Text))
                .GroupBy(item => item.Text)
                .Select(group => new
                {
                    Text = group.Key,
                    Count = group.Count(),
                    LatestReleaseTime = group.Max(entry => entry.ReleaseTime)
                })
                .OrderByDescending(item => item.Count)
                .ThenByDescending(item => item.LatestReleaseTime)
                .ThenBy(item => item.Text.Length)
                .Take(limit)
                .Select(item => item.Text)
                .ToList();
        }

        private static List<FarePolicySuggestionItem> BuildSuggestions(
            IEnumerable<FarePolicyData> list,
            string rawQuery,
            string normalizedQuery,
            int limit)
        {
            if (string.IsNullOrWhiteSpace(normalizedQuery))
            {
                return new List<FarePolicySuggestionItem>();
            }

            var candidates = new Dictionary<string, SuggestionAggregate>(StringComparer.OrdinalIgnoreCase);

            foreach (var item in list)
            {
                AddSuggestionCandidate(candidates, item.Title, "title", 1.25d, rawQuery, normalizedQuery, item.ReleaseTime, item.ID);
                AddSuggestionCandidate(candidates, item.CodePolicy_LabelName, "policy", 0.95d, rawQuery, normalizedQuery, item.ReleaseTime, item.ID);
                AddSuggestionCandidate(candidates, item.CodeDomicile_LabelName, "area", 0.72d, rawQuery, normalizedQuery, item.ReleaseTime, item.ID);
                AddSuggestionCandidate(candidates, item.Qualification, "qualification", 0.68d, rawQuery, normalizedQuery, item.ReleaseTime, item.ID);

                foreach (var keyword in item.CodeKeywordList)
                {
                    AddSuggestionCandidate(candidates, keyword.CodeName, "keyword", 1.1d, rawQuery, normalizedQuery, item.ReleaseTime, item.ID);
                }

                foreach (var recipient in item.CodeRecipientList)
                {
                    AddSuggestionCandidate(candidates, recipient.CodeName, "recipient", 0.78d, rawQuery, normalizedQuery, item.ReleaseTime, item.ID);
                }

                foreach (var identity in item.CodeIdentityList)
                {
                    AddSuggestionCandidate(candidates, identity.CodeName, "identity", 0.74d, rawQuery, normalizedQuery, item.ReleaseTime, item.ID);
                }

                foreach (var income in item.CodeIncomeList)
                {
                    AddSuggestionCandidate(candidates, income.CodeName, "income", 0.7d, rawQuery, normalizedQuery, item.ReleaseTime, item.ID);
                }
            }

            return candidates
                .Values
                .Where(item => item.Score >= 0.2d)
                .OrderByDescending(item => item.Score)
                .ThenByDescending(item => item.PolicyIds.Count)
                .ThenByDescending(item => item.LatestReleaseTime)
                .ThenBy(item => item.Text.Length)
                .Take(limit)
                .Select(item => new FarePolicySuggestionItem
                {
                    Text = item.Text,
                    Type = item.Type,
                    MatchCount = item.PolicyIds.Count,
                    LatestReleaseTime = item.LatestReleaseTime
                })
                .ToList();
        }

        private static void AddSuggestionCandidate(
            IDictionary<string, SuggestionAggregate> candidates,
            string text,
            string type,
            double weight,
            string rawQuery,
            string normalizedQuery,
            DateTime? releaseTime,
            long policyId)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return;
            }

            var normalizedText = TraditionalChineseFuzzyMatcher.Normalize(text);
            if (string.IsNullOrWhiteSpace(normalizedText))
            {
                return;
            }

            var score = TraditionalChineseFuzzyMatcher.Score(rawQuery, text) * weight;

            if (normalizedText.StartsWith(normalizedQuery, StringComparison.Ordinal))
            {
                score += 0.18d;
            }
            else if (normalizedText.Contains(normalizedQuery, StringComparison.Ordinal))
            {
                score += 0.08d;
            }

            if (normalizedText.Equals(normalizedQuery, StringComparison.Ordinal))
            {
                score += 0.22d;
            }

            score -= Math.Min(0.08d, Math.Max(0, normalizedText.Length - normalizedQuery.Length) * 0.004d);
            if (score <= 0d)
            {
                return;
            }

            if (!candidates.TryGetValue(text, out var current))
            {
                current = new SuggestionAggregate
                {
                    Text = text,
                    Type = type,
                    Score = score,
                    LatestReleaseTime = releaseTime
                };
                candidates[text] = current;
            }
            else
            {
                if (score > current.Score)
                {
                    current.Score = score;
                    current.Type = type;
                }

                if (releaseTime.HasValue && (!current.LatestReleaseTime.HasValue || releaseTime > current.LatestReleaseTime))
                {
                    current.LatestReleaseTime = releaseTime;
                }
            }

            current.PolicyIds.Add(policyId);
        }

        private List<string> GetDictionaryHotKeywords(int limit)
        {
            var hotKeywords = new List<string>();
            var cacheKey = BuildHotKeywordCacheKey(limit);
            if (TryGetCachedValue(cacheKey, out List<string> cachedHotKeywords))
            {
                return cachedHotKeywords;
            }

            try
            {
                var connectionString = ResolveIFareConnectionString();
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    return hotKeywords;
                }

                using var connection = new SqlConnection(connectionString);
                connection.Open();

                using var command = connection.CreateCommand();
                command.CommandText = @"
WITH term_scores AS (
    SELECT
        stat.term_id,
        SUM(COALESCE(stat.trend_score, 0)) AS total_trend_score,
        SUM(COALESCE(stat.search_count, 0)) AS total_search_count
    FROM [dbo].[search_term_stat_daily] stat
    WHERE stat.stat_date >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
    GROUP BY stat.term_id
)
SELECT TOP (@limit)
    keyword_stats.display_text
FROM (
    SELECT
        COALESCE(NULLIF(term.display_term, N''), term.term) AS display_text,
        MAX(score.total_trend_score) AS total_trend_score,
        MAX(score.total_search_count) AS total_search_count
    FROM [dbo].[search_term] term
    INNER JOIN term_scores score
        ON score.term_id = term.id
    WHERE term.status = N'active'
    GROUP BY COALESCE(NULLIF(term.display_term, N''), term.term)
) keyword_stats
ORDER BY
    keyword_stats.total_trend_score DESC,
    keyword_stats.total_search_count DESC,
    keyword_stats.display_text ASC;";
                command.Parameters.AddWithValue("@limit", limit);

                using var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    if (!reader.IsDBNull(0))
                    {
                        hotKeywords.Add(reader.GetString(0));
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Warn($"[FarePolicySearchDictionary] failed to read hot keywords: {ex.Message}");
            }

            SetCachedValue(cacheKey, hotKeywords, GetHotKeywordCacheTtl());
            return hotKeywords;
        }

        private List<FarePolicySuggestionItem> GetDictionarySuggestions(string normalizedQuery, int limit)
        {
            var suggestions = new List<FarePolicySuggestionItem>();
            var seenTexts = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var cacheKey = BuildSuggestionDictionaryCacheKey(normalizedQuery, limit);
            if (TryGetCachedValue(cacheKey, out List<FarePolicySuggestionItem> cachedSuggestions))
            {
                return cachedSuggestions;
            }

            if (string.IsNullOrWhiteSpace(normalizedQuery))
            {
                return new List<FarePolicySuggestionItem>();
            }

            try
            {
                var connectionString = ResolveIFareConnectionString();
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    return new List<FarePolicySuggestionItem>();
                }

                using var connection = new SqlConnection(connectionString);
                connection.Open();

                using var command = connection.CreateCommand();
                command.CommandText = @"
WITH term_scores AS (
    SELECT
        stat.term_id,
        SUM(COALESCE(stat.trend_score, 0)) AS total_trend_score,
        SUM(COALESCE(stat.search_count, 0)) AS total_search_count
    FROM [dbo].[search_term_stat_daily] stat
    WHERE stat.stat_date >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
    GROUP BY stat.term_id
),
candidate_terms AS (
    SELECT
        term.id AS term_id,
        COALESCE(NULLIF(term.display_term, N''), term.term) AS display_text,
        term.term_type,
        term.base_weight,
        term.manual_boost,
        COALESCE(score.total_trend_score, 0) AS trend_score,
        COALESCE(score.total_search_count, 0) AS search_count,
        term.normalized_term AS normalized_text,
        CAST(0 AS INT) AS alias_priority,
        CASE term.term_type
            WHEN N'keyword' THEN 1
            WHEN N'recipient' THEN 2
            WHEN N'identity' THEN 3
            WHEN N'income' THEN 4
            WHEN N'policy' THEN 5
            WHEN N'trend' THEN 6
            WHEN N'manual' THEN 7
            WHEN N'policy_title' THEN 20
            ELSE 10
        END AS type_priority
    FROM [dbo].[search_term] term
    LEFT JOIN term_scores score
        ON score.term_id = term.id
    WHERE
        term.status = N'active' AND
        (
            term.normalized_term LIKE @prefixQuery OR
            term.normalized_term LIKE @containsQuery
        )

    UNION ALL

    SELECT
        term.id AS term_id,
        COALESCE(NULLIF(term.display_term, N''), term.term) AS display_text,
        term.term_type,
        term.base_weight,
        term.manual_boost,
        COALESCE(score.total_trend_score, 0) AS trend_score,
        COALESCE(score.total_search_count, 0) AS search_count,
        alias.normalized_alias AS normalized_text,
        CAST(1 AS INT) AS alias_priority,
        CASE term.term_type
            WHEN N'keyword' THEN 1
            WHEN N'recipient' THEN 2
            WHEN N'identity' THEN 3
            WHEN N'income' THEN 4
            WHEN N'policy' THEN 5
            WHEN N'trend' THEN 6
            WHEN N'manual' THEN 7
            WHEN N'policy_title' THEN 20
            ELSE 10
        END AS type_priority
    FROM [dbo].[search_term_alias] alias
    INNER JOIN [dbo].[search_term] term
        ON term.id = alias.term_id
    LEFT JOIN term_scores score
        ON score.term_id = term.id
    WHERE
        term.status = N'active' AND
        alias.status = N'active' AND
        (
            alias.normalized_alias LIKE @prefixQuery OR
            alias.normalized_alias LIKE @containsQuery
        )
)
SELECT TOP (@limit * 4)
    candidate.term_id,
    candidate.display_text,
    candidate.term_type,
    candidate.trend_score,
    candidate.search_count,
    candidate.base_weight,
    candidate.manual_boost,
    candidate.normalized_text,
    candidate.alias_priority,
    candidate.type_priority
FROM candidate_terms candidate
ORDER BY
    CASE WHEN candidate.normalized_text = @normalizedQuery THEN 3
         WHEN candidate.normalized_text LIKE @prefixQuery THEN 2
         ELSE 1 END DESC,
    candidate.alias_priority DESC,
    candidate.type_priority ASC,
    candidate.manual_boost DESC,
    candidate.base_weight DESC,
    candidate.trend_score DESC,
    candidate.search_count DESC,
    LEN(candidate.display_text) ASC;";

                command.Parameters.AddWithValue("@limit", limit);
                command.Parameters.AddWithValue("@normalizedQuery", normalizedQuery);
                command.Parameters.AddWithValue("@prefixQuery", normalizedQuery + "%");
                command.Parameters.AddWithValue("@containsQuery", "%" + normalizedQuery + "%");

                using var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    if (reader.IsDBNull(1))
                    {
                        continue;
                    }

                    var text = reader.GetString(1);
                    if (!seenTexts.Add(text))
                    {
                        continue;
                    }

                    suggestions.Add(new FarePolicySuggestionItem
                    {
                        Text = text,
                        Type = reader.IsDBNull(2) ? "term" : reader.GetString(2),
                        MatchCount = reader.IsDBNull(4) ? 0 : reader.GetInt32(4),
                        LatestReleaseTime = null
                    });

                    if (suggestions.Count >= limit)
                    {
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Warn($"[FarePolicySearchDictionary] failed to read suggestions: {ex.Message}");
            }

            SetCachedValue(cacheKey, suggestions, GetSuggestionCacheTtl(normalizedQuery));
            return suggestions;
        }

        private sealed class SuggestionAggregate
        {
            public string Text { get; set; }
            public string Type { get; set; }
            public double Score { get; set; }
            public DateTime? LatestReleaseTime { get; set; }
            public HashSet<long> PolicyIds { get; } = new HashSet<long>();
        }

        private void WriteSearchMetricsLog(FarePolicyFilterParam param, long elapsedMilliseconds, int resultCount)
        {
            try
            {
                var currentProcess = Process.GetCurrentProcess();
                var sqlProcessMemory = TryGetSqlProcessMemorySnapshot();

                var logLine =
                    $"{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff} [FarePolicySearchMetrics] " +
                    $"query=\"{param?.Query ?? string.Empty}\", " +
                    $"elapsed_ms={elapsedMilliseconds}, " +
                    $"result_count={resultCount}, " +
                    $"api_working_set_mb={currentProcess.WorkingSet64 / 1024d / 1024d:F2}, " +
                    $"api_private_memory_mb={currentProcess.PrivateMemorySize64 / 1024d / 1024d:F2}, " +
                    $"sql_process_memory_mb={(sqlProcessMemory?.ProcessMemoryMb.ToString("F2") ?? "null")}, " +
                    $"sql_memory_utilization_pct={(sqlProcessMemory?.MemoryUtilizationPercentage.ToString("F2") ?? "null")}, " +
                    $"sql_memory_sample_ok={(sqlProcessMemory != null ? "true" : "false")}";

                var searchMetricsDirectory = ResolveSearchMetricsDirectory();
                Directory.CreateDirectory(searchMetricsDirectory);
                var searchMetricsFilePath = Path.Combine(searchMetricsDirectory, "SearchMetrics.txt");
                using var stream = new FileStream(
                    searchMetricsFilePath,
                    FileMode.Append,
                    FileAccess.Write,
                    FileShare.ReadWrite);
                using var writer = new StreamWriter(stream);
                writer.WriteLine(logLine);
            }
            catch (Exception ex)
            {
                Logger.Warn($"[FarePolicySearchMetrics] failed to write metrics log: {ex.Message}");
            }
        }

        private void WriteSearchQueryLog(string sourcePage, FarePolicyFilterParam param, string rawQuery, int resultCount)
        {
            var normalizedQuery = TraditionalChineseFuzzyMatcher.Normalize(rawQuery);
            if (!ShouldWriteSearchQueryLog(sourcePage, normalizedQuery, resultCount))
            {
                return;
            }

            try
            {
                var connectionString = ResolveIFareConnectionString();
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    return;
                }

                using var connection = new SqlConnection(connectionString);
                connection.Open();

                using var command = connection.CreateCommand();
                command.CommandText = @"
INSERT INTO [dbo].[search_query_log] (
    query_text,
    normalized_query,
    source_page,
    filters_json,
    result_count,
    created_at
)
VALUES (
    @queryText,
    @normalizedQuery,
    @sourcePage,
    @filtersJson,
    @resultCount,
    SYSUTCDATETIME()
);";

                command.Parameters.AddWithValue("@queryText", (object)(rawQuery?.Trim() ?? string.Empty));
                command.Parameters.AddWithValue("@normalizedQuery", normalizedQuery);
                command.Parameters.AddWithValue("@sourcePage", sourcePage ?? "ifare_search");
                command.Parameters.AddWithValue("@filtersJson", BuildSearchQueryLogFiltersJson(param));
                command.Parameters.AddWithValue("@resultCount", resultCount);
                command.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                Logger.Warn($"[FarePolicySearchDictionary] failed to write search query log: {ex.Message}");
                WriteSearchQueryErrorLog(ex);
            }
        }

        private static bool ShouldWriteSearchQueryLog(string sourcePage, string normalizedQuery, int resultCount)
        {
            if (string.IsNullOrWhiteSpace(normalizedQuery))
            {
                return false;
            }

            // Autocomplete request traffic is too noisy to mix into the same table as
            // real search submissions. Keep search_query_log focused on committed searches
            // until suggestion select / submit events are modeled separately.
            if (string.Equals(sourcePage, "ifare_search_suggestion", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            return resultCount >= 0;
        }

        private static string BuildSearchQueryLogFiltersJson(FarePolicyFilterParam param)
        {
            var payload = new
            {
                codeDomicile = param?.IsCodeDomicileFiltered == true ? param.CodeDomicile : null,
                codeRecipient = param?.IsCodeRecipientFiltered == true ? param.CodeRecipient : null,
                codePolicy = param?.IsCodePolicyFiltered == true ? param.CodePolicy : null,
                codeIncome = param?.IsCodeIncomeFiltered == true ? param.CodeIncome : null,
                codeIdentities = param?.IsCodeIdentitiesFiltered == true
                    ? (param.CodeIdentities?.Where(id => id > 0).Distinct().ToList() ?? new List<long>())
                    : null
            };

            return JsonConvert.SerializeObject(payload);
        }

        private string BuildPolicyResultCacheKey(FarePolicyFilterParam param)
        {
            return BuildCacheKey("ifare:fare-policy:list", new[]
            {
                $"q={param?.Query ?? string.Empty}",
                $"dom={param?.CodeDomicile?.ToString() ?? string.Empty}",
                $"recipient={param?.CodeRecipient?.ToString() ?? string.Empty}",
                $"policy={param?.CodePolicy?.ToString() ?? string.Empty}",
                $"income={param?.CodeIncome?.ToString() ?? string.Empty}",
                $"identities={NormalizeIdentityList(param?.CodeIdentities)}"
            });
        }

        private string BuildSuggestionCacheKey(FarePolicySuggestionParam param, string normalizedQuery, int hotLimit, int suggestionLimit)
        {
            return BuildCacheKey("ifare:fare-policy:suggestion", new[]
            {
                $"q={normalizedQuery ?? string.Empty}",
                $"dom={param?.CodeDomicile?.ToString() ?? string.Empty}",
                $"recipient={param?.CodeRecipient?.ToString() ?? string.Empty}",
                $"policy={param?.CodePolicy?.ToString() ?? string.Empty}",
                $"income={param?.CodeIncome?.ToString() ?? string.Empty}",
                $"identities={NormalizeIdentityList(param?.CodeIdentities)}",
                $"hot={hotLimit}",
                $"limit={suggestionLimit}"
            });
        }

        private string BuildSuggestionDictionaryCacheKey(string normalizedQuery, int limit)
        {
            return BuildCacheKey("ifare:fare-policy:suggestion-dictionary", new[]
            {
                $"q={normalizedQuery ?? string.Empty}",
                $"limit={limit}"
            });
        }

        private string BuildHotKeywordCacheKey(int limit)
        {
            return BuildCacheKey("ifare:fare-policy:hot-keywords", new[]
            {
                $"limit={limit}"
            });
        }

        private static string BuildCacheKey(string prefix, IEnumerable<string> parts)
        {
            var rawKey = $"{prefix}|{string.Join("|", parts ?? Enumerable.Empty<string>())}";
            using var sha = SHA256.Create();
            var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(rawKey));
            var token = BitConverter.ToString(hash).Replace("-", string.Empty).ToLowerInvariant();
            return $"{prefix}:{token}";
        }

        private static string NormalizeIdentityList(IEnumerable<long> identities)
        {
            if (identities == null)
            {
                return string.Empty;
            }

            return string.Join(",", identities.Where(id => id > 0).Distinct().OrderBy(id => id));
        }

        private bool TryGetCachedValue<T>(string cacheKey, out T value)
        {
            value = default;

            try
            {
                if (_distributedCache == null)
                {
                    return false;
                }

                var raw = _distributedCache.GetString(cacheKey);
                if (string.IsNullOrWhiteSpace(raw))
                {
                    return false;
                }

                value = JsonConvert.DeserializeObject<T>(raw);
                return value != null;
            }
            catch (Exception ex)
            {
                Logger.Warn($"[FarePolicySearchCache] failed to read cache key {cacheKey}: {ex.Message}");
                return false;
            }
        }

        private void SetCachedValue<T>(string cacheKey, T value, TimeSpan ttl)
        {
            try
            {
                if (_distributedCache == null)
                {
                    return;
                }

                if (value == null)
                {
                    return;
                }

                var serialized = JsonConvert.SerializeObject(value);
                _distributedCache.SetString(
                    cacheKey,
                    serialized,
                    new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = ttl
                    });
            }
            catch (Exception ex)
            {
                Logger.Warn($"[FarePolicySearchCache] failed to write cache key {cacheKey}: {ex.Message}");
            }
        }

        private TimeSpan GetPolicyResultCacheTtl()
        {
            return TimeSpan.FromMinutes(GetRedisCacheSettingInt("RedisCache:PolicyResultTtlMinutes", 10));
        }

        private TimeSpan GetSuggestionCacheTtl(string normalizedQuery)
        {
            var defaultMinutes = string.IsNullOrWhiteSpace(normalizedQuery) ? 5 : 3;
            var settingKey = string.IsNullOrWhiteSpace(normalizedQuery)
                ? "RedisCache:HotKeywordTtlMinutes"
                : "RedisCache:SuggestionTtlMinutes";

            return TimeSpan.FromMinutes(GetRedisCacheSettingInt(settingKey, defaultMinutes));
        }

        private TimeSpan GetHotKeywordCacheTtl()
        {
            return TimeSpan.FromMinutes(GetRedisCacheSettingInt("RedisCache:HotKeywordTtlMinutes", 5));
        }

        private static int GetRedisCacheSettingInt(string key, int defaultValue)
        {
            try
            {
                var configuration = AppConfigurations.Get(Directory.GetCurrentDirectory());
                var rawValue = configuration[key];
                return int.TryParse(rawValue, out var parsedValue) && parsedValue > 0
                    ? parsedValue
                    : defaultValue;
            }
            catch
            {
                return defaultValue;
            }
        }

        private void WriteSearchQueryErrorLog(Exception ex)
        {
            try
            {
                var searchMetricsDirectory = ResolveSearchMetricsDirectory();
                Directory.CreateDirectory(searchMetricsDirectory);
                var logFilePath = Path.Combine(searchMetricsDirectory, "SearchQueryLogErrors.txt");
                using var stream = new FileStream(
                    logFilePath,
                    FileMode.Append,
                    FileAccess.Write,
                    FileShare.ReadWrite);
                using var writer = new StreamWriter(stream);
                writer.WriteLine($"{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff} [SearchQueryLogError]");
                writer.WriteLine(ex.ToString());
                writer.WriteLine();
            }
            catch
            {
            }
        }

        private static string ResolveSearchMetricsDirectory()
        {
            var directory = new DirectoryInfo(AppDomain.CurrentDomain.BaseDirectory);

            while (directory != null)
            {
                var projectFilePath = Path.Combine(directory.FullName, "IFare_API.Web.Host.csproj");
                if (File.Exists(projectFilePath))
                {
                    return Path.Combine(directory.FullName, "App_Data", "SearchMetrics");
                }

                directory = directory.Parent;
            }

            return Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data", "SearchMetrics");
        }

        private SqlProcessMemorySnapshot TryGetSqlProcessMemorySnapshot()
        {
            try
            {
                var connectionString = ResolveMonitoringConnectionString();
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    return null;
                }

                using var connection = new SqlConnection(connectionString);
                connection.Open();

                using var command = connection.CreateCommand();
                command.CommandText = @"
SELECT 
    CAST(physical_memory_in_use_kb / 1024.0 AS float) AS process_memory_mb,
    CAST(memory_utilization_percentage AS float) AS memory_utilization_pct
FROM sys.dm_os_process_memory;";

                using var reader = command.ExecuteReader();
                if (!reader.Read())
                {
                    return null;
                }

                return new SqlProcessMemorySnapshot
                {
                    ProcessMemoryMb = reader.IsDBNull(0) ? 0d : reader.GetDouble(0),
                    MemoryUtilizationPercentage = reader.IsDBNull(1) ? 0d : reader.GetDouble(1)
                };
            }
            catch (Exception ex)
            {
                Logger.Warn($"[FarePolicySearchMetrics] failed to read SQL Server memory: {ex.Message}");
                return null;
            }
        }

        private static string ResolveMonitoringConnectionString()
        {
            var configuration = AppConfigurations.Get(Directory.GetCurrentDirectory());
            var targetVersion = configuration["RolloutSetting:TargetVersion"];
            var isLocal = string.Equals(targetVersion, "Local", StringComparison.OrdinalIgnoreCase);
            var connectionStringName = isLocal ? "Local_Default" : "Default";

            return configuration[$"ConnectionStrings:{connectionStringName}"];
        }

        private static string ResolveIFareConnectionString()
        {
            var configuration = AppConfigurations.Get(Directory.GetCurrentDirectory());
            var targetVersion = configuration["RolloutSetting:TargetVersion"];
            var isLocal = string.Equals(targetVersion, "Local", StringComparison.OrdinalIgnoreCase);
            var connectionStringName = isLocal ? "Local_IFare" : "IFare";

            return configuration[$"ConnectionStrings:{connectionStringName}"];
        }

        private sealed class SqlProcessMemorySnapshot
        {
            public double ProcessMemoryMb { get; set; }
            public double MemoryUtilizationPercentage { get; set; }
        }

        private List<FarePolicyData> getArticlesWelfareDataList(IEnumerable<IfarePolicy> queryList, int takeNum = 0, List<FarePolicyData> currentList = null, bool isRandom = false)
        {
            var _list = new List<FarePolicyData>();
            var _existIDs = new List<long>();
            if (currentList != null)
            {
                _existIDs.AddRange(currentList.Select(p => p.ID).ToList());
            }

            var _query = queryList.Where(p => !_existIDs.Contains(p.Id))
                                .Select(p =>
                                {
                                    var _item = new FarePolicyData
                                    {
                                        ID = p.Id,
                                        Title = p.Title,
                                        Qualification = p.Qualification,
                                        CodeDomicile_ID = p.CodeDomicileId.Value,
                                        CodeDomicile_LabelName = p.CodeDomicile.LabelName,
                                        CodePolicy_ID = p.CodePolicyId.Value,
                                        CodePolicy_LabelName = p.CodePolicy.LabelName,
                                        CodeKeywordList = p.IfarePolicyCodeKeywords.Select(p2 => new CodeData
                                        {
                                            ID = p2.CodeKeyword.Id,
                                            CodeName = p2.CodeKeyword.LabelName
                                        }).ToList(),
                                        CodeIncomeList = p.IfarePolicyCodeIncomes.Select(p2 => new CodeData
                                        {
                                            ID = p2.CodeIncome.Id,
                                            CodeName = p2.CodeIncome.LabelName
                                        }).ToList(),
                                        CodeIdentityList = p.IfarePolicyCodeIdentities.Select(p2 => new CodeData
                                        {
                                            ID = p2.CodeIdentity.Id,
                                            CodeName = p2.CodeIdentity.LabelName
                                        }).ToList(),
                                        CodeRecipientList = p.IfarePolicyCodeRecipients.Select(p2 => new CodeData
                                        {
                                            ID = p2.CodeRecipient.Id,
                                            CodeName = p2.CodeRecipient.LabelName
                                        }).ToList(),
                                        ReleaseTime = p.ReleaseTime.Value,
                                        DiscontinuedTime = p.DiscontinuedTime.Value,
                                        CreateTime = p.CreateTime
                                    };
                                    return _item;
                                });

            if (isRandom)
            {
                Random rand = new Random();
                var ttlCount = _query.Count();
                int toSkip = rand.Next(0, ttlCount);
                _list = _query.OrderBy(r => Guid.NewGuid())
                            .Skip(toSkip)
                            .Take(takeNum)
                            .ToList();
            }
            else
            {
                _list = _query.OrderByDescending(p => p.ReleaseTime)
                            .ThenByDescending(p => p.CreateTime)
                            .Take(takeNum)
                            .ToList();
            }

            return _list;
        }

        public FarePolicyResult GetIFarePolicyRelation(long farePolicyID)
        {
            var cFarePolicyItem = _repositoryIFarePolicy.GetAll()
                                                            .Include(p => p.CodePolicy)
                                                            .Include(p => p.CodeDomicile)
                                                            .Include(p => p.IfarePolicyCodeKeywords)
                                                            .ThenInclude(p => p.CodeKeyword)
                                                            .Include(p => p.IfarePolicyCodeIdentities)
                                                            .ThenInclude(p => p.CodeIdentity)
                                                            .Include(p => p.IfarePolicyCodeIncomes)
                                                            .ThenInclude(p => p.CodeIncome)
                                                            .Include(p => p.IfarePolicyCodeRecipients)
                                                            .ThenInclude(p => p.CodeRecipient)
                                                            .Where(p => p.Id == farePolicyID)
                                                            .FirstOrDefault();
            var cRecipientList = cFarePolicyItem.IfarePolicyCodeRecipients.Select(p => p.CodeRecipientId).ToList();
            var cIncomeList = cFarePolicyItem.IfarePolicyCodeIncomes.Select(p => p.CodeIncomeId).ToList();
            var cIdentityList = cFarePolicyItem.IfarePolicyCodeIdentities.Select(p => p.CodeIdentityId).ToList();

            var _query = _repositoryIFarePolicy.GetAll()
                                    .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                    .Include(p => p.CodePolicy)
                                    .Where(p => p.CodePolicy.State != DataState.Disabled)
                                    .Include(p => p.CodeDomicile)
                                    .Where(p => p.CodeDomicile.State != DataState.Disabled)
                                    .Include(p => p.IfarePolicyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                    .ThenInclude(p => p.CodeKeyword)
                                    .Include(p => p.IfarePolicyCodeIdentities.Where(p2 => p2.CodeIdentity.State != DataState.Disabled))
                                    .ThenInclude(p => p.CodeIdentity)
                                    .Include(p => p.IfarePolicyCodeIncomes.Where(p2 => p2.CodeIncome.State != DataState.Disabled))
                                    .ThenInclude(p => p.CodeIncome)
                                    .Include(p => p.IfarePolicyCodeRecipients.Where(p2 => p2.CodeRecipient.State != DataState.Disabled))
                                    .ThenInclude(p => p.CodeRecipient)
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete && p.Id != farePolicyID)
                                    .AsEnumerable();

            var _query_All = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId &&
                                            !p.IfarePolicyCodeRecipients.Any(p2 => !cRecipientList.Contains(p2.CodeRecipientId)) &&
                                            !p.IfarePolicyCodeIncomes.Any(p2 => !cIncomeList.Contains(p2.CodeIncomeId)) &&
                                            !p.IfarePolicyCodeIdentities.Any(p2 => !cIdentityList.Contains(p2.CodeIdentityId)));
            var _quer_All_Contains = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId &&
                                                p.IfarePolicyCodeRecipients.Any(p2 => cRecipientList.Contains(p2.CodeRecipientId)) &&
                                                p.IfarePolicyCodeIncomes.Any(p2 => cIncomeList.Contains(p2.CodeIncomeId)) &&
                                                p.IfarePolicyCodeIdentities.Any(p2 => cIdentityList.Contains(p2.CodeIdentityId)));
            var _quer_All_Or = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId ||
                                                p.IfarePolicyCodeRecipients.Any(p2 => cRecipientList.Contains(p2.CodeRecipientId)) ||
                                                p.IfarePolicyCodeIncomes.Any(p2 => cIncomeList.Contains(p2.CodeIncomeId)) ||
                                                p.IfarePolicyCodeIdentities.Any(p2 => cIdentityList.Contains(p2.CodeIdentityId)));

            var _relationList = new List<FarePolicyData>();
            const int TTLCOUNT = 3;
            var takeNum = TTLCOUNT;

            if (_query_All.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query_All, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            if (_quer_All_Contains.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_quer_All_Contains, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            if (_quer_All_Or.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_quer_All_Or, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            if (_query.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query, takeNum, currentList: _relationList, isRandom: true));
                takeNum = takeNum - _relationList.Count();
            }

            return new FarePolicyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), _relationList);
        }
    }
}
