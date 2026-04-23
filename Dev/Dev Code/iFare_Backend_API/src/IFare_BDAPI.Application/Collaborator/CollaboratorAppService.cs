using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Abp;
using Abp.Domain.Uow;
using IFare_BDAPI.Collaborator.Dto;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.TaskManager.Collaborator;
using IFare_BDAPI.TaskManager.Collaborator.ValueModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace IFare_BDAPI.Collaborator
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class CollaboratorAppService : AbpServiceBase, ICollaboratorAppService
    {
        private readonly ICollaboratorTaskManager _collaboratorTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public CollaboratorAppService(ICollaboratorTaskManager collaboratorTaskManager, IHttpContextAccessor httpContextAccessor)
        {
            _collaboratorTaskManager = collaboratorTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<CollaboratorResultDto> GetDataList(CollaboratorFilterParamDto param)
        {
            var _param = ObjectMapper.Map<CollaboratorFilterParam>(param);
            var result = _collaboratorTaskManager.GetDataList(_param);
            return ObjectMapper.Map<CollaboratorResultDto>(result);
        }

        [HttpPost]
        [UnitOfWork(isTransactional: false)]
        public async Task<ErrorInfoBaseDto> InsertCollaborator(CollaboratorInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<CollaboratorInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _collaboratorTaskManager.InsertCollaborator(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        [UnitOfWork(isTransactional: false)]
        public async Task<ErrorInfoBaseDto> UpdateCollaborator(CollaboratorEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<CollaboratorEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _collaboratorTaskManager.UpdateCollaborator(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> DeleteCollaborator(CollaboratorDeleteDataDto deleteData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _deleteData = ObjectMapper.Map<CollaboratorDeleteData>(deleteData);
            _deleteData.UpdateUserID = Convert.ToInt64(userID);
            var result = _collaboratorTaskManager.DeleteCollaborator(_deleteData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}