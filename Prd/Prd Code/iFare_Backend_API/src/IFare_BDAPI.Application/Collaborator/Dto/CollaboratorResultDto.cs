using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.TaskManager.Collaborator.ValueModel;
using Newtonsoft.Json;

namespace IFare_BDAPI.Collaborator.Dto
{
    [AutoMapTo(typeof(CollaboratorResult))]
    [AutoMapFrom(typeof(CollaboratorResult))]
    public class CollaboratorResultDto : ErrorInfoBaseDto
    {
        public List<CollaboratorDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(CollaboratorData))]
    [AutoMapFrom(typeof(CollaboratorData))]
    public class CollaboratorDataDto : EditorUserBaseDto
    {
        public long ID { get; set; }
        public string Title { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string ServiceItem { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string Tel { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string Url { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string ImageFile { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string ImageName { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string ImageExtension { get; set; }
        public string State { get; set; }
    }
}