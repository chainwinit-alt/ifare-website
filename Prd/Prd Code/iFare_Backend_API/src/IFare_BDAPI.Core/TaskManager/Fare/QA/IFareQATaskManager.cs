using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Fare.QA.ValueModel;

namespace IFare_BDAPI.TaskManager.Fare.QA 
{
    public interface IFareQATaskManager : IDomainService
    {
        FareQAResult GetDataList(FareQAFilterParam param);
        ErrorInfoBase InsertFareQA(FareQAInsertData insertData);
        ErrorInfoBase UpdateFareQA(FareQAEditorData editorData);
        ErrorInfoBase DeleteFareQA(FareQADeleteData deleteData);
    }
}