using System;
using Abp.Domain.Repositories;
using Castle.Core.Logging;
using IFare_API.Common;
using IFare_API.Common.ValueModel;
using IFare_API.Constants;

namespace IFare_API.TaskManager.Visitor
{
    public class VisitorTaskManager : IVisitorTaskManager
    {
        private readonly IRepository<VisitorRecord> _repositoryVisitor;
        private readonly ICommonToolsManager _commonTools;
        public ILogger Logger { get; set; }
        public VisitorTaskManager(IRepository<VisitorRecord> repositoryVisitor,
                                ICommonToolsManager commonTools)
        {
            _repositoryVisitor = repositoryVisitor;
            _commonTools = commonTools;
            Logger = NullLogger.Instance;
        }

        public ErrorInfoBase SetVisitorRecord(string ip, string route)
        {
            try 
            {
                if (route == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail);
                _repositoryVisitor.Insert(new VisitorRecord
                {
                    VisitorName = "Anonymous",
                    VisitorFrom = "Web",
                    Ip = ip,
                    VisitorRoute = route
                });
                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                // 原始例外可能含資料表、欄位、連線等內部細節，僅記錄於伺服器端，不外洩給呼叫端
                Logger.Error("[VisitorTaskManager] SetVisitorRecord 寫入訪客記錄失敗", e);
                // 對外只回傳通用失敗結果，與本方法其他失敗路徑一致
                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail);
            }
        }
    }
}