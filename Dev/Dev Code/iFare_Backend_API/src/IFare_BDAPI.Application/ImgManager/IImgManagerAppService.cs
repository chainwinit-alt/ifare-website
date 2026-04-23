using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.ImgManager.Dto;

namespace IFare_BDAPI.ImgManager
{
    public interface IImgManagerAppService : IApplicationService
    {
        ErrorInfoBaseDto InsertImg(ImgManagerInsertDataDto insertData);
        ErrorInfoBaseDto EditImg(ImgManagerEditDataDto editData);
        ErrorInfoBaseDto DeleteImg(long imgID);
        ImgManagerResultDto GetImgManagerList(ImgManagerFilterParamDto param);
    }
}