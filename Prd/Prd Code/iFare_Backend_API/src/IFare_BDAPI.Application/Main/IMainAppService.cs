using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Main.Dto;
using IFare_BDAPI.Personal.Dto;
using Microsoft.AspNetCore.Mvc;

namespace IFare_BDAPI.Main
{
    public interface IMainAppService : IApplicationService
    {
        Task<PersonalResultDto> Login([FromBody] LoginParamDto param);
    }
}