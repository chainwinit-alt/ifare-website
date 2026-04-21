using System;
using System.Collections.Generic;
using IFare_API.Common.ValueModel;

namespace IFare_API.TaskManager.Fare.OfficeUnit.ValueModel
{
    public class FareOfficeUnitResult : ErrorInfoBase
    {
        public FareOfficeUnitResult(ErrorInfoBase errorInfo, List<FareOfficeUnitData> result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public List<FareOfficeUnitData> Result { get; set; }
    }

    public class FareOfficeUnitData
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public DateTime ReleaseTime { get; set; }
        public DateTime? UpdateTime { get; set; }

        public List<FareOfficeDomicileData> OfficeList { get; set; }
    }

    public class FareOfficeDomicileData 
    {
        public long CodeDomicile_ID { get; set; }
        public string CodeDomicile_LabelName { get; set; }
        public List<FareOfficeDetailData> UnitList { get; set; }
        
    }

    public class FareOfficeDetailData
    {
        public string UnitName { get; set; }
        public string Tel { get; set; }
        public string Address { get; set; }
    }
}