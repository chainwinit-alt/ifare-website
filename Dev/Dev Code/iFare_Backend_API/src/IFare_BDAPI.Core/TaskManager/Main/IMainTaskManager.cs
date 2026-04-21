using Abp.Domain.Services;
using IFare_BDAPI.TaskManager.Main.ValueModel;
using IFare_BDAPI.TaskManager.Personal.ValueModel;

namespace IFare_BDAPI.TaskManager.Main
{
    public interface IMainTaskManager : IDomainService
    {
        PersonalResult LoginCheck(LoginParam param);
    }
}