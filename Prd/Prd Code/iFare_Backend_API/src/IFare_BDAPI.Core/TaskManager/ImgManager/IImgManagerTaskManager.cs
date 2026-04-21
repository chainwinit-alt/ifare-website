using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.ImgManager.ValueModel;

namespace IFare_BDAPI.TaskManager.ImgManager
{
    public interface IImgManagerTaskManager : IDomainService 
    {
        ErrorInfoBase InsertImg(ImgManagerInsertData insertData);
        ErrorInfoBase EditImg(ImgManagerEditData editData);
        ErrorInfoBase DeleteImg(long imgID);
        ImgManagerResult GetImgManageList(ImgManagerFilterParam param);
    }
}