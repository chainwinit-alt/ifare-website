using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Converter;
using IFare_BDAPI.TaskManager.ImgManager.ValueModel;
using Newtonsoft.Json;

namespace IFare_BDAPI.ImgManager.Dto
{
    [AutoMapTo(typeof(ImgManagerResult))]
    [AutoMapFrom(typeof(ImgManagerResult))]
    public class ImgManagerResultDto : ErrorInfoBaseDto
    {
        public List<ImgManagerDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(ImgManagerData))]
    [AutoMapFrom(typeof(ImgManagerData))]
    public class ImgManagerDataDto
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string ImgPath { get; set; }
        public string ImgExtension { get; set; }
        public string Type { get; set; }
        public int Size { get; set; }
        public long? UpdateUserID { get; set; }
        public string? UpdateUserName { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_NoTime))]
        [DisableDateTimeNormalization]
        public DateTime UpdateTime { get; set; }
    }
}