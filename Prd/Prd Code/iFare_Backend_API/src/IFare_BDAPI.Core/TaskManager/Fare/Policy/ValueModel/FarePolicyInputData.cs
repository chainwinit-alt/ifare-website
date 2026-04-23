using System;
using System.Collections.Generic;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Fare.Policy.ValueModel
{
    public class FarePolicyInputData
    {
        public string Title { get; set; }
        public string Qualification { get; set; }
        public string WelfareInfo { get; set; }
        public string Evidence { get; set; }
        public long IFareOfficeUnitID { get; set; }
        public string OfficeUnitInfo { get; set; }
        public string OfficeUnitTel { get; set; }
        public long CodePolicyID { get; set; }
        public long CodeDomicileID { get; set; }
        public List<long> CodeIndentityIDs { get; set; }
        public List<long> CodeIncomeIDs { get; set; }
        public List<long> CodeRecipientIDs { get; set; }
        public List<long> CodeKeywordIDs { get; set; }
        public string CompetentAuthority { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
        public string Remark { get; set; }
        public bool IsEnabled { get; set; }
        public string State { get; set; } = DataState.Disabled;
    }

    public class FarePolicyInsertData : FarePolicyInputData 
    {
        public long CreateUserID { get; set; }
    }

    public class FarePolicyEditorData : FarePolicyInputData
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }

    public class FarePolicyDeleteData 
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }
}