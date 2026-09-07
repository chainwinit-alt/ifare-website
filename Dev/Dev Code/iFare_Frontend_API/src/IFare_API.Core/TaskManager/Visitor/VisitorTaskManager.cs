using System;
using System.Collections.Concurrent;
using System.Linq;
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

        // ── 訪客記錄的寫入節流 ──────────────────────────────────────────────
        // SetVisitorRecord 是匿名可呼叫的寫入端點，沒有任何限制：一支腳本連打就能無限
        // 灌 VisitorRecord，把資料表灌爆。以「同 IP＋同路由」為單位設冷卻時間，冷卻期內
        // 的重複呼叫直接視為已記錄、不再寫入 DB（對外仍回成功，回傳形狀不變）。
        // 節流是行程內的，多節點部署時各節點各自計算，仍足以擋掉單一來源的洗量。
        private static readonly ConcurrentDictionary<string, DateTime> RecentVisitorWrites =
            new ConcurrentDictionary<string, DateTime>(StringComparer.Ordinal);

        private static readonly TimeSpan VisitorRecordThrottleWindow = TimeSpan.FromSeconds(10);

        // 字典以 IP＋路由為 key，來源夠雜時仍可能長大，超過門檻就清掉已過冷卻期的項目。
        private const int RecentVisitorWritesCapacity = 20000;

        /// <summary>
        /// 這次呼叫是否落在同 IP＋同路由的冷卻期內（是＝不應再寫入一筆訪客記錄）。
        /// 不在冷卻期時會就地把時間戳更新為現在，作為下一次判斷的基準。
        /// </summary>
        private static bool IsVisitorRecordThrottled(string ip, string route)
        {
            var nowUtc = DateTime.UtcNow;
            var key = (ip ?? string.Empty) + "|" + route;

            if (RecentVisitorWrites.TryGetValue(key, out var lastWrittenAtUtc) &&
                (nowUtc - lastWrittenAtUtc) < VisitorRecordThrottleWindow)
            {
                return true;
            }

            RecentVisitorWrites[key] = nowUtc;

            if (RecentVisitorWrites.Count > RecentVisitorWritesCapacity)
            {
                foreach (var expiredKey in RecentVisitorWrites
                             .Where(entry => (nowUtc - entry.Value) >= VisitorRecordThrottleWindow)
                             .Select(entry => entry.Key)
                             .ToList())
                {
                    RecentVisitorWrites.TryRemove(expiredKey, out _);
                }
            }

            return false;
        }

        public ErrorInfoBase SetVisitorRecord(string ip, string route)
        {
            try
            {
                if (route == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail);

                // 冷卻期內的重複呼叫：不寫 DB，但仍回成功，前端行為與回傳形狀完全不變。
                if (IsVisitorRecordThrottled(ip, route))
                {
                    return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
                }

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