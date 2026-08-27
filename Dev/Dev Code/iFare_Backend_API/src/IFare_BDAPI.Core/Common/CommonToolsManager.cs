
using System.Net.Mail;
using Abp.UI;
using Castle.Core.Logging;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.Common
{
    public class CommonToolsManager : ICommonToolsManager
    {
        // 由 ABP（Castle Windsor）屬性注入，未注入時退回 NullLogger 以免 NRE
        public ILogger Logger { get; set; }

        public CommonToolsManager()
        {
            Logger = NullLogger.Instance;
        }

        public ErrorInfoBase GetErrorInfo_API(float errCode)
        {
            return ErrAPI.RefDict[errCode];
        }

        public ErrorInfoBase GetErrorInfo_APIWithMsg(float errCode, string message)
        {
            var ERROR = ErrAPI.RefDict[errCode];
            return new ErrorInfoBase(ERROR.ErrCode, $"【{ERROR.ErrMsg}】: {message}");
        }

        public UserFriendlyException GetErrorInfo_Exception(string message)
        {
            // 例外細節只寫入 log，對外一律回通用訊息，避免洩漏堆疊、連線字串或 SQL 內容
            Logger.Error($"【{ErrAPI.Msg_Exception}】: {message}");
            return new UserFriendlyException(ErrAPI.ErrorInfoCode_Exception, ErrAPI.Msg_Exception);
        }

        public bool IsMailValid(string mail)
        {
            var valid = true;

            try 
            {
                var emailAddress = new MailAddress(mail);
            }
            catch
            {
                valid = false;
            }

            return valid;
        }
    }
}