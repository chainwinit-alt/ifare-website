using System.Threading.Tasks;
using Abp;
using IFare_API.Common.Dto;
using IFare_API.TaskManager.Visitor;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace IFare_API.Visitor
{
    public class VisitorAppService : AbpServiceBase, IVisitorAppService
    {
        private IVisitorTaskManager _visitorTaskManager;
        private IHttpContextAccessor _httpContext;
        public VisitorAppService(IVisitorTaskManager visitorTaskManager,
                                IHttpContextAccessor httpContext)
        {
            _visitorTaskManager = visitorTaskManager;
            _httpContext = httpContext;
        }

        [IgnoreAntiforgeryToken]
        public async Task<ErrorInfoBaseDto> SetVisitorRecord(string router)
        {
            var _ip = _httpContext.HttpContext.Connection.RemoteIpAddress.ToString();
            var _list = _visitorTaskManager.SetVisitorRecord(_ip, router);
            return ObjectMapper.Map<ErrorInfoBaseDto>(_list);
        }
    }
}