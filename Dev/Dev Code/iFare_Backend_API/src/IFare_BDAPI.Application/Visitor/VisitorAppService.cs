using System;
using System.Threading.Tasks;
using Abp;
using IFare_BDAPI.TaskManager.Visitor;
using IFare_BDAPI.Visitor.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IFare_BDAPI.Visitor
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class VisitorAppService : AbpServiceBase, IVisitorAppService
    {
        private readonly IVisitorTaskManager _visitorTaskManager;
        public VisitorAppService(IVisitorTaskManager visitorTaskManager)
        {
            _visitorTaskManager = visitorTaskManager;
        }

        public async Task<VisitorSummaryDto> GetVisitorSummary()
        {
            var result = _visitorTaskManager.GetVisitorSummary();
            return ObjectMapper.Map<VisitorSummaryDto>(result);
        }

        public async Task<VisitorDataDto> GetVisitorChartData(int? selectYear, DateTime? startDate, DateTime? endDate)
        {
            var result = _visitorTaskManager.GetVisitorData(selectYear, startDate, endDate);
            return ObjectMapper.Map<VisitorDataDto>(result);
        }
    }
}