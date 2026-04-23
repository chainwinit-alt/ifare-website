using System;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.ImgManager.ValueModel;

namespace IFare_BDAPI.ImgManager.Dto
{
    [AutoMapTo(typeof(ImgManagerFilterParam))]
    public class ImgManagerFilterParamDto
    {
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public string? Type { get; set; }
        public string? SearchName { get; set; }
    }
}