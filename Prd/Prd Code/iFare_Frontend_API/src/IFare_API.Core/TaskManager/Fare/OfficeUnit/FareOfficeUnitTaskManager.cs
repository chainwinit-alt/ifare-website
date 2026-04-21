using System.Linq;
using Abp.Domain.Repositories;
using IFare_API.Common;
using IFare_API.Constants;
using IFare_API.TaskManager.Fare.OfficeUnit.ValueModel;
using Microsoft.EntityFrameworkCore;

namespace IFare_API.TaskManager.Fare.OfficeUnit
{
    public class FareOfficeUnitTaskManager : IFareOfficeUnitTaskManager
    {
        private readonly IRepository<IfareOfficeUnit> _repositoryIFareOfficeUnit;
        private readonly ICommonToolsManager _commonTools;
        public FareOfficeUnitTaskManager(IRepository<IfareOfficeUnit> repositoryIFareOfficeUnit,
                                ICommonToolsManager commonTools)
        {
            _repositoryIFareOfficeUnit = repositoryIFareOfficeUnit;
            _commonTools = commonTools;
        }

        public FareOfficeUnitResult GetIFareOfficeUnitList()
        {
            var list = _repositoryIFareOfficeUnit.GetAll()
                                    .Include(p => p.IfareOfficeUnitDomiciles)
                                    .ThenInclude(p => p.IfareOfficeUnitDomicileDetails)
                                    .Include(p => p.IfareOfficeUnitDomiciles)
                                    .ThenInclude(p => p.CodeDomicile)
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                    .Select(p => new FareOfficeUnitData 
                                    {
                                        ID = p.Id,
                                        Title = p.Title,
                                        ReleaseTime = p.CreateTime,
                                        UpdateTime = p.UpdateTime.Value,
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
                                    .ToList();
            return new FareOfficeUnitResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }
    }
}