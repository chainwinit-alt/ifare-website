using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Fare.Policy.ValueModel;

namespace IFare_BDAPI.Fare.Policy.Dto
{
    [AutoMapTo(typeof(FarePolicyInputData))]
    public class FarePolicyInputDataDto
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
    }

    [AutoMapTo(typeof(FarePolicyInsertData))]
    public class FarePolicyInsertDataDto : FarePolicyInputDataDto 
    {
        
    }

    [AutoMapTo(typeof(FarePolicyEditorData))]
    public class FarePolicyEditorDataDto : FarePolicyInputDataDto
    {
        public long ID { get; set; }
    }

    [AutoMapTo(typeof(FarePolicyDeleteData))]
    public class FarePolicyDeleteDataDto
    {
        public long ID { get; set; }
    }
}