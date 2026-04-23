using System;
using Abp.Domain.Services;
using IFare_BDAPI.TaskManager.Visitor.ValueModel;

namespace IFare_BDAPI.TaskManager.Visitor
{
    public interface IVisitorTaskManager : IDomainService 
    {
        VisitorSummary GetVisitorSummary();
        VisitorData GetVisitorData(int? selectYear, DateTime? startDate, DateTime? endDate);
    }
}