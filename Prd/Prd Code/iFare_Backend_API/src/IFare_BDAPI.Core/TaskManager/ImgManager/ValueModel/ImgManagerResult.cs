using System;
using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.ImgManager.ValueModel
{
    public class ImgManagerResult : ErrorInfoBase
    {
        public ImgManagerResult(ErrorInfoBase errorInfo, List<ImgManagerData> result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public List<ImgManagerData> Result { get; set; }
    }

    public class ImgManagerData
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string ImgPath { get; set; }
        public string ImgExtension { get; set; }
        public string Type { get; set; }
        public int Size { get; set; }
        public long? UpdateUserID { get; set; }
        public string? UpdateUserName { get; set; }
        public DateTime UpdateTime { get; set; }
    }
}