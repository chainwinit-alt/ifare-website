using System.Linq;
using Abp.Domain.Repositories;
using IFare_API.Common;
using IFare_API.Constants;
using IFare_API.TaskManager.Fare.QA.ValueModel;

namespace IFare_API.TaskManager.Fare.QA
{
    public class FareQATaskManager : IFareQATaskManager
    {
        private readonly IRepository<IfareQa> _repositoryIFareQA;
        private readonly ICommonToolsManager _commonTools;
        public FareQATaskManager(IRepository<IfareQa> repositoryIFareQA,
                                ICommonToolsManager commonTools)
        {
            _repositoryIFareQA = repositoryIFareQA;
            _commonTools = commonTools;
        }

        public FareQAResult GetIFareQAList()
        {
            var list = _repositoryIFareQA.GetAll()
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                    .Select(p => new FareQAData 
                                    {
                                        ID = p.Id,
                                        Question = p.Question,
                                        Answer = p.Answer
                                    })
                                    .ToList();
            return new FareQAResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }
    }
}