using System;
using System.Collections.Generic;
using IFare_API.Common.ValueModel;

namespace IFare_API.TaskManager.News.ValueModel
{
    public class NewsResult : ErrorInfoBase
    {
        public NewsResult(ErrorInfoBase errorInfo, List<NewsData> result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public List<NewsData> Result { get; set; }
    }

    public class NewsData 
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime ReleaseTime { get; set; }
    }
}