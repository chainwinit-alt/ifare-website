using System;
using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.News.ValueModel
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

    public class NewsData : EditorUserBase
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string Detail { get; set; }
        public string State { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
    }
}