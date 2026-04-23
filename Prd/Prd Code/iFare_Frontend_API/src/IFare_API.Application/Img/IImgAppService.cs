using System.Threading.Tasks;
using Abp.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace IFare_API.Img
{
    public interface IImgAppService : IApplicationService
    {
        Task<IActionResult> GetmImg(long imgID);
    }
}