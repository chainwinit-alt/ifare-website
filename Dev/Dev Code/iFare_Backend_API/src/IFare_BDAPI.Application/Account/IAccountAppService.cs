using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Account.Dto;
using IFare_BDAPI.Common.Dto;

namespace IFare_BDAPI.Account
{
    public interface IAccountAppService : IApplicationService
    {
        Task<AccountResultDto> GetAccountList(AccountFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertAccount(AccountInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateAccount(AccountEditorDataDto editorData);
    }
}