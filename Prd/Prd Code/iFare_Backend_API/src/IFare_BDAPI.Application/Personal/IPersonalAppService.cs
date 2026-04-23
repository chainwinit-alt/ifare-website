using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Personal.Dto;
using Microsoft.AspNetCore.Mvc;

namespace IFare_BDAPI.Personal
{
    public interface IPersonalAppService : IApplicationService
    {
        Task<PersonalResultDto> GetPersonalInfo();
        Task<ErrorInfoBaseDto> UpdatePersonalInfo(PersonalReqDto personalReq);
        Task<ErrorInfoBaseDto> UpdatePersonalPwd(PersonalReqDto personalReq);
    }
}