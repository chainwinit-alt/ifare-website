using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Account.ValueModel;

namespace IFare_BDAPI.TaskManager.Account
{
    public interface IAccountTaskManager : IDomainService
    {
        AccountResult GetAccountList(AccountFilterParam param, long searchUserID);
        ErrorInfoBase InsertAccount(AccountInsertData insertData);
        ErrorInfoBase UpdateAccount(AccountEditorData editorData);
        bool IsPermissionEditor(long actID);
    }
}