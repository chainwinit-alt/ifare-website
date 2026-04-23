using Abp.Domain.Services;
using Abp.UI;
using IFare_API.Common.ValueModel;

namespace IFare_API.Common
{
    public interface ICommonToolsManager : IDomainService
    {
        ErrorInfoBase GetErrorInfo_API(float errCode);
        ErrorInfoBase GetErrorInfo_APIWithMsg(float errCode, string message);
        UserFriendlyException GetErrorInfo_Exception(string message);
        string GetHTMLContent(string decodehtml);
        string GetTopsContent(string encodeHtml, int maxLength = 0);
    }
}