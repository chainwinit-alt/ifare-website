using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Code.ValueModel;

namespace IFare_BDAPI.Code.Dto
{
    [AutoMapTo(typeof(CodeEditorData))]
    public class CodeEditorDataDto
    {
        public long ID { get; set; }
        public string LabelName { get; set; }
        public bool IsEnabled { get; set; }
    }
}