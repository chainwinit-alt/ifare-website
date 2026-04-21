using System.Linq;
using Abp.Domain.Repositories;
using IFare_API.Common;
using IFare_API.Constants;
using IFare_API.TaskManager.Collaborator.ValueModel;
using Microsoft.EntityFrameworkCore;

namespace IFare_API.TaskManager.Collaborator
{
    public class CollaboratorTaskManager : ICollaboratorTaskManager
    {
        private readonly IRepository<IFare_API.Collaborator> _repositoryCollaborator;
        private readonly ICommonToolsManager _commonTools;
        public CollaboratorTaskManager(IRepository<IFare_API.Collaborator> repositoryCollaborator,
                                ICommonToolsManager commonTools)
        {
            _repositoryCollaborator = repositoryCollaborator;
            _commonTools = commonTools;
        }

        public CollaboratorResult GetCollaboratorList()
        {
            var list = _repositoryCollaborator.GetAll()
                                    .Include(p => p.Images)
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                    .Select(p => new CollaboratorData 
                                    {
                                        ID = p.Id,
                                        Title = p.Title,
                                        ServiceItem = p.ServiceItem,
                                        Tel = p.Tel,
                                        Url = p.Url,
                                        ImageFile = p.Images.ImagePath,
                                        ImageName = p.Images.ImageName,
                                        ImageExtension = p.Images.ImageNameExtension
                                    })
                                    .ToList();
            return new CollaboratorResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }
    }
}