using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.News.Dto;

namespace IFare_BDAPI.News
{
    public interface INewsAppService : IApplicationService
    {
        Task<NewsResultDto> GetDataList(NewsFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertNews(NewsInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateNews(NewsEditorDataDto editorData);
        Task<ErrorInfoBaseDto> DeleteNews(NewsDeleteDataDto deleteData);
    }
}