using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.SearchGovernance.ValueModel;

namespace IFare_BDAPI.TaskManager.SearchGovernance
{
    public interface ISearchGovernanceTaskManager : IDomainService
    {
        SearchGovernanceDashboardResult GetDashboard(string connectionString);
        SearchGovernanceTermResult GetTerms(string connectionString);
        SearchGovernanceAliasResult GetAliases(string connectionString);
        SearchGovernanceTermItemResult CreateTerm(string connectionString, SearchGovernanceTermCreateData createData);
        SearchGovernanceAliasItemResult CreateAlias(string connectionString, SearchGovernanceAliasCreateData createData);
        SearchGovernanceTermItemResult UpdateTerm(string connectionString, SearchGovernanceTermUpdateData updateData);
        SearchGovernanceAliasItemResult UpdateAlias(string connectionString, SearchGovernanceAliasUpdateData updateData);
        SearchGovernanceRefreshHotStatsResult RefreshHotStats(string connectionString, SearchGovernanceRefreshHotStatsInputData inputData);
        SearchGovernanceSyncTermsResult SyncTerms(string connectionString, SearchGovernanceSyncTermsInputData inputData);
    }
}
