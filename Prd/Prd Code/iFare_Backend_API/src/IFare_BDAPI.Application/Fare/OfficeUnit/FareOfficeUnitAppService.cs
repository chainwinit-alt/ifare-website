using System.Threading.Tasks;
using Abp;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Fare.OfficeUnit.Dto;
using IFare_BDAPI.TaskManager.Fare.OfficeUnit;
using IFare_BDAPI.TaskManager.Fare.OfficeUnit.ValueModel;
using IFare_BDAPI.Common.Dto;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Security.Claims;
using System;
using Abp.Domain.Uow;

namespace IFare_BDAPI.Fare.OfficeUnit
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class FareOfficeUnitAppService : AbpServiceBase, IFareOfficeUnitAppService
    {
        private readonly IFareOfficeUnitTaskManager _fareOfficeUnitTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public FareOfficeUnitAppService(IFareOfficeUnitTaskManager fareOfficeUnitTaskManager, IHttpContextAccessor httpContextAccessor) 
        {
            _fareOfficeUnitTaskManager = fareOfficeUnitTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<FareOfficeUnitResultDto> GetDataList(FareOfficeUnitFilterParamDto param)
        {
            var _param = ObjectMapper.Map<FareOfficeUnitFilterParam>(param);
            var result = _fareOfficeUnitTaskManager.GetDataList(_param);
            return ObjectMapper.Map<FareOfficeUnitResultDto>(result);
        }

        [HttpPost]
        [UnitOfWork(isTransactional: false)]
        public async Task<ErrorInfoBaseDto> InsertFareOfficeUnit(FareOfficeUnitInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<FareOfficeUnitInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _fareOfficeUnitTaskManager.InsertFareOfficeUnit(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        [UnitOfWork(isTransactional: false)]
        public async Task<ErrorInfoBaseDto> UpdateFareOfficeUnit(FareOfficeUnitEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<FareOfficeUnitEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _fareOfficeUnitTaskManager.UpdateFareOfficeUnit(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}