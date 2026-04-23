using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Collaborator.ValueModel;

namespace IFare_BDAPI.Collaborator.Dto
{
    [AutoMapTo(typeof(CollaboratorFilterParam))]
    public class CollaboratorFilterParamDto
    {
        public string State { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public string? SearchName { get; set; }
        public List<long>? IDs { get; set; }
    }
}