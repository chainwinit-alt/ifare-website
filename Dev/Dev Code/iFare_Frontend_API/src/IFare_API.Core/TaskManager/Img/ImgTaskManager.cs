using System.Linq;
using Abp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace IFare_API.TaskManager.Img 
{
    public class ImgTaskManager : IImgTaskManager 
    {
        private readonly IRepository<ImgManage> _repositoryImgManage;
        public ImgTaskManager(IRepository<ImgManage> repositoryImgManage)
        {
            _repositoryImgManage = repositoryImgManage;
        }

        public string GetImgPath(long imgID)
        {
            return _repositoryImgManage.GetAll()
                                    .Where(p => p.Id == imgID)
                                    .AsNoTracking()
                                    .Select(p => p.ImgPath)
                                    .AsEnumerable()
                                    .FirstOrDefault("");
        }
    }
}