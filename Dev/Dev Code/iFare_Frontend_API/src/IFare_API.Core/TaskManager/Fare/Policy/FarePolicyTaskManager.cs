using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using Abp.Domain.Repositories;
using Castle.Core.Logging;
using IFare_API.Common;
using IFare_API.Configuration;
using IFare_API.Constants;
using IFare_API.TaskManager.Common;
using IFare_API.TaskManager.Code.ValueModel;
using IFare_API.TaskManager.Fare.Policy.Common;
using IFare_API.TaskManager.Fare.Policy.ValueModel;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace IFare_API.TaskManager.Fare.Policy
{
    public class FarePolicyTaskManager : IFarePolicyTaskManager
    {
        private readonly IRepository<IfarePolicy> _repositoryIFarePolicy;
        private readonly ICommonToolsManager _commonTools;
        public ILogger Logger { get; set; }
        public FarePolicyTaskManager(IRepository<IfarePolicy> repositoryIFarePolicy,
                                ICommonToolsManager commonTools)
        {
            _repositoryIFarePolicy = repositoryIFarePolicy;
            _commonTools = commonTools;
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
                                                                                    })
                                                                                    .ToList(),
                                        CodeIncomeList = p.IfarePolicyCodeIncomes.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeIncome.Id,
                                                                                        CodeName = p2.CodeIncome.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        CodeIdentityList = p.IfarePolicyCodeIdentities.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeIdentity.Id,
                                                                                        CodeName = p2.CodeIdentity.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        CodeRecipientList = p.IfarePolicyCodeRecipients.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeRecipient.Id,
                                                                                        CodeName = p2.CodeRecipient.LabelName
                                                                                    })
                                                                                    .ToList(),
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

            if (!paramChecker.IsCheckPass()) return new FarePolicyResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

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

            if (param.IsCodeDomicileFiltered) query = query.Where(p => p.CodeDomicileId == param.CodeDomicile || p.CodeDomicileId == 1);    // ID = 1 (中央)
            if (param.IsCodePolicyFiltered) query = query.Where(p => p.CodePolicyId == param.CodePolicy);
            if (param.IsCodeIncomeFiltered) query = query.Where(p => p.IfarePolicyCodeIncomes.Where(p2 => p2.CodeIncomeId == param.CodeIncome || p2.CodeIncomeId == 1).Count() > 0);
            if (param.IsCodeRecipientFiltered) query = query.Where(p => p.IfarePolicyCodeRecipients.Where(p2 => p2.CodeRecipientId == param.CodeRecipient || p2.CodeRecipientId == 1).Count() > 0);
            if (param.IsCodeIdentitiesFiltered) query = query.Where(p => p.IfarePolicyCodeIdentities.Where(p2 => param.CodeIdentities.Contains(p2.CodeIdentityId) || p2.CodeIdentityId == 1).Count() > 0);

            list = query.Select(p => new FarePolicyData 
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
                                                                        })
                                                                        .ToList(),
                            CodeIncomeList = p.IfarePolicyCodeIncomes.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeIncome.Id,
                                                                            CodeName = p2.CodeIncome.LabelName
                                                                        })
                                                                        .ToList(),
                            CodeIdentityList = p.IfarePolicyCodeIdentities.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeIdentity.Id,
                                                                            CodeName = p2.CodeIdentity.LabelName
                                                                        })
                                                                        .ToList(),
                            CodeRecipientList = p.IfarePolicyCodeRecipients.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeRecipient.Id,
                                                                            CodeName = p2.CodeRecipient.LabelName
                                                                        })
                                                                        .ToList(),
                            CreateTime = p.CreateTime,
                            ReleaseTime = p.ReleaseTime.Value,
                            DiscontinuedTime = p.DiscontinuedTime.Value,
                        })
                        .OrderByDescending(p => p.ReleaseTime)
                        .ThenByDescending(p => p.CreateTime)
                        .ToList();

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

            return new FarePolicyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
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
                                                                                    })
                                                                                    .ToList(),
                                        CodeIncomeList = p.IfarePolicyCodeIncomes.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeIncome.Id,
                                                                                        CodeName = p2.CodeIncome.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        CodeIdentityList = p.IfarePolicyCodeIdentities.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeIdentity.Id,
                                                                                        CodeName = p2.CodeIdentity.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        CodeRecipientList = p.IfarePolicyCodeRecipients.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeRecipient.Id,
                                                                                        CodeName = p2.CodeRecipient.LabelName
                                                                                    })
                                                                                    .ToList(),
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
                var maxNum = ttlCount > 3 ? ttlCount - 3 : ttlCount;
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
            // var relationCodeDomicileID = _repositoryIFarePolicy.GetAll()
            //                                         .Include(p => p.CodeDomicile)
            //                                         .Where(p => p.CodeDomicile.State != DataState.Disabled)
            //                                         .Where(p => p.Id == farePolicyID)
            //                                         .Select(p => p.CodeDomicileId.Value)
            //                                         .FirstOrDefault();

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

            // All same.
            var _query_All = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId &&
                                            !p.IfarePolicyCodeRecipients.Any(p2 => !cRecipientList.Contains(p2.CodeRecipientId)) &&
                                            !p.IfarePolicyCodeIncomes.Any(p2 => !cIncomeList.Contains(p2.CodeIncomeId)) &&
                                            !p.IfarePolicyCodeIdentities.Any(p2 => !cIdentityList.Contains(p2.CodeIdentityId)));
            // All Contains same.
            var _quer_All_Contains = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId &&
                                                p.IfarePolicyCodeRecipients.Any(p2 => cRecipientList.Contains(p2.CodeRecipientId)) &&
                                                p.IfarePolicyCodeIncomes.Any(p2 => cIncomeList.Contains(p2.CodeIncomeId)) &&
                                                p.IfarePolicyCodeIdentities.Any(p2 => cIdentityList.Contains(p2.CodeIdentityId)));

            // All or.
            var _quer_All_Or = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId ||
                                                p.IfarePolicyCodeRecipients.Any(p2 => cRecipientList.Contains(p2.CodeRecipientId)) ||
                                                p.IfarePolicyCodeIncomes.Any(p2 => cIncomeList.Contains(p2.CodeIncomeId)) ||
                                                p.IfarePolicyCodeIdentities.Any(p2 => cIdentityList.Contains(p2.CodeIdentityId)));

            var _relationList = new List<FarePolicyData>();
            const int TTLCOUNT = 3;
            var takeNum = TTLCOUNT;

            // All same.
            if (_query_All.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query_All, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            // All Contains same.
            if (_quer_All_Contains.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_quer_All_Contains, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            // All Or.
            if (_quer_All_Or.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_quer_All_Or, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            // All random.
            if (_query.Count() > 0 && takeNum > 0) 
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query, takeNum, currentList: _relationList, isRandom: true));
                takeNum = takeNum - _relationList.Count();
            }
            
            return new FarePolicyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), _relationList);
        }
    }
}
