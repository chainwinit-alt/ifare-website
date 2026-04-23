using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_API.Common.Dto;
using IFare_API.TaskManager.Collaborator.ValueModel;

namespace IFare_API.Collaborator.Dto 
{
    [AutoMapTo(typeof(CollaboratorResult))]
    [AutoMapFrom(typeof(CollaboratorResult))]
    public class CollaboratorResultDto : ErrorInfoBaseDto
    {
        public List<CollaboratorDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(CollaboratorData))]
    [AutoMapFrom(typeof(CollaboratorData))]
    public class CollaboratorDataDto
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string ServiceItem { get; set; }
        public string Tel { get; set; }
        public string Url { get; set; }
        public string ImageFile { get; set; }
        public string ImageName { get; set; }
        public string ImageExtension { get; set; }
    }
}