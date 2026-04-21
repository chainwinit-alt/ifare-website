using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Account.ValueModel;
using IFare_BDAPI.TaskManager.Common;

namespace IFare_BDAPI.TaskManager.Account.Common
{
    public class InputChecker
    {
        private AccountInsertData _insertData;
        private AccountEditorData _editorData;
        private readonly InputDataChecker _inputDataChecker;
        private string _errMsg = "NA";
        public InputChecker(AccountInsertData insertData)
        {
            _insertData = insertData;
            _inputDataChecker = new InputDataChecker();
        }

        public InputChecker(AccountEditorData editorData)
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

            if (_insertData != null)
            {
                _insertData.State = _insertData.IsEnabled ? DataState.Enabled : DataState.Disabled;
                if (_inputDataChecker.IsValStringNull(_insertData.UserName, TypeInput.UserName)) return false;
                if (_inputDataChecker.IsValStringNull(_insertData.Account, TypeInput.Account)) return false;
                if (_inputDataChecker.IsValStringNull(_insertData.Email, TypeInput.Email)) return false;
                if (!_inputDataChecker.IsUserPermissionPass(_insertData.Permission)) return false;

                if (!_inputDataChecker.IsPwdDoublePass(_insertData.Pwd, _insertData.PwdConfirm)) return false;
                if (!_inputDataChecker.IsPwdMatchRule(_insertData.Pwd)) return false;

                return true;
            }

            if (_editorData != null)
            {
                _editorData.State = _editorData.IsEnabled ? DataState.Enabled : DataState.Disabled;
                if (_inputDataChecker.IsValStringNull(_editorData.UserName, TypeInput.UserName)) return false;
                if (_inputDataChecker.IsValStringNull(_editorData.Account, TypeInput.Account)) return false;
                if (_inputDataChecker.IsValStringNull(_editorData.Email, TypeInput.Email)) return false;
                if (!_inputDataChecker.IsUserPermissionPass(_editorData.Permission)) return false;
            }

            return true;
        }

        public string GetErrMsg()
        {
            return _errMsg != "NA" ? _errMsg : _inputDataChecker.GetErrMsg();
        }
    }
}