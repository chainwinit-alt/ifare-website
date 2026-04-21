using System.Text.RegularExpressions;
using System.Web;
using Abp.UI;
using IFare_API.Common.ValueModel;
using IFare_API.Constants;

namespace IFare_API.Common
{
    public class CommonToolsManager : ICommonToolsManager
    {
        private const int TOPINFOMAXLEN = 50;
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

        public string GetHTMLContent(string decodehtml)
        {
            return Regex.Replace(decodehtml, "<.*?>", string.Empty);
        }

        public string GetTopsContent(string encodeHtml, int maxLength = 0)
        {
            var decodeHtml = System.Uri.UnescapeDataString(encodeHtml);
            decodeHtml = HttpUtility.HtmlDecode(decodeHtml);
            var _content = GetHTMLContent(decodeHtml);
            var contentLength = _content.Length;
            var _txtMaxLength = maxLength <= 0 ? TOPINFOMAXLEN : maxLength;

            return $"{_content.Substring(0, contentLength > _txtMaxLength ? _txtMaxLength : contentLength)}...";
        }
    }
}