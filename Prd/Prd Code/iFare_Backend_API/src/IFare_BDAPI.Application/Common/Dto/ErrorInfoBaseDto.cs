using Abp.AutoMapper;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.Common.Dto
{
    [AutoMapTo(typeof(ErrorInfoBase))]
    [AutoMapFrom(typeof(ErrorInfoBase))]
    public class ErrorInfoBaseDto 
    {
        public int ErrCode { get; set; }
        public string ErrMsg { get; set; }
    }
}