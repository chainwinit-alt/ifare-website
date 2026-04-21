using Abp.Domain.Services;

namespace IFare_API.TaskManager.Img 
{
    public interface IImgTaskManager : IDomainService 
    {
        string GetImgPath(long imgID);
    }
}