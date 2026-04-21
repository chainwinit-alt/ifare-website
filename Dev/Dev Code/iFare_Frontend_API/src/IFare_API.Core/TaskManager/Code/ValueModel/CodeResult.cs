using System.Collections.Generic;
using IFare_API.Common.ValueModel;

namespace IFare_API.TaskManager.Code.ValueModel
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

    public class CodeData 
    {
        public long ID { get; set; }
        public string CodeName { get; set; }
    }
}