using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.TaskManager.Fare.OfficeUnit.ValueModel;

namespace IFare_BDAPI.Fare.OfficeUnit.Dto
{
    [AutoMapTo(typeof(FareOfficeUnitResult))]
    [AutoMapFrom(typeof(FareOfficeUnitResult))]
    public class FareOfficeUnitResultDto : ErrorInfoBaseDto
    {
        public List<FareOfficeUnitDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(FareOfficeUnitData))]
    [AutoMapFrom(typeof(FareOfficeUnitData))]
    public class FareOfficeUnitDataDto : EditorUserBaseDto
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string State { get; set; }
        public List<FareOfficeDomicileDataDto> OfficeList { get; set; }
    }

    [AutoMapTo(typeof(FareOfficeDomicileData))]
    [AutoMapFrom(typeof(FareOfficeDomicileData))]
    public class FareOfficeDomicileDataDto
    {
        public long CodeDomicile_ID { get; set; }
        public string CodeDomicile_LabelName { get; set; }
        public List<FareOfficeDetailDataDto> UnitList { get; set; }
        
    }

    [AutoMapTo(typeof(FareOfficeDetailData))]
    [AutoMapFrom(typeof(FareOfficeDetailData))]
    public class FareOfficeDetailDataDto
    {
        public string UnitName { get; set; }
        public string Tel { get; set; }
        public string Address { get; set; }
    }
}