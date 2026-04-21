using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Fare.OfficeUnit.ValueModel;

namespace IFare_BDAPI.Fare.OfficeUnit.Dto
{
    [AutoMapTo(typeof(FareOfficeUnitInputData))]
    public class FareOfficeUnitInputDataDto
    {
        public string Title { get; set; }
        public List<FareOfficeDomicileDto> OfficeList { get; set; }
        public bool IsEnabled { get; set; }
    }

    [AutoMapTo(typeof(FareOfficeDomicile))]
    public class FareOfficeDomicileDto
    {
        public long CodeDomicileID { get; set; }
        public List<FareOfficeUnitDetailDto> UnitDetailList { get; set; }
    }

    [AutoMapTo(typeof(FareOfficeUnitDetail))]
    public class FareOfficeUnitDetailDto
    {
        public string UnitName { get; set; }
        public string Tel { get; set; }
        public string Address {get; set; }
    }

    [AutoMapTo(typeof(FareOfficeUnitInsertData))]
    public class FareOfficeUnitInsertDataDto : FareOfficeUnitInputDataDto 
    {

    }

    [AutoMapTo(typeof(FareOfficeUnitEditorData))]
    public class FareOfficeUnitEditorDataDto : FareOfficeUnitInputDataDto
    {
        public long ID { get; set; }
    }
}