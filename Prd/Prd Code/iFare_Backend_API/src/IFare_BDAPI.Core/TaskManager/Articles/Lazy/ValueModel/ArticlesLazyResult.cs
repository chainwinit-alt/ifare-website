using System;
using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Code.ValueModel;

namespace IFare_BDAPI.TaskManager.Articles.Lazy.ValueModel
{
    public class ArticlesLazyResult : ErrorInfoBase
    {
        public ArticlesLazyResult(ErrorInfoBase errorInfo, List<ArticlesLazyData> result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public List<ArticlesLazyData> Result { get; set; }
    }

    public class ArticlesLazyData : EditorUserBase
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public List<ImageInfo> ImageList { get; set; }
        public long CodePolicy_ID { get; set; }
        public string CodePolicy_LabelName { get; set; }
        public List<CodeData> CodeKeywordList { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
        public string State { get; set; }
    }
}