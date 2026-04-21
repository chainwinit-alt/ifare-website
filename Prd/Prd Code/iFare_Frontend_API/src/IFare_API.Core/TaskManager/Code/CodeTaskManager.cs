using System.Linq;
using Abp.Domain.Repositories;
using IFare_API.Common;
using IFare_API.Constants;
using IFare_API.TaskManager.Code.ValueModel;

namespace IFare_API.TaskManager.Code
{
    public class CodeTaskManager : ICodeTaskManager
    {
        private readonly IRepository<CodeDomicile> _repositoryCodeDomicile;
        private readonly IRepository<CodeIdentity> _repositoryCodeIdentity;
        private readonly IRepository<CodeIncome> _repositoryCodeIncome;
        private readonly IRepository<CodeKeyword> _repositoryCodeKeyword;
        private readonly IRepository<CodePolicy> _repositoryCodePolicy;
        private readonly IRepository<CodeRecipient> _repositoryCodeRecipient;
        private readonly ICommonToolsManager _commonTools;
        public CodeTaskManager(IRepository<CodeDomicile> repositoryCodeDomicile,
                                IRepository<CodeIdentity> repositoryCodeIdentity,
                                IRepository<CodeIncome> repositoryCodeIncome,
                                IRepository<CodeKeyword> repositoryCodeKeyword,
                                IRepository<CodePolicy> repositoryCodePolicy,
                                IRepository<CodeRecipient> repositoryCodeRecipient,
                                ICommonToolsManager commonTools)
        {
            _repositoryCodeDomicile = repositoryCodeDomicile;
            _repositoryCodeIdentity = repositoryCodeIdentity;
            _repositoryCodeIncome = repositoryCodeIncome;
            _repositoryCodeKeyword = repositoryCodeKeyword;
            _repositoryCodePolicy = repositoryCodePolicy;
            _repositoryCodeRecipient = repositoryCodeRecipient;
            _commonTools = commonTools;
        }

        public CodeResult GetCodeDomicileList()
        { 
            // Remove Id = 1 (中央)
            var list = _repositoryCodeDomicile.GetAll()
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete && p.Id != 1)
                                            .Select(p => new CodeData 
                                            {
                                                ID = p.Id,
                                                CodeName = p.LabelName
                                            })
                                            .ToList();
            return new CodeResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public CodeResult GetCodeIdentityList()
        {
            var list = _repositoryCodeIdentity.GetAll()
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                            .Select(p => new CodeData 
                                            {
                                                ID = p.Id,
                                                CodeName = p.LabelName
                                            })
                                            .ToList();
            return new CodeResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public CodeResult GetCodeIncomeList()
        {
            var list = _repositoryCodeIncome.GetAll()
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                            .Select(p => new CodeData 
                                            {
                                                ID = p.Id,
                                                CodeName = p.LabelName
                                            })
                                            .ToList();
            return new CodeResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public CodeResult GetCodeKeywordList()
        {
            var list = _repositoryCodeKeyword.GetAll()
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                            .Select(p => new CodeData 
                                            {
                                                ID = p.Id,
                                                CodeName = p.LabelName
                                            })
                                            .ToList();
            return new CodeResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public CodeResult GetCodePolicyList()
        {
            var list = _repositoryCodePolicy.GetAll()
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                            .Select(p => new CodeData 
                                            {
                                                ID = p.Id,
                                                CodeName = p.LabelName
                                            })
                                            .ToList();
            return new CodeResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public CodeResult GetCodeRecipientList()
        {
            var list = _repositoryCodeRecipient.GetAll()
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                            .Select(p => new CodeData 
                                            {
                                                ID = p.Id,
                                                CodeName = p.LabelName
                                            })
                                            .ToList();
            return new CodeResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }
    }
}