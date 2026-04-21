using System;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.Visitor.ValueModel
{
    public class VisitorSummary : ErrorInfoBase 
    {
        public SummaryInfo Result { get; set; }
        public VisitorSummary(ErrorInfoBase errorInfo) 
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
        }
        public VisitorSummary(ErrorInfoBase errorInfo, SummaryInfo result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
    }

    public class SummaryInfo 
    {
        public DateTime CurrentDate { get; set; }
        public int CurrentPeople { get; set; }
        public int CurrentVisits { get; set; }
        public DateTime TTLStartDate { get; set; }
        public int TTLPeople { get; set; }
        public int TTLVisits { get; set; }
    }
}