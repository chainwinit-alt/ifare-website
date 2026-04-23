using System;
using Abp.Domain.Repositories;
using Abp.UI;
using IFare_API.Common;
using IFare_API.Common.ValueModel;
using IFare_API.Constants;

namespace IFare_API.TaskManager.Visitor
{
    public class VisitorTaskManager : IVisitorTaskManager
    {
        private readonly IRepository<VisitorRecord> _repositoryVisitor;
        private readonly ICommonToolsManager _commonTools;
        public VisitorTaskManager(IRepository<VisitorRecord> repositoryVisitor,
                                ICommonToolsManager commonTools)
        {
            _repositoryVisitor = repositoryVisitor;
            _commonTools = commonTools;
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
                throw new UserFriendlyException(e.Message);
            }
        }
    }
}