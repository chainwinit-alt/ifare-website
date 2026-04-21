using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using IFare_BDAPI.TaskManager.Personal.ValueModel;

namespace IFare_BDAPI.TaskManager.Personal
{
    public interface IPersonalTaskManager : IDomainService
    {
        PersonalResult GetPersonalInfo(long userID);
        ErrorInfoBase UpdatePersonalInfo(PersonalReq req);
        ErrorInfoBase UpdatePersonalPwd(PersonalReq req);
    }
}