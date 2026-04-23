using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Collaborator.Dto;
using IFare_BDAPI.Common.Dto;

namespace IFare_BDAPI.Collaborator
{
    public interface ICollaboratorAppService : IApplicationService
    {
        Task<CollaboratorResultDto> GetDataList(CollaboratorFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertCollaborator(CollaboratorInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateCollaborator(CollaboratorEditorDataDto editorData);
        Task<ErrorInfoBaseDto> DeleteCollaborator(CollaboratorDeleteDataDto deleteData);
    }
}