
using System.Net.Mail;
using Abp.UI;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.Common
{
    public class CommonToolsManager : ICommonToolsManager
    {
        public CommonToolsManager()
        {

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
            return new UserFriendlyException(ErrAPI.ErrorInfoCode_Exception, $"【{ErrAPI.Msg_Exception}】: {message}");
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