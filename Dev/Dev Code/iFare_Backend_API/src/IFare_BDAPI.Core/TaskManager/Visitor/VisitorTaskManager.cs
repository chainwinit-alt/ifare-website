
using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Visitor.ValueModel;
using Microsoft.AspNetCore.Http;

namespace IFare_BDAPI.TaskManager.Visitor
{
    public class VisitorTaskManager : IVisitorTaskManager 
    {
        private readonly IRepository<VisitorRecord> _repositoryVisitorRecord;
        private readonly ICommonToolsManager _commonTools;
        private readonly IHttpContextAccessor _httpContext;
        public VisitorTaskManager(IRepository<VisitorRecord> repositoryVisitorRecord,
                                ICommonToolsManager commonTools,
                                IHttpContextAccessor httpContext)
        {
            _repositoryVisitorRecord = repositoryVisitorRecord;
            _commonTools = commonTools;
            _httpContext = httpContext;
        }

        public VisitorSummary GetVisitorSummary()
        {
            var _hostName = _httpContext.HttpContext.Request.Host.Value;
            DateTime _startDate = _repositoryVisitorRecord.GetAll().Min(p => p.CreateDate);

            var _currentData = _repositoryVisitorRecord.GetAll().Where(p => p.CreateDate >= DateTime.Now.Date && p.Ip != _hostName && VisitorConst.WebPageList.Contains(p.VisitorRoute)).AsEnumerable();

            var _summary = new SummaryInfo() 
            {
                CurrentDate = DateTime.Now.Date,
                CurrentPeople = _currentData.Select(p => p.Ip).Distinct().Count(),
                CurrentVisits = _currentData.Count(),
                TTLStartDate = _startDate,
                TTLPeople = _repositoryVisitorRecord.GetAll().Where(p => p.Ip != _hostName && VisitorConst.WebPageList.Contains(p.VisitorRoute)).Select(p => p.Ip).Distinct().Count(),
                TTLVisits = _repositoryVisitorRecord.GetAll().Where(p => p.Ip != _hostName && VisitorConst.WebPageList.Contains(p.VisitorRoute)).Count()
            };

            return new VisitorSummary(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), _summary);
        }

        public VisitorData GetVisitorData(int? selectYear, DateTime? startDate, DateTime? endDate)
        {
            if ((selectYear != null && (startDate != null || endDate != null)) || 
                (selectYear != null && startDate != null && endDate != null) ||
                (selectYear == null && (startDate == null || endDate == null)))
                {
                    return new VisitorData(_commonTools.GetErrorInfo_API(ErrAPI.Code_ParamFail));
                }
            var _hostName = _httpContext.HttpContext.Request.Host.Value;
            var _query = _repositoryVisitorRecord.GetAll().Where(p => p.Ip != _hostName && VisitorConst.WebPageList.Contains(p.VisitorRoute));
            var _labels = new List<string>();
            var _peopleNums = new List<int>();
            var _visitsNums = new List<int>();
            var _infoList = new List<VisitorItem>();

            if (selectYear != null) 
            {
                _query = _query.Where(p => p.CreateDate >= new DateTime(selectYear.Value, 1, 1) && p.CreateDate < new DateTime(selectYear.Value+1, 1, 1));
                var _data = _query.AsEnumerable();
                for(var i = 1; i <= 12; i++)
                {
                    var _cDateTime = new DateTime(selectYear.Value, i, 1);
                    var _d = _data.Where(p => p.CreateDate >= _cDateTime && p.CreateDate < _cDateTime.AddMonths(1)).AsEnumerable();

                    var labelDateTime = $"{i}月";
                    var numPeople = _d.Select(p => p.Ip).Distinct().Count();
                    var numVisits = _d.Count();

                    _labels.Add(labelDateTime);
                    _peopleNums.Add(numPeople);
                    _visitsNums.Add(numVisits);

                    _infoList.Add(new VisitorItem()
                                    {
                                        LabelDateTime = labelDateTime,
                                        PepoleNum = numPeople,
                                        VisitsNum = numVisits
                                    });
                }
            }
            else if (startDate != null && endDate != null) 
            {
                _query = _query.Where(p => p.CreateDate >= startDate.Value && p.CreateDate < endDate.Value.AddDays(1));
                var _data = _query.AsEnumerable();
                var _diffDays = endDate.Value.Subtract(startDate.Value);
                for(var i = 0; i <= _diffDays.TotalDays; i++)
                {
                    var _cDateTime = new DateTime(startDate.Value.Year, startDate.Value.Month, startDate.Value.Day).AddDays(i);
                    var _d = _data.Where(p => p.CreateDate >= _cDateTime && p.CreateDate < _cDateTime.AddDays(1)).AsEnumerable();

                    var labelDateTime = startDate.Value.AddDays(i).ToString("yyyy/MM/dd");
                    var numPeople = _d.Select(p => p.Ip).Distinct().Count();
                    var numVisits = _d.Count();

                    _labels.Add(labelDateTime);
                    _peopleNums.Add(numPeople);
                    _visitsNums.Add(numVisits);

                    _infoList.Add(new VisitorItem()
                                    {
                                        LabelDateTime = labelDateTime,
                                        PepoleNum = numPeople,
                                        VisitsNum = numVisits
                                    });
                }
            }
            else 
            {
                return new VisitorData(_commonTools.GetErrorInfo_API(ErrAPI.Code_ParamFail));
            }

            var _info = new VisitorInfo()
            {
                LabelXList = _labels,
                PeopleNumList = _peopleNums,
                VisitsNumList = _visitsNums,
                InfoDataList = _infoList
            };
            return new VisitorData(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), _info);
        }
    }
}