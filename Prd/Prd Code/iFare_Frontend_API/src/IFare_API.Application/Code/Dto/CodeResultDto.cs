using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_API.Common.Dto;
using IFare_API.TaskManager.Code.ValueModel;

namespace IFare_API.Code.Dto
{
    [AutoMapTo(typeof(CodeResult))]
    [AutoMapFrom(typeof(CodeResult))]
    public class CodeResultDto : ErrorInfoBaseDto
    {
        public List<CodeDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(CodeData))]
    [AutoMapFrom(typeof(CodeData))]
    public class CodeDataDto
    {
        public long ID { get; set; }
        public string CodeName { get; set; }
    }
}