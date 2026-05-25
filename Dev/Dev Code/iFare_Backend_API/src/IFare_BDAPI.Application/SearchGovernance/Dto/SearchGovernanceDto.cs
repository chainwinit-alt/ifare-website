using System.Collections.Generic;
using IFare_BDAPI.Common.Dto;

namespace IFare_BDAPI.SearchGovernance.Dto
{
    public class SearchGovernanceDashboardResultDto : ErrorInfoBaseDto
    {
        public SearchGovernanceDashboardDataDto Result { get; set; }
    }

    public class SearchGovernanceTermResultDto : ErrorInfoBaseDto
    {
        public List<SearchGovernanceTermDto> Result { get; set; }
    }

    public class SearchGovernanceAliasResultDto : ErrorInfoBaseDto
    {
        public List<SearchGovernanceAliasDto> Result { get; set; }
    }

    public class SearchGovernanceTermItemResultDto : ErrorInfoBaseDto
    {
        public SearchGovernanceTermDto Result { get; set; }
    }

    public class SearchGovernanceAliasItemResultDto : ErrorInfoBaseDto
    {
        public SearchGovernanceAliasDto Result { get; set; }
    }

    public class SearchGovernanceRefreshHotStatsResultDto : ErrorInfoBaseDto
    {
        public SearchGovernanceRefreshHotStatsDto Result { get; set; }
    }

    public class SearchGovernanceSyncTermsResultDto : ErrorInfoBaseDto
    {
        public SearchGovernanceSyncTermsDto Result { get; set; }
    }

    public class SearchGovernanceDashboardDataDto
    {
        public List<SearchGovernanceOverviewStatDto> OverviewStats { get; set; }
        public List<SearchGovernanceTrendPointDto> TrendPoints { get; set; }
        public List<SearchGovernanceQueueItemDto> QueueItems { get; set; }
        public List<SearchGovernanceTermDto> TopTerms { get; set; }
    }

    public class SearchGovernanceOverviewStatDto
    {
        public string Key { get; set; }
        public string Label { get; set; }
        public string Value { get; set; }
        public string Delta { get; set; }
        public string Tone { get; set; }
    }

    public class SearchGovernanceTrendPointDto
    {
        public string Label { get; set; }
        public int Value { get; set; }
    }

    public class SearchGovernanceQueueItemDto
    {
        public string Id { get; set; }
        public string Query { get; set; }
        public string Status { get; set; }
        public int Searches7d { get; set; }
        public int ResultCount { get; set; }
        public string Suggestion { get; set; }
        public string Owner { get; set; }
    }

    public class SearchGovernanceTermDto
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

    public class SearchGovernanceAliasDto
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

    public class SearchGovernanceTermUpdateDto
    {
        public long Id { get; set; }
        public string DisplayTerm { get; set; }
        public string TermType { get; set; }
        public string SourceKind { get; set; }
        public string Status { get; set; }
        public double ManualBoost { get; set; }
        public double BaseWeight { get; set; }
    }

    public class SearchGovernanceTermCreateDto
    {
        public string DisplayTerm { get; set; }
        public string TermType { get; set; }
        public string SourceKind { get; set; }
        public string Status { get; set; }
        public double ManualBoost { get; set; }
        public double BaseWeight { get; set; }
    }

    public class SearchGovernanceAliasUpdateDto
    {
        public long Id { get; set; }
        public long TermId { get; set; }
        public string Alias { get; set; }
        public string MatchMode { get; set; }
        public string Status { get; set; }
        public string Note { get; set; }
    }

    public class SearchGovernanceAliasCreateDto
    {
        public long TermId { get; set; }
        public string Alias { get; set; }
        public string MatchMode { get; set; }
        public string Status { get; set; }
        public string Note { get; set; }
    }

    public class SearchGovernanceRefreshHotStatsDto
    {
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public int WindowDays { get; set; }
        public int RowCount { get; set; }
        public string LastUpdatedAt { get; set; }
    }

    public class SearchGovernanceRefreshHotStatsInputDto
    {
        public int WindowDays { get; set; } = 30;
    }

    public class SearchGovernanceSyncTermsDto
    {
        public int SourceTermCount { get; set; }
        public int FinalTermCount { get; set; }
        public bool PruneMissing { get; set; }
        public string SyncedAt { get; set; }
    }

    public class SearchGovernanceSyncTermsInputDto
    {
        public bool PruneMissing { get; set; }
    }
}
