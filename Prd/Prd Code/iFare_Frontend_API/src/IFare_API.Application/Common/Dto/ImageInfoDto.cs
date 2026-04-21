using Abp.AutoMapper;
using IFare_API.Common.ValueModel;

namespace IFare_API.Common.Dto
{
    [AutoMapTo(typeof(ImageInfo))]
    [AutoMapFrom(typeof(ImageInfo))]
    public class ImageInfoDto
    {
        public string ImagePath { get; set; }
        public string ImageName { get; set; }
        public string ImageExtension { get; set; }
    }
}