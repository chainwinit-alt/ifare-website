using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Abp;
using Abp.Web.Models;
using IFare_API.TaskManager.Img;
using Microsoft.AspNetCore.Mvc;

namespace IFare_API.Img 
{
    public class ImgAppService : AbpServiceBase, IImgAppService
    {
        private readonly IImgTaskManager _imgTaskManager;
        public ImgAppService(IImgTaskManager imgTaskManager)
        {
            _imgTaskManager = imgTaskManager;
        }

        [DontWrapResult]
        [HttpGet]
        public async Task<IActionResult> GetmImg(long imgID)
        {
            try 
            {
                var imgPath = _imgTaskManager.GetImgPath(imgID);
                var base64Obj = imgPath.Split(";");
                var base64 = base64Obj[1].Replace("base64,", "");
                var type = base64Obj[0].Replace("data:","");
                return new FileContentResult(Convert.FromBase64String(base64), type);
            }
            catch (Exception ex)
            {
                byte[] b = new byte[0];
                return new FileContentResult(b, "image/png");
            }
        }
    }
}