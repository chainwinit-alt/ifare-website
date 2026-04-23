using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Main.ValueModel;

namespace IFare_BDAPI.Main.Dto 
{
    [AutoMapTo(typeof(LoginParam))]
    public class LoginParamDto
    {
        public string act { get; set; }
        public string pwd { get; set; }
    }
}