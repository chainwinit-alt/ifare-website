using System;
using System.Collections.Generic;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Fare.OfficeUnit.ValueModel
{
    public class FareOfficeUnitInputData
    {
        public string Title { get; set; }
        public List<FareOfficeDomicile> OfficeList { get; set; }
        public bool IsEnabled { get; set; }
        public string State { get; set; } = DataState.Disabled;
    }

    public class FareOfficeDomicile
    {
        public long CodeDomicileID { get; set; }
        public List<FareOfficeUnitDetail> UnitDetailList { get; set; }
    }

    public class FareOfficeUnitDetail
    {
        public string UnitName { get; set; }
        public string Tel { get; set; }
        public string Address {get; set; }
    }

    public class FareOfficeUnitInsertData : FareOfficeUnitInputData 
    {
        public long CreateUserID { get; set; }
    }

    public class FareOfficeUnitEditorData : FareOfficeUnitInputData
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }
}