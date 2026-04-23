using System.Threading.Tasks;
using Abp.Domain.Repositories;
using Abp;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Articles.Lazy.Dto;
using IFare_BDAPI.TaskManager.Articles.Lazy;
using IFare_BDAPI.TaskManager.Articles.Lazy.ValueModel;
using Abp.Domain.Uow;
using IFare_BDAPI.Common.Dto;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Security.Claims;
using System;

namespace IFare_BDAPI.Articles.Lazy
{
    /// <summary>
    /// 懶人包文章應用服務（Application Service）。
    /// 提供懶人包類文章的查詢、新增、修改及刪除功能，所有操作皆需 JWT 驗證。
    /// 對應後台管理系統中「懶人包文章管理」功能模組。
    /// </summary>
    [Authorize(Policy = "JwtAuth")]     // 所有端點皆需 JWT 驗證
    [IgnoreAntiforgeryToken]            // 停用 Anti-Forgery Token 驗證（由 JWT 保護）
    public class ArticlesLazyAppService : AbpServiceBase, IArticlesLazyAppService
    {
        // 懶人包文章任務管理器，封裝資料存取與業務邏輯
        private readonly IArticlesLazyTaskManager _articlesLazyTaskManager;
        // HTTP Context 存取器，用於從請求中取得目前登入使用者資訊
        private readonly IHttpContextAccessor _httpContextAccessor;

        /// <summary>
        /// 建構子，透過相依性注入初始化依賴項目。
        /// </summary>
        /// <param name="articlesLazyTaskManager">懶人包文章任務管理器</param>
        /// <param name="httpContextAccessor">HTTP Context 存取器</param>
        public ArticlesLazyAppService(IArticlesLazyTaskManager articlesLazyTaskManager, IHttpContextAccessor httpContextAccessor)
        {
            _articlesLazyTaskManager = articlesLazyTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// 取得懶人包文章清單（支援分頁與篩選條件）。
        /// </summary>
        /// <param name="param">篩選條件參數 DTO（關鍵字、分頁等）</param>
        /// <returns>包含文章列表及分頁資訊的結果 DTO</returns>
        public async Task<ArticlesLazyResultDto> GetDataList(ArticlesLazyFilterParamDto param)
        {
            // 將 DTO 映射為業務邏輯層所需的參數模型
            var _param = ObjectMapper.Map<ArticlesLazyFilterParam>(param);
            var result = _articlesLazyTaskManager.GetDataList(_param);
            // 將業務層結果映射回 DTO 回傳給前端
            return ObjectMapper.Map<ArticlesLazyResultDto>(result);
        }

        /// <summary>
        /// 新增一筆懶人包文章（POST）。
        /// 自動從 JWT Claims 取得目前登入使用者 ID，記錄為建立者。
        /// </summary>
        /// <param name="insertData">新增文章資料 DTO</param>
        /// <returns>操作結果（包含成功/失敗訊息）</returns>
        [HttpPost]
        [UnitOfWork(isTransactional: false)] // 停用 ABP 預設交易機制，由 TaskManager 自行管控
        public async Task<ErrorInfoBaseDto> InsertArticlesLazy(ArticlesLazyInsertDataDto insertData)
        {
            // 從 JWT Claims 中取得目前登入使用者的 ID（ClaimTypes.Sid）
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<ArticlesLazyInsertData>(insertData);
            // 設定建立者 ID，用於資料稽核追蹤
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _articlesLazyTaskManager.InsertArticlesLazy(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        /// <summary>
        /// 修改一筆懶人包文章（POST）。
        /// 自動從 JWT Claims 取得目前登入使用者 ID，記錄為最後修改者。
        /// </summary>
        /// <param name="editorData">修改文章資料 DTO（包含文章 ID 及修改內容）</param>
        /// <returns>操作結果（包含成功/失敗訊息）</returns>
        [HttpPost]
        [UnitOfWork(isTransactional: false)]
        public async Task<ErrorInfoBaseDto> UpdateArticlesLazy(ArticlesLazyEditorDataDto editorData)
        {
            // 從 JWT Claims 取得目前登入使用者 ID
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<ArticlesLazyEditorData>(editorData);
            // 設定修改者 ID，用於資料稽核追蹤
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _articlesLazyTaskManager.UpdateArticlesLazy(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        /// <summary>
        /// 刪除一筆懶人包文章（POST）。
        /// 自動從 JWT Claims 取得目前登入使用者 ID，記錄為刪除操作者。
        /// </summary>
        /// <param name="deleteData">刪除文章資料 DTO（包含文章 ID）</param>
        /// <returns>操作結果（包含成功/失敗訊息）</returns>
        [HttpPost]
        public async Task<ErrorInfoBaseDto> DeleteArticlesLazy(ArticlesLazyDeleteDataDto deleteData)
        {
            // 從 JWT Claims 取得目前登入使用者 ID
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _deleteData = ObjectMapper.Map<ArticlesLazyDeleteData>(deleteData);
            // 設定刪除操作者 ID，用於資料稽核追蹤
            _deleteData.UpdateUserID = Convert.ToInt64(userID);
            var result = _articlesLazyTaskManager.DeleteArticlesLazy(_deleteData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}
