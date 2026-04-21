using Abp.AutoMapper;
using IFare_API.Common.ValueModel;

namespace IFare_API.Common.Dto
{
    [AutoMapTo(typeof(ErrorInfoBase))]
    [AutoMapFrom(typeof(ErrorInfoBase))]
    public class ErrorInfoBaseDto 
    {
        public int ErrCode { get; set; }
        public string ErrMsg { get; set; }
    }
}