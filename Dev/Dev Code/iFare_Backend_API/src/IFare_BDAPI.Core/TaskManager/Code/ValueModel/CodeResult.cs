using System;
using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.Code.ValueModel
{
    public class CodeResult : ErrorInfoBase
    {
        public CodeResult(ErrorInfoBase errorInfo, List<CodeData> result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public List<CodeData> Result { get; set; }
    }

    public class CodeData : EditorUserBase
    {
        public long ID { get; set; }
        public string LabelName { get; set; }
        public string State { get; set; }
    }
}