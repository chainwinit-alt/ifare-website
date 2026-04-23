using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Code.ValueModel;

namespace IFare_BDAPI.Code.Dto
{
    [AutoMapTo(typeof(CodeFilterParam))]
    public class CodeFilterParamDto
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public string? SearchName { get; set; }
        public List<long>? IDs { get; set; }
        public bool IsContainAll { get; set; }
        public bool IsContainDisabled { get; set; }
    }
}