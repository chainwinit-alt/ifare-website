using System;
using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Visitor.Dto;

namespace IFare_BDAPI.Visitor
{
    public interface IVisitorAppService : IApplicationService 
    {
        Task<VisitorSummaryDto> GetVisitorSummary();
        Task<VisitorDataDto> GetVisitorChartData(int? selectYear, DateTime? startDate, DateTime? endDate);
    }
}