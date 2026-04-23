using System.Threading.Tasks;
using Abp;
using IFare_BDAPI.Personal.Dto;
using IFare_BDAPI.TaskManager.Main;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.TaskManager.Main.ValueModel;
using IFare_BDAPI.Main.Dto;
using Microsoft.AspNetCore.Authorization;

namespace IFare_BDAPI.Main
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class MainAppService : AbpServiceBase, IMainAppService
    {
        private readonly IMainTaskManager _mainTask;
        public MainAppService(IMainTaskManager mainTask) 
        {
            _mainTask = mainTask;
        }

        public async Task<PersonalResultDto> Login([FromBody] LoginParamDto param)
        {
            var _param = ObjectMapper.Map<LoginParam>(param);
            var result = _mainTask.LoginCheck(_param);
            return ObjectMapper.Map<PersonalResultDto>(result);
        }
    }
}