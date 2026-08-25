using System;
using System.Collections.Concurrent;
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
                                    .AsNoTracking()   // 純讀取查詢，不需追蹤
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
                                    .AsNoTracking()   // 純讀取查詢，不需追蹤
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
                            UpdateTime = p.UpdateTime,   // 給搜尋語料快取做失效判斷的版本戳（實體 p 有此欄位）
                        })
                        .OrderByDescending(p => p.ReleaseTime)
                        .ThenByDescending(p => p.CreateTime)
                        .ToList();

            if (param.IsQueryFiltered)
            {
                var normalizedQuery = TraditionalChineseFuzzyMatcher.Normalize(param.Query);
                var queryTokens = TraditionalChineseFuzzyMatcher.TokenizeForBm25(param.Query);
                // searchCorpus 的每一項（分詞、詞頻表、文件長度、摺疊後全文）只跟政策內容有關、
                // 與查詢字串完全無關，因此改由行程內記憶化快取取得（見 GetOrBuildSearchCorpusEntry）。
                // 這裡刻意維持與原本完全相同的匿名型別欄位（Item/Tokens/SearchText/TermFrequencies/
                // DocumentLength），且各欄位值與原本逐筆重算的結果一模一樣，確保後續 grounding
                // 與 BM25 計分的輸入位元級不變。
                var searchCorpus = list
                    .Select(item =>
                    {
                        var corpusEntry = GetOrBuildSearchCorpusEntry(item);
                        return new
                        {
                            Item = item,
                            Tokens = corpusEntry.Tokens,
                            SearchText = corpusEntry.FoldedSearchText,
                            TermFrequencies = corpusEntry.TermFrequencies,
                            DocumentLength = corpusEntry.DocumentLength
                        };
                    })
                    .ToList();

                // 站內完全沒有的主題（如「寵物醫療」）會被「醫療」「補助」這類高頻字撐過
                // 相關性門檻，撈回數百筆弱相關結果，也讓前端「查無資料」的引導流程永遠走不到。
                // 先確認查詢的具體主題在政策庫裡真的存在：完全不存在就回空清單；
                // 存在（或屬於純泛用詞查詢）則完全維持原本的計分與排序。
                // 落地判定沿用上面已記憶化的 SearchText（＝FoldedSearchText，與原值逐筆相同），
                // 且刻意排在下方「重的 BM25 計分迴圈」之前：查無主題者能提早回空清單、不必白跑計分。
                // 傳入的文件內容與 HasGroundedSearchTopic 本身都未更動，判定的 true/false 結果不變。
                if (!HasGroundedSearchTopic(param.Query, searchCorpus.Select(entry => entry.SearchText).ToList()))
                {
                    stopwatch.Stop();
                    WriteSearchMetricsLog(param, stopwatch.ElapsedMilliseconds, 0);
                    return new FarePolicyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list.Take(0).ToList());
                }

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

        private static readonly string[] GenericSearchTerms =
        {
            "補助", "津貼", "福利", "服務", "政策", "申請", "資格", "計畫", "方案", "資訊", "相關"
        };

        private static readonly char[] QuerySegmentSeparators =
        {
            ' ', '　', ',', '，', '、', '。', '．', ';', '；', ':', '：', '/', '／', '|', '｜'
        };

        private static string FoldSearchText(string text)
        {
            return string.IsNullOrEmpty(text) ? string.Empty : text.Replace('臺', '台');
        }

        /// <summary>
        /// 查詢的具體主題是否存在於政策庫。
        /// 把查詢依使用者輸入的空白／標點切段，每段再依泛用詞（補助、津貼⋯）切成具體片段；
        /// 任一片段（兩字以上）的「每一個相鄰二字組」都出現在政策庫全文裡，即視為落地。
        /// 「寵物醫療」的「寵物」「物醫」站內都不存在→擋下；「新北市老人」的新北／北市／市老／老人
        /// 全存在→放行。全部片段都不落地才回 false；沒有具體片段（純泛用詞）維持原行為回 true。
        /// 刻意不用斷詞器判斷：JiebaNet 詞典偏簡體，繁體詞常被切成單字，結果不可靠。
        /// </summary>
        private static bool HasGroundedSearchTopic(string query, IReadOnlyList<string> normalizedDocuments)
        {
            var corpusBigrams = new HashSet<string>(StringComparer.Ordinal);
            foreach (var document in normalizedDocuments)
            {
                for (var i = 0; i + 1 < document.Length; i++)
                {
                    corpusBigrams.Add(document.Substring(i, 2));
                }
            }

            var hasSpecificFragment = false;

            foreach (var segment in (query ?? string.Empty).Split(QuerySegmentSeparators, StringSplitOptions.RemoveEmptyEntries))
            {
                var fragments = new List<string> { FoldSearchText(TraditionalChineseFuzzyMatcher.Normalize(segment)) };
                foreach (var generic in GenericSearchTerms)
                {
                    fragments = fragments
                        .SelectMany(fragment => fragment.Split(new[] { generic }, StringSplitOptions.None))
                        .ToList();
                }

                foreach (var fragment in fragments)
                {
                    if (fragment.Length < 2)
                    {
                        continue;
                    }

                    hasSpecificFragment = true;
                    var chainGrounded = true;
                    for (var i = 0; i + 1 < fragment.Length; i++)
                    {
                        if (!corpusBigrams.Contains(fragment.Substring(i, 2)))
                        {
                            chainGrounded = false;
                            break;
                        }
                    }

                    if (chainGrounded)
                    {
                        return true;
                    }
                }
            }

            return !hasSpecificFragment;
        }

        // ── 政策搜尋語料的行程內記憶化快取 ─────────────────────────────────────
        // 為什麼可以快取：searchCorpus 每一項（分詞 Tokens、詞頻表 TermFrequencies、文件長度
        // DocumentLength、摺疊後全文 FoldedSearchText）都只由「政策內容」決定，與使用者輸入的
        // 查詢字串完全無關；同一筆政策不論被哪個查詢命中，這些純 CPU 的前處理結果都一樣，
        // 因此可跨請求重用，把每次請求從零重算 BuildSearchDocument→Tokenize→TF 的成本省下來。
        // 失效怎麼判：以政策 Id 為 key、以該政策的 UpdateTime 當版本戳。命中且「版本戳相同」
        // 且「快取年齡 < TTL」才重用；否則用與原本完全相同的算式重算後寫回。
        // TTL（10 分鐘）只是保險：防「政策沒 bump UpdateTime、但底層關鍵字／身份別等標籤被改」
        // 這種版本戳抓不到的邊角。快取以 Id 為 key，天然上限＝政策數，不需額外淘汰機制。
        private static readonly ConcurrentDictionary<long, SearchCorpusCacheEntry> SearchCorpusCache =
            new ConcurrentDictionary<long, SearchCorpusCacheEntry>();

        private static readonly TimeSpan SearchCorpusCacheTtl = TimeSpan.FromMinutes(10);

        private static SearchCorpusCacheEntry GetOrBuildSearchCorpusEntry(FarePolicyData item)
        {
            // 命中且版本戳相同且未過 TTL → 直接重用。
            // 注意：DateTime.UtcNow 只用來計算「快取年齡」，與任何業務時間比較（如 ReleaseTime）無關。
            if (SearchCorpusCache.TryGetValue(item.ID, out var cached) &&
                cached.Version == item.UpdateTime &&
                (DateTime.UtcNow - cached.CachedAtUtc) < SearchCorpusCacheTtl)
            {
                return cached;
            }

            // 未命中或已失效：用與原本 searchCorpus 完全一致的算式重算後寫回快取。
            var searchText = BuildSearchDocument(item);
            var tokens = TraditionalChineseFuzzyMatcher.TokenizeForBm25(searchText);
            var entry = new SearchCorpusCacheEntry
            {
                Version = item.UpdateTime,
                Tokens = tokens,
                TermFrequencies = TraditionalChineseFuzzyMatcher.BuildTermFrequencyMap(tokens),
                DocumentLength = tokens.Count,
                FoldedSearchText = FoldSearchText(TraditionalChineseFuzzyMatcher.Normalize(searchText)),
                CachedAtUtc = DateTime.UtcNow
            };
            SearchCorpusCache[item.ID] = entry;
            return entry;
        }

        // 快取項：對應原本 searchCorpus 匿名型別中「只與政策內容有關」的欄位。
        // 寫入後不再修改，所有欄位皆為唯讀取用，可安全跨執行緒共享。
        private sealed class SearchCorpusCacheEntry
        {
            public DateTime? Version { get; set; }             // = 該政策的 UpdateTime（版本戳）
            public List<string> Tokens { get; set; }
            public Dictionary<string, int> TermFrequencies { get; set; }
            public int DocumentLength { get; set; }
            public string FoldedSearchText { get; set; }
            public DateTime CachedAtUtc { get; set; }          // 快取寫入時間（UtcNow），僅用來算年齡
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

        // metrics 記錄的靜態設定與快取（見下方 WriteSearchMetricsLog / ResolveSearchMetricsDirectory）。
        // 每次搜尋連 SQL 查記憶體 DMV、以及往上層層找 .csproj 都落在請求熱路徑上，成本高。
        // SQL 快照預設關閉（要診斷才設 IFARE_SEARCH_METRICS_SQL=1）；目錄只解析一次後快取重用。
        private static readonly bool SearchMetricsSqlEnabled =
            (Environment.GetEnvironmentVariable("IFARE_SEARCH_METRICS_SQL") ?? "").Trim().ToLowerInvariant()
                is "1" or "true" or "on";
        private static string _searchMetricsDirectory;
        private static readonly object _searchMetricsDirectoryLock = new object();

        private void WriteSearchMetricsLog(FarePolicyFilterParam param, long elapsedMilliseconds, int resultCount)
        {
            try
            {
                var currentProcess = Process.GetCurrentProcess();
                // SQL 記憶體快照預設關閉：每請求一條連線成本高，需要時才用環境變數開啟
                var sqlProcessMemory = SearchMetricsSqlEnabled ? TryGetSqlProcessMemorySnapshot() : null;

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
                // 按日期分檔，避免單一檔案無限成長吃光磁碟（前台公開 API，每次搜尋一行）
                var searchMetricsFilePath = Path.Combine(
                    searchMetricsDirectory,
                    $"SearchMetrics-{DateTime.Now:yyyyMMdd}.txt");
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
            // 目錄只解析一次：原本每次搜尋都從 BaseDirectory 往上逐層找 .csproj（多次磁碟 I/O），
            // 全落在請求熱路徑上。解析後連同建立目錄一起快取，之後每次搜尋直接重用。
            if (_searchMetricsDirectory != null) return _searchMetricsDirectory;

            lock (_searchMetricsDirectoryLock)
            {
                if (_searchMetricsDirectory != null) return _searchMetricsDirectory;

                string resolved = null;
                var directory = new DirectoryInfo(AppDomain.CurrentDomain.BaseDirectory);
                while (directory != null)
                {
                    var projectFilePath = Path.Combine(directory.FullName, "IFare_API.Web.Host.csproj");
                    if (File.Exists(projectFilePath))
                    {
                        resolved = Path.Combine(directory.FullName, "App_Data", "SearchMetrics");
                        break;
                    }

                    directory = directory.Parent;
                }

                resolved ??= Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data", "SearchMetrics");
                Directory.CreateDirectory(resolved);
                _searchMetricsDirectory = resolved;
                return _searchMetricsDirectory;
            }
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
            // 先 materialize 一次：舊碼的 _query 是對 IEnumerable 的 Where().Select()（含每筆的巢狀
            // 投影），之後 Count() 與 OrderBy/Skip/Take 會重複列舉、等於把整段投影重跑好幾次。
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
                                })
                                .ToList();

            if (isRandom)
            {
                Random rand = new Random();
                var count = _query.Count;
                // 修正舊碼 bug：toSkip 上限必須是 Math.Max(0, count - takeNum)，否則 Skip 過頭會讓
                // 後面的 Take(takeNum) 回傳不足 takeNum 筆。（+1 是因為 Random.Next 的上界為排除）
                // 死碼 maxNum（算了沒用）一併移除。
                int toSkip = rand.Next(0, Math.Max(0, count - takeNum) + 1);
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
                                                            .AsNoTracking()   // 純讀取查詢，不需追蹤
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

            // 傳入不存在／已停用的 id 時 cFarePolicyItem 會是 null；舊碼在下一行直接取導覽屬性
            // 會 NullReferenceException → 500。改為回「成功＋空清單」，沿用既有成功回傳形狀。
            if (cFarePolicyItem == null)
            {
                return new FarePolicyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), new List<FarePolicyData>());
            }

            var cRecipientList = cFarePolicyItem.IfarePolicyCodeRecipients.Select(p => p.CodeRecipientId).ToList();
            var cIncomeList = cFarePolicyItem.IfarePolicyCodeIncomes.Select(p => p.CodeIncomeId).ToList();
            var cIdentityList = cFarePolicyItem.IfarePolicyCodeIdentities.Select(p => p.CodeIdentityId).ToList();

            // 來源查詢只 materialize 一次：舊碼是 .AsEnumerable() 的延遲查詢，之後每個 .Count() 與
            // 每次 helper 的多重列舉都會把同一段 SQL 反覆重跑。改成 .AsNoTracking() 後 .ToList() 落地
            // 一次，後續的 Where/Count/Skip/Take 全在記憶體上做。篩選條件與投影完全不變。
            var _query = _repositoryIFarePolicy.GetAll()
                                    .AsNoTracking()   // 純讀取查詢，不需追蹤
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
                                    .ToList();

            // 以下三段相符邏輯都在已 materialize 的 _query（記憶體 List）上做，各自 ToList 一次，
            // 避免後面的 Count() 與傳進 helper 時重複列舉同一段 in-memory 述詞。相符語意完全不變。
            // All same.（同戶籍地，且該政策的 recipient/income/identity 全都是目標政策的子集）
            var _query_All = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId &&
                                            !p.IfarePolicyCodeRecipients.Any(p2 => !cRecipientList.Contains(p2.CodeRecipientId)) &&
                                            !p.IfarePolicyCodeIncomes.Any(p2 => !cIncomeList.Contains(p2.CodeIncomeId)) &&
                                            !p.IfarePolicyCodeIdentities.Any(p2 => !cIdentityList.Contains(p2.CodeIdentityId)))
                                    .ToList();
            // All Contains same.（同戶籍地，且 recipient/income/identity 三類各至少有一項與目標政策交集）
            var _quer_All_Contains = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId &&
                                                p.IfarePolicyCodeRecipients.Any(p2 => cRecipientList.Contains(p2.CodeRecipientId)) &&
                                                p.IfarePolicyCodeIncomes.Any(p2 => cIncomeList.Contains(p2.CodeIncomeId)) &&
                                                p.IfarePolicyCodeIdentities.Any(p2 => cIdentityList.Contains(p2.CodeIdentityId)))
                                    .ToList();

            // All or.（同戶籍地，或三類任一有交集）
            var _quer_All_Or = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId ||
                                                p.IfarePolicyCodeRecipients.Any(p2 => cRecipientList.Contains(p2.CodeRecipientId)) ||
                                                p.IfarePolicyCodeIncomes.Any(p2 => cIncomeList.Contains(p2.CodeIncomeId)) ||
                                                p.IfarePolicyCodeIdentities.Any(p2 => cIdentityList.Contains(p2.CodeIdentityId)))
                                    .ToList();

            var _relationList = new List<FarePolicyData>();
            const int TTLCOUNT = 3;
            var takeNum = TTLCOUNT;

            // 依序用四層意圖補滿，最多回 TTLCOUNT（3）筆相關政策；每層以 currentList 去重、
            // 並用剩餘名額 takeNum 續補。_query_All/_quer_All_Contains/_quer_All_Or/_query 現在都是
            // 記憶體 List，故改用 .Count 屬性（與原 .Count() 值完全相同）。
            // All same.
            if (_query_All.Count > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query_All, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count;
            }

            // All Contains same.
            if (_quer_All_Contains.Count > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_quer_All_Contains, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count;
            }

            // All Or.
            if (_quer_All_Or.Count > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_quer_All_Or, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count;
            }

            // All random.
            if (_query.Count > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query, takeNum, currentList: _relationList, isRandom: true));
                takeNum = takeNum - _relationList.Count;
            }

            return new FarePolicyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), _relationList);
        }
    }
}
