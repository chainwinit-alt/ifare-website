using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Common;
using IFare_BDAPI.TaskManager.Fare.Policy.ValueModel;
using IFare_BDAPI.TaskManager.Fare.QA.ValueModel;

namespace IFare_BDAPI.TaskManager.Fare.QA.Common
{
    public class InputChecker
    {
        private FareQAInsertData _insertData;
        private FareQAEditorData _editorData;
        private readonly InputDataChecker _inputDataChecker;
        private string _errMsg = "NA";
        public InputChecker(FareQAInsertData insertData)
        {
            _insertData = insertData;
            _inputDataChecker = new InputDataChecker();
        }

        public InputChecker(FareQAEditorData editorData)
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
                if (_inputDataChecker.IsValStringNull(_insertData.Question, TypeInput.Question)) return false;
                if (_inputDataChecker.IsValStringNull(_insertData.Answer, TypeInput.Answer)) return false;
                return true;
            }

            if (_editorData != null)
            {
                _editorData.State = _editorData.IsEnabled ? DataState.Enabled : DataState.Disabled;
                if (_inputDataChecker.IsValStringNull(_editorData.Question, TypeInput.Question)) return false;
                if (_inputDataChecker.IsValStringNull(_editorData.Answer, TypeInput.Answer)) return false;
            }

            return true;
        }

        public string GetErrMsg()
        {
            return _errMsg != "NA" ? _errMsg : _inputDataChecker.GetErrMsg();
        }
    }
}