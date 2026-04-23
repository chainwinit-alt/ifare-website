using System.Threading.Tasks;
using Abp.Domain.Repositories;
using Abp;
using IFare_BDAPI.Account.Dto;
using IFare_BDAPI.TaskManager.Account;
using IFare_BDAPI.TaskManager.Account.ValueModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Common.Dto;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Security.Claims;
using System;

namespace IFare_BDAPI.Account
{
    /// <summary>
    /// 後台帳號管理應用服務。
    /// 負責承接前端傳入的帳號管理需求，將 DTO 轉換為 TaskManager 可處理的資料模型，
    /// 並從目前登入使用者的 Claims 中取出操作者資訊，補齊建立者或更新者欄位。
    /// </summary>
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class AccountAppService : AbpServiceBase, IAccountAppService
    {
        /// <summary>
        /// 帳號管理任務管理器，封裝實際的業務邏輯與資料存取流程。
        /// </summary>
        private readonly IAccountTaskManager _accountTaskManager;
        /// <summary>
        /// 目前 HTTP 要求內容存取器，用來讀取登入使用者 Claims。
        /// </summary>
        private readonly IHttpContextAccessor _httpContextAccessor;

        /// <summary>
        /// 建構子，透過依賴注入取得帳號管理服務所需元件。
        /// </summary>
        /// <param name="accountTaskManager">帳號管理任務管理器</param>
        /// <param name="httpContextAccessor">HTTP Context 存取器</param>
        public AccountAppService(IAccountTaskManager accountTaskManager, IHttpContextAccessor httpContextAccessor) 
        {
            _accountTaskManager = accountTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// 查詢帳號列表。
        /// 只有具備編輯權限的使用者可呼叫，並會依目前登入者身分帶入可見資料範圍。
        /// </summary>
        /// <param name="param">前端傳入的篩選條件 DTO</param>
        /// <returns>帳號列表結果 DTO</returns>
        [TypeFilter(typeof(Filter.IsEditorCheckerFilter))]
        public async Task<AccountResultDto> GetAccountList(AccountFilterParamDto param)
        {
            // 從 JWT Claims 中讀取目前登入者的使用者 ID，供後端權限/資料範圍判斷使用
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            // 將前端 DTO 轉為 TaskManager 使用的篩選模型
            var _param = ObjectMapper.Map<AccountFilterParam>(param);
            // 實際查詢邏輯交由 TaskManager 執行
            var result = _accountTaskManager.GetAccountList(_param, Convert.ToInt64(userID));
            // 回傳前轉回 API DTO，避免直接暴露內部模型
            return ObjectMapper.Map<AccountResultDto>(result);
        }

        /// <summary>
        /// 新增帳號。
        /// 會自動把目前登入者寫入建立者欄位，確保後台資料可追溯操作者。
        /// </summary>
        /// <param name="insertData">新增帳號 DTO</param>
        /// <returns>新增結果 DTO</returns>
        [TypeFilter(typeof(Filter.IsEditorCheckerFilter))]
        [HttpPost]
        public async Task<ErrorInfoBaseDto> InsertAccount(AccountInsertDataDto insertData)
        {
            // 取出操作者 ID，後續寫入 CreateUserID
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<AccountInsertData>(insertData);
            // 補上建立者，避免前端自行帶入造成偽造風險
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _accountTaskManager.InsertAccount(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        /// <summary>
        /// 更新帳號。
        /// 會自動把目前登入者寫入更新者欄位，作為資料異動紀錄來源。
        /// </summary>
        /// <param name="editorData">編輯帳號 DTO</param>
        /// <returns>更新結果 DTO</returns>
        [TypeFilter(typeof(Filter.IsEditorCheckerFilter))]
        [HttpPost]
        public async Task<ErrorInfoBaseDto> UpdateAccount(AccountEditorDataDto editorData)
        {
            // 取出操作者 ID，後續寫入 UpdateUserID
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<AccountEditorData>(editorData);
            // 補上更新者，讓後端保有正確的異動來源
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _accountTaskManager.UpdateAccount(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}
