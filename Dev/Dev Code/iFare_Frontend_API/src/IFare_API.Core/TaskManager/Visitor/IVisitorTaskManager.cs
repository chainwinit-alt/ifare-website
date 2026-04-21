using Abp.Application.Services;
using IFare_API.Common.ValueModel;

namespace IFare_API.TaskManager.Visitor
{
    public interface IVisitorTaskManager : IApplicationService 
    {
        ErrorInfoBase SetVisitorRecord(string ip, string route);
    }
}