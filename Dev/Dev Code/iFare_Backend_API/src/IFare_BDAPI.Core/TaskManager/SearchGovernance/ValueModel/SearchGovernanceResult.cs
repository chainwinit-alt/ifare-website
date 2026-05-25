using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.SearchGovernance.ValueModel
{
    public class SearchGovernanceDashboardResult : ErrorInfoBase
    {
        public SearchGovernanceDashboardResult(ErrorInfoBase errorInfo, SearchGovernanceDashboardData result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }

        public SearchGovernanceDashboardData Result { get; set; }
    }

    public class SearchGovernanceTermResult : ErrorInfoBase
    {
        public SearchGovernanceTermResult(ErrorInfoBase errorInfo, List<SearchGovernanceTermData> result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }

        public List<SearchGovernanceTermData> Result { get; set; }
    }

    public class SearchGovernanceAliasResult : ErrorInfoBase
    {
        public SearchGovernanceAliasResult(ErrorInfoBase errorInfo, List<SearchGovernanceAliasData> result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }

        public List<SearchGovernanceAliasData> Result { get; set; }
    }

    public class SearchGovernanceTermItemResult : ErrorInfoBase
    {
        public SearchGovernanceTermItemResult(ErrorInfoBase errorInfo, SearchGovernanceTermData result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }

        public SearchGovernanceTermData Result { get; set; }
    }

    public class SearchGovernanceAliasItemResult : ErrorInfoBase
    {
        public SearchGovernanceAliasItemResult(ErrorInfoBase errorInfo, SearchGovernanceAliasData result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }

        public SearchGovernanceAliasData Result { get; set; }
    }

    public class SearchGovernanceRefreshHotStatsResult : ErrorInfoBase
    {
        public SearchGovernanceRefreshHotStatsResult(ErrorInfoBase errorInfo, SearchGovernanceRefreshHotStatsData result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }

        public SearchGovernanceRefreshHotStatsData Result { get; set; }
    }

    public class SearchGovernanceSyncTermsResult : ErrorInfoBase
    {
        public SearchGovernanceSyncTermsResult(ErrorInfoBase errorInfo, SearchGovernanceSyncTermsData result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }

        public SearchGovernanceSyncTermsData Result { get; set; }
    }

    public class SearchGovernanceDashboardData
    {
        public List<SearchGovernanceOverviewStatData> OverviewStats { get; set; } = new();
        public List<SearchGovernanceTrendPointData> TrendPoints { get; set; } = new();
        public List<SearchGovernanceQueueItemData> QueueItems { get; set; } = new();
        public List<SearchGovernanceTermData> TopTerms { get; set; } = new();
    }

    public class SearchGovernanceOverviewStatData
    {
        public string Key { get; set; }
        public string Label { get; set; }
        public string Value { get; set; }
        public string Delta { get; set; }
        public string Tone { get; set; }
    }

    public class SearchGovernanceTrendPointData
    {
        public string Label { get; set; }
        public int Value { get; set; }
    }

    public class SearchGovernanceQueueItemData
    {
        public string Id { get; set; }
        public string Query { get; set; }
        public string Status { get; set; }
        public int Searches7d { get; set; }
        public int ResultCount { get; set; }
        public string Suggestion { get; set; }
        public string Owner { get; set; }
    }

    public class SearchGovernanceTermData
    {
        public long Id { get; set; }
        public string DisplayTerm { get; set; }
        public string NormalizedTerm { get; set; }
        public string TermType { get; set; }
        public string SourceKind { get; set; }
        public string Status { get; set; }
        public double ManualBoost { get; set; }
        public double BaseWeight { get; set; }
        public int HotScore7d { get; set; }
        public int SearchCount30d { get; set; }
        public string LastUpdated { get; set; }
        public int AliasCount { get; set; }
        public string Note { get; set; }
    }

    public class SearchGovernanceAliasData
    {
        public long Id { get; set; }
        public string Alias { get; set; }
        public string NormalizedAlias { get; set; }
        public long TermId { get; set; }
        public string TargetTerm { get; set; }
        public string TargetType { get; set; }
        public string MatchMode { get; set; }
        public string Status { get; set; }
        public string Source { get; set; }
        public string UpdatedBy { get; set; }
        public string LastUpdated { get; set; }
        public string Note { get; set; }
    }

    public class SearchGovernanceTermUpdateData
    {
        public long Id { get; set; }
        public string DisplayTerm { get; set; }
        public string TermType { get; set; }
        public string SourceKind { get; set; }
        public string Status { get; set; }
        public double ManualBoost { get; set; }
        public double BaseWeight { get; set; }
    }

    public class SearchGovernanceTermCreateData
    {
        public string DisplayTerm { get; set; }
        public string TermType { get; set; }
        public string SourceKind { get; set; }
        public string Status { get; set; }
        public double ManualBoost { get; set; }
        public double BaseWeight { get; set; }
    }

    public class SearchGovernanceAliasUpdateData
    {
        public long Id { get; set; }
        public long TermId { get; set; }
        public string Alias { get; set; }
        public string MatchMode { get; set; }
        public string Status { get; set; }
        public string Note { get; set; }
    }

    public class SearchGovernanceAliasCreateData
    {
        public long TermId { get; set; }
        public string Alias { get; set; }
        public string MatchMode { get; set; }
        public string Status { get; set; }
        public string Note { get; set; }
    }

    public class SearchGovernanceRefreshHotStatsData
    {
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public int WindowDays { get; set; }
        public int RowCount { get; set; }
        public string LastUpdatedAt { get; set; }
    }

    public class SearchGovernanceRefreshHotStatsInputData
    {
        public int WindowDays { get; set; }
    }

    public class SearchGovernanceSyncTermsData
    {
        public int SourceTermCount { get; set; }
        public int FinalTermCount { get; set; }
        public bool PruneMissing { get; set; }
        public string SyncedAt { get; set; }
    }

    public class SearchGovernanceSyncTermsInputData
    {
        public bool PruneMissing { get; set; }
    }
}
