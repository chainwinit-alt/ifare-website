using System;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using IFare_BDAPI.TaskManager.Common;

namespace IFare_BDAPI.TaskManager.Code.Common
{
    public class InputChecker
    {
        private CodeInsertData _insertData;
        private CodeEditorData _editorData;
        private readonly InputDataChecker _inputDataChecker;
        private string _errMsg = "NA";
        public InputChecker(CodeInsertData insertData) 
        {
            _insertData = insertData;
            _inputDataChecker = new InputDataChecker();
        }

        public InputChecker(CodeEditorData editorData) 
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
                return !_inputDataChecker.IsValStringNull(_insertData.LabelName, TypeInput.Name);
            }

            if (_editorData != null) 
            {
                _editorData.State = _editorData.IsEnabled ? DataState.Enabled : DataState.Disabled;
                return !_inputDataChecker.IsValStringNull(_editorData.LabelName, TypeInput.Name);
            }

            return true;
        }

        public string GetErrMsg()
        {
            return _errMsg != "NA" ? _errMsg : _inputDataChecker.GetErrMsg();
        }
    }
}