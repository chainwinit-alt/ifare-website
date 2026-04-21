using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Articles.Welfare.Dto;
using IFare_BDAPI.Common.Dto;

namespace IFare_BDAPI.Articles.Welfare
{
    public interface IArticlesWelfareAppService : IApplicationService
    {
        Task<ArticlesWelfareResultDto> GetDataList(ArticlesWelfareFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertArticlesWelfare(ArticlesWelfareInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateArticlesWelfare(ArticlesWelfareEditorDataDto editorData);
        Task<ErrorInfoBaseDto> DeleteArticlesWelfare(ArticlesWelfareDeleteDataDto deleteData);
    }
}