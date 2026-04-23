using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Fare.OfficeUnit.ValueModel;

namespace IFare_BDAPI.TaskManager.Fare.OfficeUnit 
{
    public interface IFareOfficeUnitTaskManager : IDomainService
    {
        FareOfficeUnitResult GetDataList(FareOfficeUnitFilterParam param);
        ErrorInfoBase InsertFareOfficeUnit(FareOfficeUnitInsertData insertData);
        ErrorInfoBase UpdateFareOfficeUnit(FareOfficeUnitEditorData editorData);
    }
}