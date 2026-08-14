using System.Linq;
using System.Text.RegularExpressions;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Common;
using IFare_BDAPI.TaskManager.Chatbot.Card.ValueModel;

namespace IFare_BDAPI.TaskManager.Chatbot.Card.Common
{
    public class InputChecker
    {
        /// <summary>卡片代號會出現在提示詞與前端比對邏輯中，限定為英數與連字號</summary>
        private static readonly Regex CardKeyPattern = new Regex("^[a-z0-9][a-z0-9-]{1,63}$");

        /// <summary>站內連結白名單，必須與前台 SITE_LINKS 一致</summary>
        private static readonly string[] AllowedLinkKeys =
            { "home", "about", "news", "articles", "collaborator", "ifare" };

        private ChatbotCardInsertData _insertData;
        private ChatbotCardEditorData _editorData;
        private readonly InputDataChecker _inputDataChecker;
        private string _errMsg = "NA";

        public InputChecker(ChatbotCardInsertData insertData)
        {
            _insertData = insertData;
            _inputDataChecker = new InputDataChecker();
        }

        public InputChecker(ChatbotCardEditorData editorData)
        {
            _editorData = editorData;
            _inputDataChecker = new InputDataChecker();
        }

        public bool IsCheckPass()
        {
            if (_insertData == null && _editorData == null)
            {
                _errMsg = ErrMsg.FormatFault;
                return false;
            }

            var data = (ChatbotCardInputData)_insertData ?? _editorData;
            data.State = data.IsEnabled ? DataState.Enabled : DataState.Disabled;

            if (_inputDataChecker.IsValStringNull(data.CardKey, TypeInput.CardKey)) return false;
            if (_inputDataChecker.IsValStringNull(data.Title, TypeInput.Title)) return false;
            if (_inputDataChecker.IsValStringNull(data.Keywords, TypeInput.Keywords)) return false;
            if (_inputDataChecker.IsValStringNull(data.Answer, TypeInput.Answer)) return false;

            if (!CardKeyPattern.IsMatch(data.CardKey.Trim().ToLower()))
            {
                _errMsg = "卡片代號僅能使用小寫英文、數字與連字號，長度 2 至 64 字元。";
                return false;
            }

            if (!IsLinkKeysValid(data.LinkKeys))
            {
                _errMsg = "站內連結代號僅能使用 " + string.Join("、", AllowedLinkKeys) + "，且最多 2 個。";
                return false;
            }

            if (data.Priority <= 0 || data.Priority > 1)
            {
                _errMsg = "比對權重需介於 0（不含）到 1 之間。";
                return false;
            }

            return true;
        }

        private bool IsLinkKeysValid(string linkKeys)
        {
            if (string.IsNullOrWhiteSpace(linkKeys)) return true;

            var keys = linkKeys
                .Split(new[] { ',', '，', '\n' })
                .Select(item => item.Trim().ToLower())
                .Where(item => !string.IsNullOrEmpty(item))
                .ToList();

            if (keys.Count > 2) return false;

            return keys.All(key => AllowedLinkKeys.Contains(key));
        }

        public string GetErrMsg()
        {
            return _errMsg != "NA" ? _errMsg : _inputDataChecker.GetErrMsg();
        }
    }
}
