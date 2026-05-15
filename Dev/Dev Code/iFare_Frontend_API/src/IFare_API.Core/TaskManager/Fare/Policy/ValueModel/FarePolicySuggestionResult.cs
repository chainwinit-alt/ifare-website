using System;
using System.Collections.Generic;
using IFare_API.Common.ValueModel;

namespace IFare_API.TaskManager.Fare.Policy.ValueModel
{
    public class FarePolicySuggestionParam : FarePolicyFilterParam
    {
        public int Limit { get; set; } = 8;
        public int HotLimit { get; set; } = 8;
    }

    public class FarePolicySuggestionResult : ErrorInfoBase
    {
        public FarePolicySuggestionResult(ErrorInfoBase errorInfo, FarePolicySuggestionPayload result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }

        public FarePolicySuggestionPayload Result { get; set; }
    }

    public class FarePolicySuggestionPayload
    {
        public List<string> HotKeywords { get; set; } = new List<string>();
        public List<FarePolicySuggestionItem> Suggestions { get; set; } = new List<FarePolicySuggestionItem>();
    }

    public class FarePolicySuggestionItem
    {
        public string Text { get; set; }
        public string Type { get; set; }
        public int MatchCount { get; set; }
        public DateTime? LatestReleaseTime { get; set; }
    }
}
