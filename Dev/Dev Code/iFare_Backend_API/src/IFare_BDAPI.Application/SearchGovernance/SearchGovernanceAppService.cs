using System.Linq;
using System.Threading.Tasks;
using Abp;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.SearchGovernance.Dto;
using IFare_BDAPI.TaskManager.SearchGovernance;
using IFare_BDAPI.TaskManager.SearchGovernance.ValueModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace IFare_BDAPI.SearchGovernance
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class SearchGovernanceAppService : AbpServiceBase, ISearchGovernanceAppService
    {
        private readonly ISearchGovernanceTaskManager _searchGovernanceTaskManager;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public SearchGovernanceAppService(
            ISearchGovernanceTaskManager searchGovernanceTaskManager,
            IConfiguration configuration,
            IWebHostEnvironment environment)
        {
            _searchGovernanceTaskManager = searchGovernanceTaskManager;
            _configuration = configuration;
            _environment = environment;
        }

        public async Task<SearchGovernanceDashboardResultDto> GetDashboard()
        {
            var result = _searchGovernanceTaskManager.GetDashboard(ResolveIFareConnectionString());
            return new SearchGovernanceDashboardResultDto
            {
                ErrCode = result.ErrCode,
                ErrMsg = result.ErrMsg,
                Result = result.Result == null ? null : new SearchGovernanceDashboardDataDto
                {
                    OverviewStats = result.Result.OverviewStats.Select(item => new SearchGovernanceOverviewStatDto
                    {
                        Key = item.Key,
                        Label = item.Label,
                        Value = item.Value,
                        Delta = item.Delta,
                        Tone = item.Tone
                    }).ToList(),
                    TrendPoints = result.Result.TrendPoints.Select(item => new SearchGovernanceTrendPointDto
                    {
                        Label = item.Label,
                        Value = item.Value
                    }).ToList(),
                    QueueItems = result.Result.QueueItems.Select(MapQueueItem).ToList(),
                    TopTerms = result.Result.TopTerms.Select(MapTerm).ToList()
                }
            };
        }

        public async Task<SearchGovernanceTermResultDto> GetTerms()
        {
            var result = _searchGovernanceTaskManager.GetTerms(ResolveIFareConnectionString());
            return new SearchGovernanceTermResultDto
            {
                ErrCode = result.ErrCode,
                ErrMsg = result.ErrMsg,
                Result = result.Result?.Select(MapTerm).ToList()
            };
        }

        public async Task<SearchGovernanceAliasResultDto> GetAliases()
        {
            var result = _searchGovernanceTaskManager.GetAliases(ResolveIFareConnectionString());
            return new SearchGovernanceAliasResultDto
            {
                ErrCode = result.ErrCode,
                ErrMsg = result.ErrMsg,
                Result = result.Result?.Select(MapAlias).ToList()
            };
        }

        [HttpPost]
        public async Task<SearchGovernanceTermItemResultDto> CreateTerm(SearchGovernanceTermCreateDto input)
        {
            var result = _searchGovernanceTaskManager.CreateTerm(ResolveIFareConnectionString(), new SearchGovernanceTermCreateData
            {
                DisplayTerm = input.DisplayTerm,
                TermType = input.TermType,
                SourceKind = input.SourceKind,
                Status = input.Status,
                ManualBoost = input.ManualBoost,
                BaseWeight = input.BaseWeight
            });

            return new SearchGovernanceTermItemResultDto
            {
                ErrCode = result.ErrCode,
                ErrMsg = result.ErrMsg,
                Result = result.Result == null ? null : MapTerm(result.Result)
            };
        }

        [HttpPost]
        public async Task<SearchGovernanceTermItemResultDto> UpdateTerm(SearchGovernanceTermUpdateDto input)
        {
            var result = _searchGovernanceTaskManager.UpdateTerm(ResolveIFareConnectionString(), new SearchGovernanceTermUpdateData
            {
                Id = input.Id,
                DisplayTerm = input.DisplayTerm,
                TermType = input.TermType,
                SourceKind = input.SourceKind,
                Status = input.Status,
                ManualBoost = input.ManualBoost,
                BaseWeight = input.BaseWeight
            });

            return new SearchGovernanceTermItemResultDto
            {
                ErrCode = result.ErrCode,
                ErrMsg = result.ErrMsg,
                Result = result.Result == null ? null : MapTerm(result.Result)
            };
        }

        [HttpPost]
        public async Task<SearchGovernanceAliasItemResultDto> CreateAlias(SearchGovernanceAliasCreateDto input)
        {
            var result = _searchGovernanceTaskManager.CreateAlias(ResolveIFareConnectionString(), new SearchGovernanceAliasCreateData
            {
                TermId = input.TermId,
                Alias = input.Alias,
                MatchMode = input.MatchMode,
                Status = input.Status,
                Note = input.Note
            });

            return new SearchGovernanceAliasItemResultDto
            {
                ErrCode = result.ErrCode,
                ErrMsg = result.ErrMsg,
                Result = result.Result == null ? null : MapAlias(result.Result)
            };
        }

        [HttpPost]
        public async Task<SearchGovernanceAliasItemResultDto> UpdateAlias(SearchGovernanceAliasUpdateDto input)
        {
            var result = _searchGovernanceTaskManager.UpdateAlias(ResolveIFareConnectionString(), new SearchGovernanceAliasUpdateData
            {
                Id = input.Id,
                TermId = input.TermId,
                Alias = input.Alias,
                MatchMode = input.MatchMode,
                Status = input.Status,
                Note = input.Note
            });

            return new SearchGovernanceAliasItemResultDto
            {
                ErrCode = result.ErrCode,
                ErrMsg = result.ErrMsg,
                Result = result.Result == null ? null : MapAlias(result.Result)
            };
        }

        [HttpPost]
        public async Task<SearchGovernanceRefreshHotStatsResultDto> RefreshHotStats(SearchGovernanceRefreshHotStatsInputDto input)
        {
            var result = _searchGovernanceTaskManager.RefreshHotStats(ResolveIFareConnectionString(), new SearchGovernanceRefreshHotStatsInputData
            {
                WindowDays = input?.WindowDays ?? 30
            });

            return new SearchGovernanceRefreshHotStatsResultDto
            {
                ErrCode = result.ErrCode,
                ErrMsg = result.ErrMsg,
                Result = result.Result == null
                    ? null
                    : new SearchGovernanceRefreshHotStatsDto
                    {
                        StartDate = result.Result.StartDate,
                        EndDate = result.Result.EndDate,
                        WindowDays = result.Result.WindowDays,
                        RowCount = result.Result.RowCount,
                        LastUpdatedAt = result.Result.LastUpdatedAt
                    }
            };
        }

        [HttpPost]
        public async Task<SearchGovernanceSyncTermsResultDto> SyncTerms(SearchGovernanceSyncTermsInputDto input)
        {
            var result = _searchGovernanceTaskManager.SyncTerms(ResolveIFareConnectionString(), new SearchGovernanceSyncTermsInputData
            {
                PruneMissing = input?.PruneMissing == true
            });

            return new SearchGovernanceSyncTermsResultDto
            {
                ErrCode = result.ErrCode,
                ErrMsg = result.ErrMsg,
                Result = result.Result == null
                    ? null
                    : new SearchGovernanceSyncTermsDto
                    {
                        SourceTermCount = result.Result.SourceTermCount,
                        FinalTermCount = result.Result.FinalTermCount,
                        PruneMissing = result.Result.PruneMissing,
                        SyncedAt = result.Result.SyncedAt
                    }
            };
        }

        private string ResolveIFareConnectionString()
        {
            var key = _environment.EnvironmentName == "Development" ? "Local_IFare" : "IFare";
            return _configuration.GetConnectionString(key) ?? _configuration.GetConnectionString("IFare");
        }

        private static SearchGovernanceTermDto MapTerm(SearchGovernanceTermData item)
        {
            return new SearchGovernanceTermDto
            {
                Id = item.Id,
                DisplayTerm = item.DisplayTerm,
                NormalizedTerm = item.NormalizedTerm,
                TermType = item.TermType,
                SourceKind = item.SourceKind,
                Status = item.Status,
                ManualBoost = item.ManualBoost,
                BaseWeight = item.BaseWeight,
                HotScore7d = item.HotScore7d,
                SearchCount30d = item.SearchCount30d,
                LastUpdated = item.LastUpdated,
                AliasCount = item.AliasCount,
                Note = item.Note
            };
        }

        private static SearchGovernanceAliasDto MapAlias(SearchGovernanceAliasData item)
        {
            return new SearchGovernanceAliasDto
            {
                Id = item.Id,
                Alias = item.Alias,
                NormalizedAlias = item.NormalizedAlias,
                TermId = item.TermId,
                TargetTerm = item.TargetTerm,
                TargetType = item.TargetType,
                MatchMode = item.MatchMode,
                Status = item.Status,
                Source = item.Source,
                UpdatedBy = item.UpdatedBy,
                LastUpdated = item.LastUpdated,
                Note = item.Note
            };
        }

        private static SearchGovernanceQueueItemDto MapQueueItem(SearchGovernanceQueueItemData item)
        {
            return new SearchGovernanceQueueItemDto
            {
                Id = item.Id,
                Query = item.Query,
                Status = item.Status,
                Searches7d = item.Searches7d,
                ResultCount = item.ResultCount,
                Suggestion = item.Suggestion,
                Owner = item.Owner
            };
        }
    }
}
