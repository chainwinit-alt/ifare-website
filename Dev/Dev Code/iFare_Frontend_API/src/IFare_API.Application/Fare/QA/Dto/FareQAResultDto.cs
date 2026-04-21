using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_API.Common.Dto;
using IFare_API.TaskManager.Fare.QA.ValueModel;

namespace IFare_API.Fare.QA.Dto 
{
    [AutoMapTo(typeof(FareQAResult))]
    [AutoMapFrom(typeof(FareQAResult))]
    public class FareQAResultDto : ErrorInfoBaseDto
    {
        public List<FareQADataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(FareQAData))]
    [AutoMapFrom(typeof(FareQAData))]
    public class FareQADataDto
    {
        public long ID { get; set; }
        public string Question { get; set; }
        public string Answer { get; set; }
    }
}