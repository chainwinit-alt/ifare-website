using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using Abp.EntityFrameworkCore.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using IFare_BDAPI.TaskManager.Fare.Policy.Common;
using IFare_BDAPI.TaskManager.Fare.Policy.ValueModel;
using Microsoft.EntityFrameworkCore;

namespace IFare_BDAPI.TaskManager.Fare.Policy
{
    public class FarePolicyTaskManager : IFarePolicyTaskManager 
    {
        private readonly IRepository<IfarePolicy> _repositoryIFarePolicy;
        private readonly IRepository<IfarePolicyCodeKeyword> _repositoryIFPKeywords;
        private readonly IRepository<IfarePolicyCodeIdentity> _repositoryIFPIdentity;
        private readonly IRepository<IfarePolicyCodeRecipient> _repositoryIFPRecipient;
        private readonly IRepository<IfarePolicyCodeIncome> _repositoryIFPIncome;
        private readonly ICommonToolsManager _commonTools;
        public FarePolicyTaskManager(IRepository<IfarePolicy> repositoryIFarePolicy, 
                                    IRepository<IfarePolicyCodeKeyword> repositoryIFPKeywords, 
                                    IRepository<IfarePolicyCodeIdentity> repositoryIFPIdentity,
                                    IRepository<IfarePolicyCodeRecipient> repositoryIFPRecipient,
                                    IRepository<IfarePolicyCodeIncome> repositoryIFPIncome,
                                    ICommonToolsManager commonTools)
        {
            _repositoryIFarePolicy = repositoryIFarePolicy;
            _repositoryIFPKeywords = repositoryIFPKeywords;
            _repositoryIFPIdentity = repositoryIFPIdentity;
            _repositoryIFPRecipient = repositoryIFPRecipient;
            _repositoryIFPIncome = repositoryIFPIncome;
            _commonTools = commonTools;
        }

        public FarePolicyResult GetDataList(FarePolicyFilterParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<FarePolicyData>();

            if (!paramChecker.IsCheckPass()) return new FarePolicyResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

            var query = _repositoryIFarePolicy.GetAll()
                                                .Include(p => p.IfareOfficeUnit)
                                                .Include(p => p.CodePolicy)
                                                .Where(p => p.CodePolicy.State != DataState.Disabled)
                                                .Include(p => p.CodeDomicile)
                                                .Where(p => p.CodeDomicile.State != DataState.Disabled)
                                                .Include(p => p.IfarePolicyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                                .Include(p => p.IfarePolicyCodeIdentities.Where(p2 => p2.CodeIdentity.State != DataState.Disabled))
                                                .Include(p => p.IfarePolicyCodeIncomes.Where(p2 => p2.CodeIncome.State != DataState.Disabled))
                                                .Include(p => p.IfarePolicyCodeRecipients.Where(p2 => p2.CodeRecipient.State != DataState.Disabled))
                                                .Where(p => p.State != DataState.Delete);

            if (param.IsCreateDateFiltered) query = query.Where(p => p.CreateTime >= param.CreateDateStart && p.CreateTime < param.CreateDateEnd.Value.AddDays(1));
            if (param.IsUpdateDateFiltered) query = query.Where(p => p.UpdateTime >= param.UpdateDateStart && p.UpdateTime < param.UpdateDateEnd.Value.AddDays(1));
            if (param.IsReleaseTimeFiltered) query = query.Where(p => p.ReleaseTime >= param.ReleaseTimeStart && p.ReleaseTime < param.ReleaseTimeEnd.Value.AddDays(1));
            if (param.IsDiscontinuedFiltered) query = query.Where(p => p.DiscontinuedTime >= param.DiscontinuedTimeStart && p.DiscontinuedTime < param.DiscontinuedTimeEnd.Value.AddDays(1));
            if (param.IsCodeDomicileFiltered) query = query.Where(p => p.CodeDomicileId == param.CodeDomicile);
            if (param.IsCodePolicyFiltered) query = query.Where(p => p.CodePolicyId == param.CodePolicy);
            if (param.IsStateFiltered && param.State != DataState.All) query = query.Where(p => p.State == param.State);
            if (param.IsCodeKeywordsFiltered) 
            {
                var queryKeywordsID = _repositoryIFPKeywords.GetAll()
                                                        .Include(p => p.CodeKeyword)
                                                        .Where(p => p.CodeKeyword.State != DataState.Disabled && param.CodeKeywords.Contains(p.CodeKeywordId))
                                                        .Select(p => p.IfarePolicyId)
                                                        .Distinct();
                query = query.Join(queryKeywordsID, q => q.Id, qkID => qkID, (q, qkID) => q);
            }
            if (param.IsIDsFiltered) query = query.Where(p => param.IDs.Contains(p.Id));
            if (param.IsReleaseStateFiltered && param.State_Release != DataState.All) 
            {
                if (param.State_Release == DataState.Release)
                {
                    query = query.Where(p => p.ReleaseTime != null && p.DiscontinuedTime != null && p.ReleaseTime <= DateTime.Now && p.DiscontinuedTime > DateTime.Now);
                }
                if (param.State_Release == DataState.Discontinued)
                {
                    query = query.Where(p => p.ReleaseTime == null || p.DiscontinuedTime == null || p.ReleaseTime > DateTime.Now || p.DiscontinuedTime < DateTime.Now);
                }
            }
            
            list = query.Select(p => new FarePolicyData
                        {
                            ID = p.Id,
                            Title = p.Title,
                            State = p.State,
                            Qualification = p.Qualification,
                            WelfareInfo = p.WelfareInfo,
                            Evidence = p.Evidence,
                            Remark = p.Remark,
                            IFareOfficeUnitID = p.IfareOfficeUnitId.Value,
                            IFareOfficeUnit = p.IfareOfficeUnit.Title,
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
                                                                            LabelName = p2.CodeKeyword.LabelName,
                                                                            State = p2.CodeKeyword.State
                                                                        })
                                                                        .ToList(),
                            CodeIncomeList = p.IfarePolicyCodeIncomes.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeIncome.Id,
                                                                            LabelName = p2.CodeIncome.LabelName,
                                                                            State = p2.CodeIncome.State
                                                                        })
                                                                        .ToList(),
                            CodeIdentityList = p.IfarePolicyCodeIdentities.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeIdentity.Id,
                                                                            LabelName = p2.CodeIdentity.LabelName,
                                                                            State = p2.CodeIdentity.State
                                                                        })
                                                                        .ToList(),
                            CodeRecipientList = p.IfarePolicyCodeRecipients.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeRecipient.Id,
                                                                            LabelName = p2.CodeRecipient.LabelName,
                                                                            State = p2.CodeRecipient.State
                                                                        })
                                                                        .ToList(),
                            ReleaseTime = p.ReleaseTime.Value,
                            DiscontinuedTime = p.DiscontinuedTime.Value,
                            CreateDate = p.CreateTime,
                            CreateUserID = p.CreateUserId,
                            CreateUserName = p.CreateUser.UserName,
                            UpdateDate = p.UpdateTime,
                            UpdateUserID = p.UpdateUserId,
                            UpdateUserName = p.UpdateUser.UserName,
                            State_Release = p.ReleaseTime.HasValue && 
                                            p.DiscontinuedTime.HasValue && 
                                            p.ReleaseTime.Value <= DateTime.Now && 
                                            p.DiscontinuedTime.Value > DateTime.Now ?
                                            DataState.Release : DataState.Discontinued
                        })
                        .OrderByDescending(p => p.CreateDate)
                        .ToList();
                                            
            return new FarePolicyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public ErrorInfoBase InsertFarePolicy(FarePolicyInsertData insertData)
        {
            try
            {
                var inputChecker = new InputChecker(insertData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                using var transaction = _repositoryIFarePolicy.GetDbContext().Database.BeginTransaction();

                var item = new IfarePolicy()
                {
                    Title = insertData.Title,
                    State = insertData.State,
                    CreateUserId = insertData.CreateUserID,
                    Qualification = insertData.Qualification,
                    WelfareInfo = insertData.WelfareInfo,
                    Evidence = insertData.Evidence,
                    IfareOfficeUnitId = insertData.IFareOfficeUnitID,
                    OfficeUnitInfo = insertData.OfficeUnitInfo == "" ? null : insertData.OfficeUnitInfo,
                    OfficeUnitTel = insertData.OfficeUnitTel== "" ? null : insertData.OfficeUnitTel,
                    ReleaseTime = insertData.ReleaseTime,
                    DiscontinuedTime = insertData.DiscontinuedTime,
                    Remark = insertData.Remark,
                    CompetentAuthority = insertData.CompetentAuthority,
                    CodePolicyId = insertData.CodePolicyID,
                    CodeDomicileId = insertData.CodeDomicileID
                };

                _repositoryIFarePolicy.GetDbContext().Add(item);
                _repositoryIFarePolicy.GetDbContext().SaveChanges();

                transaction.Commit();

                CodeInsertHandler(item.Id, insertData);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase UpdateFarePolicy(FarePolicyEditorData editorData)
        {
            try
            {
                var inputChecker = new InputChecker(editorData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var item = _repositoryIFarePolicy.GetAll()
                                        .Where(p => p.Id == editorData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                using var transaction = _repositoryIFarePolicy.GetDbContext().Database.BeginTransaction();

                _repositoryIFarePolicy.GetDbContext().Attach(item);

                item.Title = editorData.Title;
                item.State = editorData.State;
                item.UpdateUserId = editorData.UpdateUserID;
                item.UpdateTime = DateTime.Now;
                item.Qualification = editorData.Qualification;
                item.WelfareInfo = editorData.WelfareInfo;
                item.Evidence = editorData.Evidence;
                item.IfareOfficeUnitId = editorData.IFareOfficeUnitID;
                item.OfficeUnitInfo = editorData.OfficeUnitInfo == "" ? null : editorData.OfficeUnitInfo;
                item.OfficeUnitTel = editorData.OfficeUnitTel == "" ? null : editorData.OfficeUnitTel;
                item.ReleaseTime = editorData.ReleaseTime;
                item.DiscontinuedTime = editorData.DiscontinuedTime;
                item.Remark = editorData.Remark;
                item.CompetentAuthority = editorData.CompetentAuthority;
                item.CodePolicyId = editorData.CodePolicyID;
                item.CodeDomicileId = editorData.CodeDomicileID;

                _repositoryIFarePolicy.GetDbContext().SaveChanges();

                transaction.Commit();

                // Remove
                // Code Income.
                var _IFarePolicyCodeIncome = _repositoryIFPIncome.GetAll()
                                                                    .Where(p => p.IfarePolicyId == item.Id)
                                                                    .ToList();
                using var transaction_income = _repositoryIFPIncome.GetDbContext().Database.BeginTransaction();
                _repositoryIFPIncome.GetDbContext().RemoveRange(_IFarePolicyCodeIncome);
                _repositoryIFPIncome.GetDbContext().SaveChanges();
                transaction_income.Commit();

                // Code Recipient.
                var _IFarePolicyCodeRecipient = _repositoryIFPRecipient.GetAll()
                                                                    .Where(p => p.IfarePolicyId == item.Id)
                                                                    .ToList();
                using var transaction_recipient = _repositoryIFPRecipient.GetDbContext().Database.BeginTransaction();
                _repositoryIFPRecipient.GetDbContext().RemoveRange(_IFarePolicyCodeRecipient);
                _repositoryIFPRecipient.GetDbContext().SaveChanges();
                transaction_recipient.Commit();

                // Code Identity.
                var _IFarePolicyCodeIdentity = _repositoryIFPIdentity.GetAll()
                                                                    .Where(p => p.IfarePolicyId == item.Id)
                                                                    .ToList();
                using var transaction_identity = _repositoryIFPIdentity.GetDbContext().Database.BeginTransaction();
                _repositoryIFPIdentity.GetDbContext().RemoveRange(_IFarePolicyCodeIdentity);
                _repositoryIFPIdentity.GetDbContext().SaveChanges();
                transaction_identity.Commit();

                // Code Keywords.
                var _IFarePolicyCodeKeywords = _repositoryIFPKeywords.GetAll()
                                                                    .Where(p => p.IfarePolicyId == item.Id)
                                                                    .ToList();
                using var transaction_keywords = _repositoryIFPKeywords.GetDbContext().Database.BeginTransaction();
                _repositoryIFPKeywords.GetDbContext().RemoveRange(_IFarePolicyCodeKeywords);
                _repositoryIFPKeywords.GetDbContext().SaveChanges();
                transaction_keywords.Commit();

                CodeInsertHandler(item.Id, new FarePolicyInsertData
                {
                    CodeIncomeIDs = editorData.CodeIncomeIDs,
                    CodeRecipientIDs = editorData.CodeRecipientIDs,
                    CodeIndentityIDs = editorData.CodeIndentityIDs,
                    CodeKeywordIDs = editorData.CodeKeywordIDs
                });
                
                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        private void CodeInsertHandler(long iFarePolicyID, FarePolicyInputData insertData)
        {
            // Code Incomes.
            foreach (var codeIncomeID in insertData.CodeIncomeIDs)
            {
                using var transaction_income = _repositoryIFPIncome.GetDbContext().Database.BeginTransaction();

                var code_income = new IfarePolicyCodeIncome()
                {
                    IfarePolicyId = iFarePolicyID,
                    CodeIncomeId = codeIncomeID
                };

                _repositoryIFPIncome.GetDbContext().Add(code_income);
                _repositoryIFPIncome.GetDbContext().SaveChanges();

                transaction_income.Commit();
            }

            // Code Recipient.
            foreach (var codeRecipientID in insertData.CodeRecipientIDs)
            {
                using var transaction_recipient = _repositoryIFPRecipient.GetDbContext().Database.BeginTransaction();

                var code_recipient = new IfarePolicyCodeRecipient()
                {
                    IfarePolicyId = iFarePolicyID,
                    CodeRecipientId = codeRecipientID
                };

                _repositoryIFPRecipient.GetDbContext().Add(code_recipient);
                _repositoryIFPRecipient.GetDbContext().SaveChanges();

                transaction_recipient.Commit();
            }

            // Code Identity.
            foreach (var codeIndentityID in insertData.CodeIndentityIDs)
            {
                using var transaction_identity = _repositoryIFPIdentity.GetDbContext().Database.BeginTransaction();

                var code_identity = new IfarePolicyCodeIdentity()
                {
                    IfarePolicyId = iFarePolicyID,
                    CodeIdentityId = codeIndentityID
                };

                _repositoryIFPIdentity.GetDbContext().Add(code_identity);
                _repositoryIFPIdentity.GetDbContext().SaveChanges();

                transaction_identity.Commit();
            }

            // Code Keywords.
            foreach (var codeKeywordID in insertData.CodeKeywordIDs)
            {
                using var transaction_keyword = _repositoryIFPKeywords.GetDbContext().Database.BeginTransaction();

                var code_keyword = new IfarePolicyCodeKeyword()
                {
                    IfarePolicyId = iFarePolicyID,
                    CodeKeywordId = codeKeywordID
                };

                _repositoryIFPKeywords.GetDbContext().Add(code_keyword);
                _repositoryIFPKeywords.GetDbContext().SaveChanges();

                transaction_keyword.Commit();
            }
        }

        public ErrorInfoBase DeleteFarePolicy(FarePolicyDeleteData deleteData)
        {
            try 
            {
                var item = _repositoryIFarePolicy.GetAll()
                                        .Where(p => p.Id == deleteData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                item.State = DataState.Delete;
                item.UpdateUserId = deleteData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryIFarePolicy.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }
    }
}