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

                // 防呆：imgPath 需為「data:{type};base64,{內容}」格式，以 ";" 切開後至少要有兩段。
                // 格式不符時走可控的失敗路徑（記 log 後回傳空圖），不要靠下方 catch 的例外兜。
                var base64Obj = imgPath?.Split(";");
                if (base64Obj == null || base64Obj.Length < 2)
                {
                    Logger.Warn($"[ImgAppService] imgID={imgID} 的圖片路徑格式不符（為空或缺少 ';' 分隔），無法解析。");
                    return EmptyPngResult();
                }

                var base64 = base64Obj[1].Replace("base64,", "");
                var type = base64Obj[0].Replace("data:","");
                return new FileContentResult(Convert.FromBase64String(base64), type);
            }
            catch (Exception ex)
            {
                // 其他非預期例外（例如 base64 內容毀損無法解碼）：先記 log 留下線上可查的線索，
                // 再維持原本契約回傳空的 image/png，避免像原本一樣把 ex 吞掉又沒有任何紀錄。
                Logger.Error($"[ImgAppService] imgID={imgID} 讀取圖片失敗。", ex);
                return EmptyPngResult();
            }
        }

        /// <summary>
        /// 圖片讀取失敗時的統一回傳：維持既有契約，回傳空的 image/png。
        /// </summary>
        private static FileContentResult EmptyPngResult()
        {
            return new FileContentResult(new byte[0], "image/png");
        }
    }
}