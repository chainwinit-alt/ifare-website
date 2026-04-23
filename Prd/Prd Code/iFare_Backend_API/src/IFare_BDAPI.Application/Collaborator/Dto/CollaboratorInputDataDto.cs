using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Collaborator.ValueModel;

namespace IFare_BDAPI.Collaborator.Dto
{
    [AutoMapTo(typeof(CollaboratorInputData))]
    public class CollaboratorInputDataDto
    {
        public string Title { get; set; }
        public string ServiceItem { get; set; }
        public string? Tel { get; set; }
        public string? Url { get; set; }
        public string? ImageFile { get; set; }
        public string? ImageName { get; set; }
        public string? ImageExtension { get; set; }
        public bool IsEnabled { get; set; }
    }

    [AutoMapTo(typeof(CollaboratorInsertData))]
    public class CollaboratorInsertDataDto : CollaboratorInputDataDto 
    {
        
    }

    [AutoMapTo(typeof(CollaboratorEditorData))]
    public class CollaboratorEditorDataDto : CollaboratorInputDataDto
    {
        public long ID { get; set; }
    }

    [AutoMapTo(typeof(CollaboratorDeleteData))]
    public class CollaboratorDeleteDataDto
    {
        public long ID { get; set; }
    }
}