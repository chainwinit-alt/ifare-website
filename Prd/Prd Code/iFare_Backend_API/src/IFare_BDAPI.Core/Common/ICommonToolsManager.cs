using Abp.Domain.Services;
using Abp.UI;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.Common
{
    public interface ICommonToolsManager : IDomainService
    {
        ErrorInfoBase GetErrorInfo_API(float errCode);
        ErrorInfoBase GetErrorInfo_APIWithMsg(float errCode, string message);
        UserFriendlyException GetErrorInfo_Exception(string message);
        bool IsMailValid(string mail);
    }
}