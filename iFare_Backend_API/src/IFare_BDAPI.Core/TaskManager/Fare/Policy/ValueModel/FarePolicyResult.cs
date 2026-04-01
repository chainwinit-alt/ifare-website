using System;
using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Code.ValueModel;

namespace IFare_BDAPI.TaskManager.Fare.Policy.ValueModel
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

    public class FarePolicyData : EditorUserBase
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string Qualification { get; set; }
        public string WelfareInfo { get; set; }
        public string Evidence { get; set; }
        public long IFareOfficeUnitID { get; set; }
        public string IFareOfficeUnit { get; set; }
        public string OfficeUnitInfo { get; set; }
        public string OfficeUnitTel { get; set; }
        public long CodeDomicile_ID { get; set; }
        public string CodeDomicile_LabelName { get; set; }
        public long CodePolicy_ID { get; set; }
        public string CodePolicy_LabelName { get; set; }
        public List<CodeData> CodeKeywordList { get; set; }
        public List<CodeData> CodeIdentityList { get; set; }
        public List<CodeData> CodeIncomeList { get; set; }
        public List<CodeData> CodeRecipientList { get; set; }
        public string CompetentAuthority { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
        public string Remark { get; set; }
        public string State { get; set; }
        public string State_Release { get; set; }
    }
}