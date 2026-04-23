using System;
using System.Collections.Generic;
using IFare_API.Common.ValueModel;
using IFare_API.TaskManager.Code.ValueModel;

namespace IFare_API.TaskManager.Articles.Lazy.ValueModel
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

    public class ArticlesLazyData
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public long CodePolicy_ID { get; set; }
        public string CodePolicy_LabelName { get; set; }
        public List<CodeData> CodeKeywordList { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public DateTime CreateTime { get; set; }
    }
}