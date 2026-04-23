using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Collaborator.ValueModel;

namespace IFare_BDAPI.TaskManager.Collaborator 
{
    public interface ICollaboratorTaskManager : IDomainService
    {
        CollaboratorResult GetDataList(CollaboratorFilterParam param);
        ErrorInfoBase InsertCollaborator(CollaboratorInsertData insertData);
        ErrorInfoBase UpdateCollaborator(CollaboratorEditorData editorData);
        ErrorInfoBase DeleteCollaborator(CollaboratorDeleteData deleteData);
    }
}