using System;
using System.Linq;
using System.Security.Claims;
using Abp;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.ImgManager.Dto;
using IFare_BDAPI.TaskManager.ImgManager;
using IFare_BDAPI.TaskManager.ImgManager.ValueModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace IFare_BDAPI.ImgManager
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class ImgManagerAppService : AbpServiceBase, IImgManagerAppService 
    {
        private readonly IImgManagerTaskManager _imgManagerTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ImgManagerAppService(IImgManagerTaskManager imgManagerTaskManager,
                            IHttpContextAccessor httpContextAccessor)
        {
            _imgManagerTaskManager = imgManagerTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        [HttpPost]
        public ErrorInfoBaseDto InsertImg(ImgManagerInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<ImgManagerInsertData>(insertData);
            _insertData.UpdateUserID = Convert.ToInt64(userID);
            var result = _imgManagerTaskManager.InsertImg(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public ErrorInfoBaseDto EditImg(ImgManagerEditDataDto editData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _edittData = ObjectMapper.Map<ImgManagerEditData>(editData);
            _edittData.UpdateUserID = Convert.ToInt64(userID);
            var result = _imgManagerTaskManager.EditImg(_edittData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpDelete]
        public ErrorInfoBaseDto DeleteImg(long imgID)
        {
            var result = _imgManagerTaskManager.DeleteImg(imgID);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        public ImgManagerResultDto GetImgManagerList(ImgManagerFilterParamDto param)
        {
            var _param = ObjectMapper.Map<ImgManagerFilterParam>(param);
            var result = _imgManagerTaskManager.GetImgManageList(_param);
            return ObjectMapper.Map<ImgManagerResultDto>(result);
        }
    }
}