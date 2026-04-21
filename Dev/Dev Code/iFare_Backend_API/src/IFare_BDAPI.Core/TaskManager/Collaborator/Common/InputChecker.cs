using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Articles.Welfare.ValueModel;
using IFare_BDAPI.TaskManager.Collaborator.ValueModel;
using IFare_BDAPI.TaskManager.Common;

namespace IFare_BDAPI.TaskManager.Collaborator.Common
{
    public class InputChecker
    {
        private CollaboratorInsertData _insertData;
        private CollaboratorEditorData _editorData;
        private readonly InputDataChecker _inputDataChecker;
        private string _errMsg = "NA";
        public InputChecker(CollaboratorInsertData insertData)
        {
            _insertData = insertData;
            _inputDataChecker = new InputDataChecker();
        }

        public InputChecker(CollaboratorEditorData editorData)
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
                if (_inputDataChecker.IsValStringNull(_insertData.Title, TypeInput.Title)) return false;
                if (_inputDataChecker.IsValStringNull(_insertData.ServiceItem, TypeInput.ServiceItem)) return false;
                if (_inputDataChecker.IsValStringNull(_insertData.Tel, TypeInput.Tel)) return false;
                if (_inputDataChecker.IsValStringNull(_insertData.Url, TypeInput.Url)) return false;
                return true;
            }

            if (_editorData != null)
            {
                _editorData.State = _editorData.IsEnabled ? DataState.Enabled : DataState.Disabled;
                if (_inputDataChecker.IsValStringNull(_editorData.Title, TypeInput.Title)) return false;
                if (_inputDataChecker.IsValStringNull(_editorData.ServiceItem, TypeInput.ServiceItem)) return false;
                if (_inputDataChecker.IsValStringNull(_editorData.Tel, TypeInput.Tel)) return false;
                if (_inputDataChecker.IsValStringNull(_editorData.Url, TypeInput.Url)) return false;
            }

            return true;
        }

        public string GetErrMsg()
        {
            return _errMsg != "NA" ? _errMsg : _inputDataChecker.GetErrMsg();
        }
    }
}