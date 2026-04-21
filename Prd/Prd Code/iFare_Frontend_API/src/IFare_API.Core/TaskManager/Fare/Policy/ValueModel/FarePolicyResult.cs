using System;
using System.Collections.Generic;
using IFare_API.Common.ValueModel;
using IFare_API.TaskManager.Code.ValueModel;

namespace IFare_API.TaskManager.Fare.Policy.ValueModel
{
    public class FarePolicyResult : ErrorInfoBase
    {
        public FarePolicyResult(ErrorInfoBase errorInfo, List<FarePolicyData> result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public List<FarePolicyData> Result { get; set; }
    }

    public class FarePolicyData
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string Qualification { get; set; }
        public long CodeDomicile_ID { get; set; }
        public string CodeDomicile_LabelName { get; set; }
        public long CodePolicy_ID { get; set; }
        public string CodePolicy_LabelName { get; set; }
        public List<CodeData> CodeKeywordList { get; set; }
        public List<CodeData> CodeIdentityList { get; set; }
        public List<CodeData> CodeIncomeList { get; set; }
        public List<CodeData> CodeRecipientList { get; set; }
        public DateTime? CreateTime { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
    }
}