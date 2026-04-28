using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using IFare_API.Common;
using IFare_API.Constants;
using IFare_API.TaskManager.Code.ValueModel;
using IFare_API.TaskManager.Fare.Policy.Common;
using IFare_API.TaskManager.Fare.Policy.ValueModel;
using Microsoft.EntityFrameworkCore;

namespace IFare_API.TaskManager.Fare.Policy
{
    public class FarePolicyTaskManager : IFarePolicyTaskManager
    {
        private readonly IRepository<IfarePolicy> _repositoryIFarePolicy;
        private readonly ICommonToolsManager _commonTools;
        public FarePolicyTaskManager(IRepository<IfarePolicy> repositoryIFarePolicy,
                                ICommonToolsManager commonTools)
        {
            _repositoryIFarePolicy = repositoryIFarePolicy;
            _commonTools = commonTools;
        }

        public FarePolicyDetail GetIFarePolicyDetail(long farePolicyID)
        {
            var detail = _repositoryIFarePolicy.GetAll()
                                    .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                    .Include(p => p.CodePolicy)
                                    .Where(p => p.CodePolicy.State != DataState.Disabled)
                                    .Include(p => p.CodeDomicile)
                                    .Where(p => p.CodeDomicile.State != DataState.Disabled)
                                    .Include(p => p.IfarePolicyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                    .Include(p => p.IfarePolicyCodeIdentities.Where(p2 => p2.CodeIdentity.State != DataState.Disabled))
                                    .Include(p => p.IfarePolicyCodeIncomes.Where(p2 => p2.CodeIncome.State != DataState.Disabled))
                                    .Include(p => p.IfarePolicyCodeRecipients.Where(p2 => p2.CodeRecipient.State != DataState.Disabled))
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                    .Where(p => p.Id == farePolicyID)
                                    .Select(p => new FarePolicyDetailData 
                                    {
                                        ID = p.Id,
                                        Title = p.Title,
                                        Qualification = p.Qualification,
                                        WelfareInfo = p.WelfareInfo,
                                        Evidence = p.Evidence,
                                        Remark = p.Remark,
                                        IFareOfficeUnitID = p.IfareOfficeUnitId.Value,
                                        OfficeUnitInfo = p.OfficeUnitInfo,
                                        OfficeUnitTel = p.OfficeUnitTel,
                                        CompetentAuthority = p.CompetentAuthority,
                                        CodeDomicile_ID = p.CodeDomicileId.Value,
                                        CodeDomicile_LabelName = p.CodeDomicile.LabelName,
                                        CodePolicy_ID = p.CodePolicyId.Value,
                                        CodePolicy_LabelName = p.CodePolicy.LabelName,
                                        CodeKeywordList = p.IfarePolicyCodeKeywords.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeKeyword.Id,
                                                                                        CodeName = p2.CodeKeyword.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        CodeIncomeList = p.IfarePolicyCodeIncomes.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeIncome.Id,
                                                                                        CodeName = p2.CodeIncome.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        CodeIdentityList = p.IfarePolicyCodeIdentities.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeIdentity.Id,
                                                                                        CodeName = p2.CodeIdentity.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        CodeRecipientList = p.IfarePolicyCodeRecipients.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeRecipient.Id,
                                                                                        CodeName = p2.CodeRecipient.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        ReleaseTime = p.ReleaseTime.Value,
                                        DiscontinuedTime = p.DiscontinuedTime.Value,
                                        UpdateTime = p.UpdateTime
                                    })
                                    .OrderByDescending(p => p.ReleaseTime)
                                    .FirstOrDefault();

            return new FarePolicyDetail(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), detail);
        }

        public FarePolicyResult GetIFarePolicyList(FarePolicyFilterParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<FarePolicyData>();

            if (!paramChecker.IsCheckPass()) return new FarePolicyResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

            // Base filter — only released, non-disabled, non-deleted policies whose code references are still active.
            var baseQuery = _repositoryIFarePolicy.GetAll()
                                    .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                    .Where(p => p.CodePolicy.State != DataState.Disabled)
                                    .Where(p => p.CodeDomicile.State != DataState.Disabled);

            if (param.IsCodeDomicileFiltered) baseQuery = baseQuery.Where(p => p.CodeDomicileId == param.CodeDomicile || p.CodeDomicileId == 1);    // ID = 1 (中央)
            if (param.IsCodePolicyFiltered) baseQuery = baseQuery.Where(p => p.CodePolicyId == param.CodePolicy);
            if (param.IsCodeIncomeFiltered) baseQuery = baseQuery.Where(p => p.IfarePolicyCodeIncomes.Any(p2 => p2.CodeIncomeId == param.CodeIncome || p2.CodeIncomeId == 1));
            if (param.IsCodeRecipientFiltered) baseQuery = baseQuery.Where(p => p.IfarePolicyCodeRecipients.Any(p2 => p2.CodeRecipientId == param.CodeRecipient || p2.CodeRecipientId == 1));
            if (param.IsCodeIdentitiesFiltered) baseQuery = baseQuery.Where(p => p.IfarePolicyCodeIdentities.Any(p2 => param.CodeIdentities.Contains(p2.CodeIdentityId) || p2.CodeIdentityId == 1));
            if (param.IsKeywordFiltered)
            {
                var keyword = param.Keyword.Trim();
                baseQuery = baseQuery.Where(p =>
                    EF.Functions.Like(p.Title, $"%{keyword}%")
                    || EF.Functions.Like(p.Qualification, $"%{keyword}%")
                    || EF.Functions.Like(p.WelfareInfo, $"%{keyword}%"));
            }

            // Count before pagination so the client can show total hits.
            var totalCount = baseQuery.Count();

            // Apply pagination with server-enforced ceiling, then load child collections via split query
            // to avoid Cartesian explosion across the four code-relation tables.
            var pagedQuery = baseQuery
                .OrderByDescending(p => p.ReleaseTime)
                .ThenByDescending(p => p.CreateTime)
                .Skip(param.GetEffectiveSkip())
                .Take(param.GetEffectiveTake())
                .Include(p => p.CodePolicy)
                .Include(p => p.CodeDomicile)
                .Include(p => p.IfarePolicyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled)).ThenInclude(p => p.CodeKeyword)
                .Include(p => p.IfarePolicyCodeIdentities.Where(p2 => p2.CodeIdentity.State != DataState.Disabled)).ThenInclude(p => p.CodeIdentity)
                .Include(p => p.IfarePolicyCodeIncomes.Where(p2 => p2.CodeIncome.State != DataState.Disabled)).ThenInclude(p => p.CodeIncome)
                .Include(p => p.IfarePolicyCodeRecipients.Where(p2 => p2.CodeRecipient.State != DataState.Disabled)).ThenInclude(p => p.CodeRecipient)
                .AsSplitQuery();

            list = pagedQuery.Select(p => new FarePolicyData
                        {
                            ID = p.Id,
                            Title = p.Title,
                            Qualification = p.Qualification,
                            CodeDomicile_ID = p.CodeDomicileId.Value,
                            CodeDomicile_LabelName = p.CodeDomicile.LabelName,
                            CodePolicy_ID = p.CodePolicyId.Value,
                            CodePolicy_LabelName = p.CodePolicy.LabelName,
                            CodeKeywordList = p.IfarePolicyCodeKeywords.Select(p2 => new CodeData
                                                                        {
                                                                            ID = p2.CodeKeyword.Id,
                                                                            CodeName = p2.CodeKeyword.LabelName
                                                                        })
                                                                        .ToList(),
                            CodeIncomeList = p.IfarePolicyCodeIncomes.Select(p2 => new CodeData
                                                                        {
                                                                            ID = p2.CodeIncome.Id,
                                                                            CodeName = p2.CodeIncome.LabelName
                                                                        })
                                                                        .ToList(),
                            CodeIdentityList = p.IfarePolicyCodeIdentities.Select(p2 => new CodeData
                                                                        {
                                                                            ID = p2.CodeIdentity.Id,
                                                                            CodeName = p2.CodeIdentity.LabelName
                                                                        })
                                                                        .ToList(),
                            CodeRecipientList = p.IfarePolicyCodeRecipients.Select(p2 => new CodeData
                                                                        {
                                                                            ID = p2.CodeRecipient.Id,
                                                                            CodeName = p2.CodeRecipient.LabelName
                                                                        })
                                                                        .ToList(),
                            CreateTime = p.CreateTime,
                            ReleaseTime = p.ReleaseTime.Value,
                            DiscontinuedTime = p.DiscontinuedTime.Value,
                        })
                        .ToList();
            return new FarePolicyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list, totalCount);
        }

        private List<FarePolicyData> getArticlesWelfareDataList(IEnumerable<IfarePolicy> queryList, int takeNum = 0, List<FarePolicyData> currentList = null, bool isRandom = false)
        {
            var _list = new List<FarePolicyData>();
            var _existIDs = new List<long>();
            if (currentList != null) 
            {
                _existIDs.AddRange(currentList.Select(p => p.ID).ToList());
            }
            var _query = queryList.Where(p => !_existIDs.Contains(p.Id))
                                .Select(p => 
                                {
                                    var _item = new FarePolicyData 
                                    {
                                        ID = p.Id,
                                        Title = p.Title,
                                        Qualification = p.Qualification,
                                        CodeDomicile_ID = p.CodeDomicileId.Value,
                                        CodeDomicile_LabelName = p.CodeDomicile.LabelName,
                                        CodePolicy_ID = p.CodePolicyId.Value,
                                        CodePolicy_LabelName = p.CodePolicy.LabelName,
                                        CodeKeywordList = p.IfarePolicyCodeKeywords.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeKeyword.Id,
                                                                                        CodeName = p2.CodeKeyword.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        CodeIncomeList = p.IfarePolicyCodeIncomes.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeIncome.Id,
                                                                                        CodeName = p2.CodeIncome.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        CodeIdentityList = p.IfarePolicyCodeIdentities.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeIdentity.Id,
                                                                                        CodeName = p2.CodeIdentity.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        CodeRecipientList = p.IfarePolicyCodeRecipients.Select(p2 => new CodeData 
                                                                                    {
                                                                                        ID = p2.CodeRecipient.Id,
                                                                                        CodeName = p2.CodeRecipient.LabelName
                                                                                    })
                                                                                    .ToList(),
                                        ReleaseTime = p.ReleaseTime.Value,
                                        DiscontinuedTime = p.DiscontinuedTime.Value,
                                        CreateTime = p.CreateTime
                                    };
                                    return _item;
                                });

            if (isRandom) 
            {
                Random rand = new Random();
                var ttlCount = _query.Count();
                var maxNum = ttlCount > 3 ? ttlCount - 3 : ttlCount;
                int toSkip = rand.Next(0, ttlCount);
                _list = _query.OrderBy(r => Guid.NewGuid())
                            .Skip(toSkip)
                            .Take(takeNum)
                            .ToList();
            }
            else 
            {
                _list = _query.OrderByDescending(p => p.ReleaseTime)
                            .ThenByDescending(p => p.CreateTime)
                            .Take(takeNum)
                            .ToList();
            }

            return _list;
        }

        public FarePolicyResult GetIFarePolicyRelation(long farePolicyID)
        {
            // var relationCodeDomicileID = _repositoryIFarePolicy.GetAll()
            //                                         .Include(p => p.CodeDomicile)
            //                                         .Where(p => p.CodeDomicile.State != DataState.Disabled)
            //                                         .Where(p => p.Id == farePolicyID)
            //                                         .Select(p => p.CodeDomicileId.Value)
            //                                         .FirstOrDefault();

            var cFarePolicyItem = _repositoryIFarePolicy.GetAll()
                                                            .Include(p => p.CodePolicy)
                                                            .Include(p => p.CodeDomicile)
                                                            .Include(p => p.IfarePolicyCodeKeywords)
                                                            .ThenInclude(p => p.CodeKeyword)
                                                            .Include(p => p.IfarePolicyCodeIdentities)
                                                            .ThenInclude(p => p.CodeIdentity)
                                                            .Include(p => p.IfarePolicyCodeIncomes)
                                                            .ThenInclude(p => p.CodeIncome)
                                                            .Include(p => p.IfarePolicyCodeRecipients)
                                                            .ThenInclude(p => p.CodeRecipient)
                                                            .Where(p => p.Id == farePolicyID)
                                                            .FirstOrDefault();
            var cRecipientList = cFarePolicyItem.IfarePolicyCodeRecipients.Select(p => p.CodeRecipientId).ToList();
            var cIncomeList = cFarePolicyItem.IfarePolicyCodeIncomes.Select(p => p.CodeIncomeId).ToList();
            var cIdentityList = cFarePolicyItem.IfarePolicyCodeIdentities.Select(p => p.CodeIdentityId).ToList();

            var _query = _repositoryIFarePolicy.GetAll()
                                    .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                    .Include(p => p.CodePolicy)
                                    .Where(p => p.CodePolicy.State != DataState.Disabled)
                                    .Include(p => p.CodeDomicile)
                                    .Where(p => p.CodeDomicile.State != DataState.Disabled)
                                    .Include(p => p.IfarePolicyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                    .ThenInclude(p => p.CodeKeyword)
                                    .Include(p => p.IfarePolicyCodeIdentities.Where(p2 => p2.CodeIdentity.State != DataState.Disabled))
                                    .ThenInclude(p => p.CodeIdentity)
                                    .Include(p => p.IfarePolicyCodeIncomes.Where(p2 => p2.CodeIncome.State != DataState.Disabled))
                                    .ThenInclude(p => p.CodeIncome)
                                    .Include(p => p.IfarePolicyCodeRecipients.Where(p2 => p2.CodeRecipient.State != DataState.Disabled))
                                    .ThenInclude(p => p.CodeRecipient)
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete && p.Id != farePolicyID)
                                    .AsEnumerable();

            // All same.
            var _query_All = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId &&
                                            !p.IfarePolicyCodeRecipients.Any(p2 => !cRecipientList.Contains(p2.CodeRecipientId)) &&
                                            !p.IfarePolicyCodeIncomes.Any(p2 => !cIncomeList.Contains(p2.CodeIncomeId)) &&
                                            !p.IfarePolicyCodeIdentities.Any(p2 => !cIdentityList.Contains(p2.CodeIdentityId)));
            // All Contains same.
            var _quer_All_Contains = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId &&
                                                p.IfarePolicyCodeRecipients.Any(p2 => cRecipientList.Contains(p2.CodeRecipientId)) &&
                                                p.IfarePolicyCodeIncomes.Any(p2 => cIncomeList.Contains(p2.CodeIncomeId)) &&
                                                p.IfarePolicyCodeIdentities.Any(p2 => cIdentityList.Contains(p2.CodeIdentityId)));

            // All or.
            var _quer_All_Or = _query.Where(p => p.CodeDomicileId == cFarePolicyItem.CodeDomicileId ||
                                                p.IfarePolicyCodeRecipients.Any(p2 => cRecipientList.Contains(p2.CodeRecipientId)) ||
                                                p.IfarePolicyCodeIncomes.Any(p2 => cIncomeList.Contains(p2.CodeIncomeId)) ||
                                                p.IfarePolicyCodeIdentities.Any(p2 => cIdentityList.Contains(p2.CodeIdentityId)));

            var _relationList = new List<FarePolicyData>();
            const int TTLCOUNT = 3;
            var takeNum = TTLCOUNT;

            // All same.
            if (_query_All.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query_All, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            // All Contains same.
            if (_quer_All_Contains.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_quer_All_Contains, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            // All Or.
            if (_quer_All_Or.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_quer_All_Or, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            // All random.
            if (_query.Count() > 0 && takeNum > 0) 
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query, takeNum, currentList: _relationList, isRandom: true));
                takeNum = takeNum - _relationList.Count();
            }
            
            return new FarePolicyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), _relationList);
        }
    }
}