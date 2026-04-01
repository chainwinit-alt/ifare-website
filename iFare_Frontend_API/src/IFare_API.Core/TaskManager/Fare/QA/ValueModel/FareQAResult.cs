using System.Collections.Generic;
using IFare_API.Common.ValueModel;

namespace IFare_API.TaskManager.Fare.QA.ValueModel
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

    public class FareQAData
    {
        public long ID { get; set; }
        public string Question { get; set; }
        public string Answer { get; set; }
    }
}