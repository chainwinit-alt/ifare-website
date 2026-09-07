using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using JiebaNet.Segmenter;

namespace IFare_API.TaskManager.Common
{
    public static class TraditionalChineseFuzzyMatcher
    {
        private static readonly JiebaSegmenter Segmenter = new JiebaSegmenter();

        public static string Normalize(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            var normalized = text.Normalize(NormalizationForm.FormKC).ToLowerInvariant();
            var builder = new StringBuilder(normalized.Length);

            foreach (var ch in normalized)
            {
                if (char.IsWhiteSpace(ch))
                {
                    continue;
                }

                var category = CharUnicodeInfo.GetUnicodeCategory(ch);
                if (category == UnicodeCategory.ConnectorPunctuation ||
                    category == UnicodeCategory.DashPunctuation ||
                    category == UnicodeCategory.OpenPunctuation ||
                    category == UnicodeCategory.ClosePunctuation ||
                    category == UnicodeCategory.InitialQuotePunctuation ||
                    category == UnicodeCategory.FinalQuotePunctuation ||
                    category == UnicodeCategory.OtherPunctuation ||
                    category == UnicodeCategory.Control)
                {
                    continue;
                }

                builder.Append(ch);
            }

            return builder.ToString();
        }

        /// <summary>
        /// 查詢側的前處理結果。Score 裡的 Normalize(query)、TokenizeTerms(query)（＝Jieba 斷詞）
        /// 與查詢的 n-gram 集合都只由 query 決定，與候選字串無關；一次搜尋要對「每一筆政策的
        /// 每一個欄位」呼叫 Score，等於把這些完全相同的計算重跑數百上千次。
        /// 先算一次存進這個物件重複使用，算式與輸入字串完全不變，分數逐筆相同。
        /// 建立後不再修改，可安全跨候選字串共用。
        /// </summary>
        public sealed class QueryScoringContext
        {
            internal string NormalizedQuery;
            internal List<string> QueryTerms;
            internal HashSet<string> QueryBigrams;
            internal HashSet<string> QueryUnigrams;
        }

        public static QueryScoringContext CreateQueryScoringContext(string query)
        {
            var normalizedQuery = Normalize(query);
            return new QueryScoringContext
            {
                NormalizedQuery = normalizedQuery,
                // 沿用原本 Score 的傳入值：terms 用原始 query、n-gram 用正規化後的字串。
                QueryTerms = TokenizeTerms(query),
                QueryBigrams = BuildNgrams(normalizedQuery, 2),
                QueryUnigrams = BuildNgrams(normalizedQuery, 1)
            };
        }

        /// <summary>
        /// 候選側的前處理結果，與 QueryScoringContext 對稱：Score 裡的 Normalize(candidate)、
        /// TokenizeTerms(candidate)（＝Jieba 斷詞）與斷詞集合都只由候選字串決定，與查詢無關。
        /// 候選字串（政策的標題、資格條件、各類標籤）是每請求重算的大宗——每筆政策 8 個欄位、
        /// 整份語料就是 8N 次 Jieba，其中「資格條件」動輒上千字，是搜尋延遲的主要來源。
        /// 呼叫端（政策語料快取）把這個物件跨請求留著重用，算式與輸入字串完全不變，分數逐筆相同。
        /// 建立後不再修改，可安全跨查詢、跨執行緒共用。
        /// 刻意不含 bigram／unigram 集合：實測（1,344 筆政策）連 n-gram 一起存要再多約 21 MB，
        /// 是這裡所有欄位加起來的兩倍，而 n-gram 只是切字串、沒有 Jieba 那麼貴。
        /// 記憶體換得的加速不成比例，留給日後真的需要時再評估。
        /// </summary>
        public sealed class CandidateScoringContext
        {
            internal string NormalizedCandidate;
            internal List<string> CandidateTerms;
            internal HashSet<string> CandidateTermSet;
        }

        public static CandidateScoringContext CreateCandidateScoringContext(string candidate)
        {
            // 沿用原本 Score 的算式：normalized 與 terms 都由同一份 Normalize(candidate) 推導
            // （TokenizeTerms 內部本來就是先 Normalize 再斷詞，這裡只是把該次結果接著用）。
            var normalizedCandidate = Normalize(candidate);
            var candidateTerms = TokenizeNormalizedTerms(normalizedCandidate);
            return new CandidateScoringContext
            {
                NormalizedCandidate = normalizedCandidate,
                CandidateTerms = candidateTerms,
                // WeightedTokenOverlapScore 每次都要把 terms 轉成 HashSet 才能比對，
                // 內容固定就先建好；集合元素直接參照 terms 裡的同一批字串，額外記憶體很小。
                CandidateTermSet = BuildTokenSet(candidateTerms)
            };
        }

        public static double Score(string query, string candidate)
        {
            return Score(CreateQueryScoringContext(query), candidate);
        }

        public static double Score(QueryScoringContext queryContext, string candidate)
        {
            return Score(queryContext, CreateCandidateScoringContext(candidate));
        }

        public static double Score(QueryScoringContext queryContext, CandidateScoringContext candidateContext)
        {
            var normalizedQuery = queryContext.NormalizedQuery;
            var normalizedCandidate = candidateContext.NormalizedCandidate;

            if (string.IsNullOrEmpty(normalizedQuery) || string.IsNullOrEmpty(normalizedCandidate))
            {
                return 0d;
            }

            var exactContainsBoost = normalizedCandidate.Contains(normalizedQuery, StringComparison.Ordinal) ? 0.35d : 0d;
            var termScore = WeightedTokenOverlapScore(queryContext.QueryTerms, candidateContext.CandidateTerms, candidateContext.CandidateTermSet);
            var bigramScore = DiceCoefficient(queryContext.QueryBigrams, BuildNgrams(normalizedCandidate, 2));
            var unigramScore = DiceCoefficient(queryContext.QueryUnigrams, BuildNgrams(normalizedCandidate, 1));

            return Math.Min(1d, exactContainsBoost + (termScore * 0.65d) + (bigramScore * 0.25d) + (unigramScore * 0.1d));
        }

        public static List<string> TokenizeForBm25(string text)
        {
            return TokenizeTerms(text);
        }

        public static Dictionary<string, int> BuildTermFrequencyMap(IEnumerable<string> tokens)
        {
            return tokens
                .GroupBy(token => token)
                .ToDictionary(group => group.Key, group => group.Count());
        }

        public static Dictionary<string, int> BuildDocumentFrequencyMap(IEnumerable<IReadOnlyCollection<string>> documentTokens)
        {
            return documentTokens
                .SelectMany(tokens => tokens.Distinct())
                .GroupBy(token => token)
                .ToDictionary(group => group.Key, group => group.Count());
        }

        public static double ComputeBm25Score(
            IReadOnlyCollection<string> queryTokens,
            IReadOnlyDictionary<string, int> documentTermFrequencies,
            int documentLength,
            IReadOnlyDictionary<string, int> documentFrequencies,
            int documentCount,
            double averageDocumentLength,
            IReadOnlyDictionary<string, double> queryTokenWeights = null,
            double k1 = 1.2d,
            double b = 0.75d)
        {
            if (queryTokens == null || queryTokens.Count == 0 || documentLength <= 0 || documentCount <= 0 || averageDocumentLength <= 0d)
            {
                return 0d;
            }

            double score = 0d;
            var uniqueQueryTokens = queryTokens.Distinct();

            foreach (var token in uniqueQueryTokens)
            {
                if (!documentTermFrequencies.TryGetValue(token, out var termFrequency) || termFrequency <= 0)
                {
                    continue;
                }

                var documentFrequency = documentFrequencies.TryGetValue(token, out var df) ? df : 0;
                var inverseDocumentFrequency = Math.Log(1d + ((documentCount - documentFrequency + 0.5d) / (documentFrequency + 0.5d)));
                var denominator = termFrequency + (k1 * (1d - b + (b * documentLength / averageDocumentLength)));

                if (denominator <= 0d)
                {
                    continue;
                }

                var tokenWeight = queryTokenWeights != null && queryTokenWeights.TryGetValue(token, out var weight)
                    ? weight
                    : 1d;

                score += tokenWeight * inverseDocumentFrequency * ((termFrequency * (k1 + 1d)) / denominator);
            }

            return score;
        }

        public static Dictionary<string, double> BuildQueryTokenWeights(
            IReadOnlyCollection<string> queryTokens,
            IReadOnlyDictionary<string, int> documentFrequencies,
            int documentCount)
        {
            var weights = new Dictionary<string, double>();
            if (queryTokens == null || queryTokens.Count == 0 || documentCount <= 0)
            {
                return weights;
            }

            foreach (var token in queryTokens.Distinct())
            {
                var documentFrequency = documentFrequencies.TryGetValue(token, out var df) ? df : 0;
                weights[token] = GetInformationWeight(token, documentFrequency, documentCount);
            }

            return weights;
        }

        public static List<string> TokenizeTerms(string text)
        {
            return TokenizeNormalizedTerms(Normalize(text));
        }

        // 與 TokenizeTerms 同一段程式，只是把 Normalize 拆到呼叫端，讓已經正規化過的呼叫者
        // （CreateCandidateScoringContext）不必對同一份長文再跑一次 Normalize。斷詞邏輯未動。
        private static List<string> TokenizeNormalizedTerms(string normalized)
        {
            var tokens = new List<string>();

            if (string.IsNullOrEmpty(normalized))
            {
                return tokens;
            }

            try
            {
                tokens.AddRange(
                    Segmenter
                        .Cut(normalized, cutAll: false)
                        .Select(Normalize)
                        .Where(token => !string.IsNullOrWhiteSpace(token)));
            }
            catch
            {
                // Fallback to character bigrams/unigrams if the tokenizer fails at runtime.
            }

            if (tokens.Count == 0)
            {
                if (normalized.Length == 1)
                {
                    tokens.Add(normalized);
                    return tokens;
                }

                for (var i = 0; i < normalized.Length - 1; i++)
                {
                    tokens.Add(normalized.Substring(i, 2));
                }

                for (var i = 0; i < normalized.Length; i++)
                {
                    tokens.Add(normalized[i].ToString());
                }
            }

            return tokens;
        }

        private static HashSet<string> BuildNgrams(string text, int size)
        {
            var tokens = new HashSet<string>();
            if (string.IsNullOrEmpty(text))
            {
                return tokens;
            }

            if (text.Length <= size)
            {
                tokens.Add(text);
                return tokens;
            }

            for (var i = 0; i <= text.Length - size; i++)
            {
                tokens.Add(text.Substring(i, size));
            }

            return tokens;
        }

        private static double DiceCoefficient(HashSet<string> left, HashSet<string> right)
        {
            if (left.Count == 0 || right.Count == 0)
            {
                return 0d;
            }

            var overlap = left.Count(token => right.Contains(token));
            return (2d * overlap) / (left.Count + right.Count);
        }

        private static HashSet<string> BuildTokenSet(IEnumerable<string> tokens)
        {
            return new HashSet<string>(tokens.Where(token => !string.IsNullOrWhiteSpace(token)));
        }

        private static double WeightedTokenOverlapScore(IReadOnlyCollection<string> queryTokens, IReadOnlyCollection<string> candidateTokens)
        {
            return WeightedTokenOverlapScore(queryTokens, candidateTokens, null);
        }

        // candidateTokenSet 是 candidateTokens 的去空白去重集合（＝BuildTokenSet 的結果）。
        // 傳 null 時當場建，與原本行為相同；候選側快取則先建好傳進來，省掉每次查詢重建。
        private static double WeightedTokenOverlapScore(
            IReadOnlyCollection<string> queryTokens,
            IReadOnlyCollection<string> candidateTokens,
            HashSet<string> candidateTokenSet)
        {
            if (queryTokens == null || candidateTokens == null || queryTokens.Count == 0 || candidateTokens.Count == 0)
            {
                return 0d;
            }

            candidateTokenSet ??= BuildTokenSet(candidateTokens);
            var uniqueQueryTokens = queryTokens
                .Where(token => !string.IsNullOrWhiteSpace(token))
                .Distinct()
                .ToList();

            if (uniqueQueryTokens.Count == 0)
            {
                return 0d;
            }

            var totalWeight = uniqueQueryTokens.Sum(token => GetInformationWeight(token));
            if (totalWeight <= 0d)
            {
                return 0d;
            }

            var matchedWeight = uniqueQueryTokens
                .Where(candidateTokenSet.Contains)
                .Sum(token => GetInformationWeight(token));

            return matchedWeight / totalWeight;
        }

        private static double GetInformationWeight(string token, int documentFrequency = 0, int documentCount = 0)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return 0d;
            }

            var normalizedToken = Normalize(token);
            if (string.IsNullOrEmpty(normalizedToken))
            {
                return 0d;
            }

            double lengthWeight;
            if (normalizedToken.Length <= 1)
            {
                lengthWeight = 0.18d;
            }
            else if (normalizedToken.Length == 2)
            {
                lengthWeight = 1d;
            }
            else
            {
                lengthWeight = 1.15d;
            }

            if (documentCount <= 0)
            {
                return lengthWeight;
            }

            var frequencyRatio = Math.Min(1d, (double)documentFrequency / documentCount);
            var frequencyWeight = Math.Max(0.2d, 1d - (frequencyRatio * 0.85d));

            return lengthWeight * frequencyWeight;
        }
    }
}
