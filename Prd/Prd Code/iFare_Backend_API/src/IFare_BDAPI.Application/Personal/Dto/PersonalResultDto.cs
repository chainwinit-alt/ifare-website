using Abp.AutoMapper;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.TaskManager.Personal.ValueModel;

namespace IFare_BDAPI.Personal.Dto
{
    [AutoMapTo(typeof(PersonalResult))]
    [AutoMapFrom(typeof(PersonalResult))]
    public class PersonalResultDto : ErrorInfoBaseDto
    {
        public PersonalResultDto() {}
        public PersonalResultDto(ErrorInfoBaseDto errorInfo, PersonalInfoDto result) 
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public PersonalInfoDto Result { get; set; }
    }

    [AutoMapTo(typeof(PersonalInfo))]
    [AutoMapFrom(typeof(PersonalInfo))]
    public class PersonalInfoDto
    {
        public long ID { get; set; }
        public string Account { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Permission { get; set; }
        public string State { get; set; }
    }
}