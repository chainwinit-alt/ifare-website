using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.ImgManager.ValueModel;

namespace IFare_BDAPI.ImgManager.Dto
{
    [AutoMapTo(typeof(ImgManagerInputData))]
    public class ImgManagerInputDataDto
    {
        public string Title { get; set; }
        public string ImgPath { get; set; }
        public string ImgExtension { get; set; }
        public string Type { get; set; }
        public int Size { get; set; }
    }

    [AutoMapTo(typeof(ImgManagerInsertData))]
    public class ImgManagerInsertDataDto : ImgManagerInputDataDto
    {

    }

    [AutoMapTo(typeof(ImgManagerEditData))]
    public class ImgManagerEditDataDto : ImgManagerInputDataDto
    {
        public long ID { get; set; }
    }
}