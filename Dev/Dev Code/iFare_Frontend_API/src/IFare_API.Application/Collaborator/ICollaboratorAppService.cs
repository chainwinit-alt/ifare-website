using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Collaborator.Dto;

namespace IFare_API.Collaborator
{
    public interface ICollaboratorAppService : IApplicationService 
    {
        Task<CollaboratorResultDto> GetCollaboratorList();
    }
}