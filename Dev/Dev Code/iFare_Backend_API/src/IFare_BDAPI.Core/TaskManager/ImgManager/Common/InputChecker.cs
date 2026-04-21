using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Common;
using IFare_BDAPI.TaskManager.ImgManager.ValueModel;

namespace IFare_BDAPI.TaskManager.ImgManager.Common
{
    public class InputChecker
    {
        private ImgManagerInsertData _insertData;
        private ImgManagerEditData _editorData;
        private readonly InputDataChecker _inputDataChecker;
        private string _errMsg = "NA";
        public InputChecker(ImgManagerInsertData insertData)
        {
            _insertData = insertData;
            _inputDataChecker = new InputDataChecker();
        }

        public InputChecker(ImgManagerEditData editorData)
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
                if (_inputDataChecker.IsValStringNull(_insertData.Title, TypeInput.Title)) return false;
                if (!_inputDataChecker.IsImgManagerType(_insertData.Type)) return false;
            }

            if (_editorData != null)
            {
                if (_inputDataChecker.IsValStringNull(_editorData.Title, TypeInput.Title)) return false;
                if (!_inputDataChecker.IsImgManagerType(_editorData.Type)) return false;
            }

            return true;
        }

        public string GetErrMsg()
        {
            return _errMsg != "NA" ? _errMsg : _inputDataChecker.GetErrMsg();
        }
    }
}