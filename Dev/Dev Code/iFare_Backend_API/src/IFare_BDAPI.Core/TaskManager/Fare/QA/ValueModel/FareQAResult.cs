using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.Fare.QA.ValueModel
{
    public class FareQAResult : ErrorInfoBase
    {
        public FareQAResult(ErrorInfoBase errorInfo, List<FareQAData> result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public List<FareQAData> Result { get; set; }
    }

    public class FareQAData : EditorUserBase
    {
        public long ID { get; set; }
        public string Question { get; set; }
        public string Answer { get; set; }
        public string State { get; set; }
    }
}