using Abp.Domain.Services;
using IFare_API.TaskManager.Collaborator.ValueModel;

namespace IFare_API.TaskManager.Collaborator
{
    public interface ICollaboratorTaskManager : IDomainService
    {
        CollaboratorResult GetCollaboratorList();
    }
}