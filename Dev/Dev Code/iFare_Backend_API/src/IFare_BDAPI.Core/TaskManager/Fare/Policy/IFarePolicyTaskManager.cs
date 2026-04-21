using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Fare.Policy.ValueModel;

namespace IFare_BDAPI.TaskManager.Fare.Policy 
{
    public interface IFarePolicyTaskManager : IDomainService
    {
        FarePolicyResult GetDataList(FarePolicyFilterParam param);
        ErrorInfoBase InsertFarePolicy(FarePolicyInsertData insertData);
        ErrorInfoBase UpdateFarePolicy(FarePolicyEditorData editorData);
        ErrorInfoBase DeleteFarePolicy(FarePolicyDeleteData deleteData);
    }
}