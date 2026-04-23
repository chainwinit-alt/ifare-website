using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.TaskManager.Fare.OfficeUnit.ValueModel;
using IFare_BDAPI.TaskManager.Fare.OfficeUnit.Common;
using System.Collections.Generic;
using IFare_BDAPI.Constants;
using System.Linq;
using IFare_BDAPI.Common.ValueModel;
using System;
using Microsoft.EntityFrameworkCore;
using Abp.EntityFrameworkCore.Repositories;

namespace IFare_BDAPI.TaskManager.Fare.OfficeUnit
{
    public class FareOfficeUnitTaskManager : IFareOfficeUnitTaskManager
    {
        private readonly IRepository<IfareOfficeUnit> _repositoryIFareOfficeUnit;
        private readonly IRepository<IfareOfficeUnitDomicile> _repositoryIFareOUDomicile;
        private readonly IRepository<IfareOfficeUnitDomicileDetail> _repositoryIFareOUDoDetail;
        private readonly ICommonToolsManager _commonTools;
        public FareOfficeUnitTaskManager(IRepository<IfareOfficeUnit> repositoryIFareOfficeUnit,
                                        IRepository<IfareOfficeUnitDomicile> repositoryIFareOUDomicile,
                                        IRepository<IfareOfficeUnitDomicileDetail> repositoryIFareOUDoDetail,
                                        ICommonToolsManager commonTools)
        {
            _repositoryIFareOfficeUnit = repositoryIFareOfficeUnit;
            _repositoryIFareOUDomicile = repositoryIFareOUDomicile;
            _repositoryIFareOUDoDetail = repositoryIFareOUDoDetail;
            _commonTools = commonTools;
        }

        public FareOfficeUnitResult GetDataList(FareOfficeUnitFilterParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<FareOfficeUnitData>();

            if (!paramChecker.IsCheckPass()) return new FareOfficeUnitResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

            var query = _repositoryIFareOfficeUnit.GetAll()
                                                .Include(p => p.IfareOfficeUnitDomiciles)
                                                .ThenInclude(p => p.IfareOfficeUnitDomicileDetails)
                                                .Include(p => p.IfareOfficeUnitDomiciles)
                                                .ThenInclude(p => p.CodeDomicile)
                                                .AsQueryable();

            if (!param.IsContainElse) query = query.Where(p => p.Title != CodeConst.SelectElse);
            if (param.IsCreateDateFiltered) query = query.Where(p => p.CreateTime >= param.CreateDateStart && p.CreateTime < param.CreateDateEnd.Value.AddDays(1));
            if (param.IsUpdateDateFiltered) query = query.Where(p => p.UpdateTime >= param.UpdateDateStart && p.UpdateTime < param.UpdateDateEnd.Value.AddDays(1));
            if (param.IsSearchNameFiltered) query = query.Where(p => p.Title.Contains(param.SearchName));
            if (param.IsIDsFiltered) query = query.Where(p => param.IDs.Contains(p.Id));

            var ttt=  query.ToList();

            list = query.Select(p => new FareOfficeUnitData
                        {
                            ID = p.Id,
                            Title = p.Title,
                            State = p.State,
                            CreateDate = p.CreateTime,
                            CreateUserID = p.CreateUserId,
                            CreateUserName = p.CreateUser.UserName,
                            UpdateDate = p.UpdateTime,
                            UpdateUserID = p.UpdateUserId,
                            UpdateUserName = p.UpdateUser.UserName,
                            OfficeList = p.IfareOfficeUnitDomiciles.Select(p2 => new FareOfficeDomicileData
                            {
                                CodeDomicile_ID = p2.CodeDomicileId,
                                CodeDomicile_LabelName = p2.CodeDomicile.LabelName,
                                UnitList = p2.IfareOfficeUnitDomicileDetails.Select(p3 => new FareOfficeDetailData
                                {
                                    UnitName = p3.UnitName,
                                    Tel = p3.Tel,
                                    Address = p3.Address
                                })
                                .ToList()
                            })
                            .ToList()
                        })
                        .OrderByDescending(p => p.CreateDate)
                        .ToList();

            return new FareOfficeUnitResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public ErrorInfoBase InsertFareOfficeUnit(FareOfficeUnitInsertData insertData)
        {
            try
            {
                var inputChecker = new InputChecker(insertData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                using var transaction = _repositoryIFareOfficeUnit.GetDbContext().Database.BeginTransaction();

                var item = new IfareOfficeUnit()
                {
                    Title = insertData.Title,
                    State = insertData.State,
                    CreateUserId = insertData.CreateUserID,
                };

                _repositoryIFareOfficeUnit.GetDbContext().Add(item);
                _repositoryIFareOfficeUnit.GetDbContext().SaveChanges();

                transaction.Commit();

                foreach (var officeItem in insertData.OfficeList)
                {
                    using var transaction_domicile = _repositoryIFareOUDomicile.GetDbContext().Database.BeginTransaction();

                    var item_domicile = new IfareOfficeUnitDomicile()
                    {
                        IfareOfficeUnitId = item.Id,
                        CodeDomicileId = officeItem.CodeDomicileID,
                        CreateUserId = insertData.CreateUserID
                    };

                    _repositoryIFareOUDomicile.GetDbContext().Add(item_domicile);
                    _repositoryIFareOUDomicile.GetDbContext().SaveChanges();

                    transaction_domicile.Commit();

                    foreach (var unit in officeItem.UnitDetailList)
                    {
                        using var transaction_detail = _repositoryIFareOUDoDetail.GetDbContext().Database.BeginTransaction();
                        var item_detail = new IfareOfficeUnitDomicileDetail()
                        {
                            IfareOfficeUnitDomicileId = item_domicile.Id,
                            UnitName = unit.UnitName,
                            Tel = unit.Tel,
                            Address = unit.Address,
                            CreateUserId = insertData.CreateUserID
                        };

                        _repositoryIFareOUDoDetail.GetDbContext().Add(item_detail);
                        _repositoryIFareOUDoDetail.GetDbContext().SaveChanges();

                        transaction_detail.Commit();
                    }
                }

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase UpdateFareOfficeUnit(FareOfficeUnitEditorData editorData)
        {
            try
            {
                var inputChecker = new InputChecker(editorData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var item = _repositoryIFareOfficeUnit.GetAll()
                                        .Where(p => p.Id == editorData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                using var transaction = _repositoryIFareOfficeUnit.GetDbContext().Database.BeginTransaction();

                _repositoryIFareOfficeUnit.GetDbContext().Attach(item);

                item.Title = editorData.Title;
                item.State = editorData.State;
                item.UpdateUserId = editorData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryIFareOfficeUnit.GetDbContext().SaveChanges();

                transaction.Commit();

                var _IFareOfficeUnitDomiciles = _repositoryIFareOUDomicile.GetAll()
                                                                            .Where(p => p.IfareOfficeUnitId == item.Id)
                                                                            .ToList();
                using var transaction_domicile = _repositoryIFareOUDomicile.GetDbContext().Database.BeginTransaction();

                _repositoryIFareOUDomicile.GetDbContext().RemoveRange(_IFareOfficeUnitDomiciles);
                _repositoryIFareOUDomicile.GetDbContext().SaveChanges();
                
                transaction_domicile.Commit();

                foreach (var officeItem in editorData.OfficeList)
                {
                    using var transaction_domicileAdd = _repositoryIFareOUDomicile.GetDbContext().Database.BeginTransaction();

                    var item_domicile = new IfareOfficeUnitDomicile()
                    {
                        IfareOfficeUnitId = item.Id,
                        CodeDomicileId = officeItem.CodeDomicileID,
                        CreateUserId = editorData.UpdateUserID
                    };

                    _repositoryIFareOUDomicile.GetDbContext().Add(item_domicile);
                    _repositoryIFareOUDomicile.GetDbContext().SaveChanges();

                    transaction_domicileAdd.Commit();

                    foreach (var unit in officeItem.UnitDetailList)
                    {
                        using var transaction_detail = _repositoryIFareOUDoDetail.GetDbContext().Database.BeginTransaction();
                        var item_detail = new IfareOfficeUnitDomicileDetail()
                        {
                            IfareOfficeUnitDomicileId = item_domicile.Id,
                            UnitName = unit.UnitName,
                            Tel = unit.Tel,
                            Address = unit.Address,
                            CreateUserId = editorData.UpdateUserID
                        };

                        _repositoryIFareOUDoDetail.GetDbContext().Add(item_detail);
                        _repositoryIFareOUDoDetail.GetDbContext().SaveChanges();

                        transaction_detail.Commit();
                    }
                }

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }
    }
}