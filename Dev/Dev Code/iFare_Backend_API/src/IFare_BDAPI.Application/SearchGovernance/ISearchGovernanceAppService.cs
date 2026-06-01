using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.SearchGovernance.Dto;

namespace IFare_BDAPI.SearchGovernance
{
    public interface ISearchGovernanceAppService : IApplicationService
    {
        Task<SearchGovernanceDashboardResultDto> GetDashboard();
        Task<SearchGovernanceTermResultDto> GetTerms();
        Task<SearchGovernanceAliasResultDto> GetAliases();
        Task<SearchGovernanceTermItemResultDto> CreateTerm(SearchGovernanceTermCreateDto input);
        Task<SearchGovernanceAliasItemResultDto> CreateAlias(SearchGovernanceAliasCreateDto input);
        Task<SearchGovernanceTermItemResultDto> UpdateTerm(SearchGovernanceTermUpdateDto input);
        Task<SearchGovernanceAliasItemResultDto> UpdateAlias(SearchGovernanceAliasUpdateDto input);
        Task<SearchGovernanceRefreshHotStatsResultDto> RefreshHotStats(SearchGovernanceRefreshHotStatsInputDto input);
        Task<SearchGovernanceSyncTermsResultDto> SyncTerms(SearchGovernanceSyncTermsInputDto input);
    }
}
