using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.Fare.OfficeUnit.ValueModel
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

    public class FareOfficeUnitData : EditorUserBase
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string State { get; set; }
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