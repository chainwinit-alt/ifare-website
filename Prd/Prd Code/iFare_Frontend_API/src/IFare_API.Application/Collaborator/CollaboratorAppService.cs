using System.Threading.Tasks;
using Abp;
using IFare_API.Collaborator.Dto;
using IFare_API.TaskManager.Collaborator;

namespace IFare_API.Collaborator
{
    public class CollaboratorAppService : AbpServiceBase, ICollaboratorAppService
    {
        private readonly ICollaboratorTaskManager _taskManager;
        public CollaboratorAppService(ICollaboratorTaskManager taskManager) 
        {
            _taskManager = taskManager;
        }

        public async Task<CollaboratorResultDto> GetCollaboratorList()
        {
            var result = _taskManager.GetCollaboratorList();
            return ObjectMapper.Map<CollaboratorResultDto>(result);
        }
    }
}