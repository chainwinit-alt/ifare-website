using System;
using System.Collections.Generic;
using IFare_API.Common.ValueModel;
using IFare_API.TaskManager.Code.ValueModel;

namespace IFare_API.TaskManager.Articles.Welfare.ValueModel
{
    public class ArticlesWelfareDetail : ErrorInfoBase
    {
        public ArticlesWelfareDetail(ErrorInfoBase errorInfo, ArticlesWelfareInfo result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public ArticlesWelfareInfo Result { get; set; }
    }

    public class ArticlesWelfareInfo
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string Detail { get; set; }
        public long CodePolicy_ID { get; set; }
        public string CodePolicy_LabelName { get; set; }
        public List<CodeData> CodeKeywordList { get; set; }
        public DateTime? ReleaseTime { get; set; }
    }
}