using System.Collections.Generic;

namespace IFare_BDAPI.Constants
{
    public static class DataState 
    {
        public const string All = "不限";
        public const string Enabled = "啟用";
        public const string Disabled = "停用";
        public const string Pending = "待確認";
        public const string Delete = "刪除";
        public const string Release = "上架";
        public const string Discontinued = "下架";
        public static readonly List<string> StateList = new List<string>(){ All, Enabled, Disabled, Pending };
        public static readonly List<string> StateList_Release = new List<string>() { All, Release, Discontinued };
    }
}