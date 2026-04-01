using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.Visitor.ValueModel
{
    public class VisitorData : ErrorInfoBase 
    {
        public VisitorInfo Result { get; set; }
        public VisitorData(ErrorInfoBase errorInfo) 
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
        }
        public VisitorData(ErrorInfoBase errorInfo, VisitorInfo result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
    }

    public class VisitorInfo 
    {
        public List<string> LabelXList { get; set; }
        public List<int> PeopleNumList { get; set; }
        public List<int> VisitsNumList { get; set; }
        public List<VisitorItem> InfoDataList { get; set; }
    }
    
    public class VisitorItem 
    {
        public string LabelDateTime { get; set; }
        public int PepoleNum { get; set; }
        public int VisitsNum { get; set; }
    }
}