using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.TaskManager.Visitor.ValueModel;

namespace IFare_BDAPI.Visitor.Dto
{
    [AutoMapTo(typeof(VisitorData))]
    [AutoMapFrom(typeof(VisitorData))]
    public class VisitorDataDto : ErrorInfoBaseDto
    {
        public VisitorInfoDto Result { get; set; }
    }

    [AutoMapTo(typeof(VisitorInfo))]
    [AutoMapFrom(typeof(VisitorInfo))]
    public class VisitorInfoDto
    {
        public List<string> LabelXList { get; set; }
        public List<int> PeopleNumList { get; set; }
        public List<int> VisitsNumList { get; set; }
        public List<VisitorItemDto> InfoDataList { get; set; }
    }
    
    [AutoMapTo(typeof(VisitorItem))]
    [AutoMapFrom(typeof(VisitorItem))]
    public class VisitorItemDto
    {
        public string LabelDateTime { get; set; }
        public int PepoleNum { get; set; }
        public int VisitsNum { get; set; }
    }
}