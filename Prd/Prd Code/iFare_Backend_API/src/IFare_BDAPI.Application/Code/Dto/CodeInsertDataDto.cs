using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Code.ValueModel;

namespace IFare_BDAPI.Code.Dto
{
    [AutoMapTo(typeof(CodeInsertData))]
    public class CodeInsertDataDto
    {
        public string LabelName { get; set; }
        public bool IsEnabled { get; set; }
    }
}