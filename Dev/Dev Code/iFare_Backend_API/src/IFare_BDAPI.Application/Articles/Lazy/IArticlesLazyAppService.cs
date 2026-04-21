using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Articles.Lazy.Dto;
using IFare_BDAPI.Common.Dto;

namespace IFare_BDAPI.Articles.Lazy
{
    public interface IArticlesLazyAppService : IApplicationService
    {
        Task<ArticlesLazyResultDto> GetDataList(ArticlesLazyFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertArticlesLazy(ArticlesLazyInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateArticlesLazy(ArticlesLazyEditorDataDto editorData);
        Task<ErrorInfoBaseDto> DeleteArticlesLazy(ArticlesLazyDeleteDataDto deleteData);
    }
}