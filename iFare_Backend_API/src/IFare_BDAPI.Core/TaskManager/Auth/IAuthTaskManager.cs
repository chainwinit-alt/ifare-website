using Abp.Domain.Services;
using IFare_BDAPI.TaskManager.Auth.ValueModel;

namespace IFare_BDAPI.TaskManager.Auth
{
    public interface IAuthTaskManager : IDomainService
    {
        AuthUser GetAuthUser(string act, string pwd);
    }
}