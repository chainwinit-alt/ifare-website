using System;
using System.Collections.Generic;
using IFare_API.Common.ValueModel;
using IFare_API.TaskManager.Code.ValueModel;

namespace IFare_API.TaskManager.Articles.Lazy.ValueModel
{
    public class ArticlesLazyDetail : ErrorInfoBase
    {
        public ArticlesLazyDetail(ErrorInfoBase errorInfo, ArticlesLazyInfo result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public ArticlesLazyInfo Result { get; set; }
    }

    public class ArticlesLazyInfo
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public long CodePolicy_ID { get; set; }
        public string CodePolicy_LabelName { get; set; }
        public List<ImageInfo> ImageList { get; set; }
        public List<CodeData> CodeKeywordList { get; set; }
        public DateTime? ReleaseTime { get; set; }
    }
}