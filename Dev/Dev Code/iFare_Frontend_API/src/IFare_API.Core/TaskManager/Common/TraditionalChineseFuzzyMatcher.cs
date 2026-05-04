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

        public static double Score(string query, string candidate)
        {
            var normalizedQuery = Normalize(query);
            var normalizedCandidate = Normalize(candidate);

            if (string.IsNullOrEmpty(normalizedQuery) || string.IsNullOrEmpty(normalizedCandidate))
            {
                return 0d;
            }

            var exactContainsBoost = normalizedCandidate.Contains(normalizedQuery, StringComparison.Ordinal) ? 0.35d : 0d;
            var queryTerms = TokenizeTerms(query);
            var candidateTerms = TokenizeTerms(candidate);
            var termScore = WeightedTokenOverlapScore(queryTerms, candidateTerms);
            var bigramScore = DiceCoefficient(BuildNgrams(normalizedQuery, 2), BuildNgrams(normalizedCandidate, 2));
            var unigramScore = DiceCoefficient(BuildNgrams(normalizedQuery, 1), BuildNgrams(normalizedCandidate, 1));

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
            var normalized = Normalize(text);
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
            if (queryTokens == null || candidateTokens == null || queryTokens.Count == 0 || candidateTokens.Count == 0)
            {
                return 0d;
            }

            var candidateTokenSet = new HashSet<string>(candidateTokens.Where(token => !string.IsNullOrWhiteSpace(token)));
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
