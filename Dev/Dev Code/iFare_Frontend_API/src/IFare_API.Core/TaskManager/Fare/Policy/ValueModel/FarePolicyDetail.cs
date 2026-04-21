using System;
using System.Collections.Generic;
using IFare_API.Common.ValueModel;
using IFare_API.TaskManager.Code.ValueModel;

namespace IFare_API.TaskManager.Fare.Policy.ValueModel
{
    public class FarePolicyDetail : ErrorInfoBase
    {
        public FarePolicyDetail(ErrorInfoBase errorInfo, FarePolicyDetailData result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public FarePolicyDetailData Result { get; set; }
    }

    public class FarePolicyDetailData
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string Qualification { get; set; }
        public string WelfareInfo { get; set; }
        public string Evidence { get; set; }
        public long IFareOfficeUnitID { get; set; }
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
        public DateTime? UpdateTime { get; set; }
        public string Remark { get; set; }
    }
}