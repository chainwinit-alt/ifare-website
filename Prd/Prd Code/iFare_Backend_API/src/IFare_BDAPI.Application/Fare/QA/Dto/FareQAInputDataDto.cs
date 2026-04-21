using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Fare.QA.ValueModel;

namespace IFare_BDAPI.Fare.QA.Dto
{
    [AutoMapTo(typeof(FareQAInputData))]
    public class FareQAInputDataDto
    {
        public string Question { get; set; }
        public string Answer { get; set; }
        public bool IsEnabled { get; set; }
    }

    [AutoMapTo(typeof(FareQAInsertData))]
    public class FareQAInsertDataDto : FareQAInputDataDto 
    {

    }

    [AutoMapTo(typeof(FareQAEditorData))]
    public class FareQAEditorDataDto : FareQAInputDataDto
    {
        public long ID { get; set; }
    }

    [AutoMapTo(typeof(FareQADeleteData))]
    public class FareQADeleteDataDto
    {
        public long ID { get; set; }
    }
}