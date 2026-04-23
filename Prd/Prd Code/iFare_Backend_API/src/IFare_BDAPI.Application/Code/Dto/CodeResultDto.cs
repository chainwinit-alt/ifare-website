using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Converter;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using Newtonsoft.Json;

namespace IFare_BDAPI.Code.Dto
{
    [AutoMapTo(typeof(CodeResult))]
    [AutoMapFrom(typeof(CodeResult))]
    public class CodeResultDto : ErrorInfoBaseDto
    {
        public List<CodeDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(CodeData))]
    [AutoMapFrom(typeof(CodeData))]
    public class CodeDataDto : EditorUserBaseDto
    {
        public long ID { get; set; }
        public string LabelName { get; set; }
        public string State { get; set; }
    }
}