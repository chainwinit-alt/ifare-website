using System.Collections.Generic;

namespace IFare_API.Constants
{
    public static class DataState 
    {
        public const string All = "不限";
        public const string Enabled = "啟用";
        public const string Disabled = "停用";
        public const string Pending = "待確認";
        public const string Delete = "刪除";
        public static readonly List<string> StateList = new List<string>(){ All, Enabled, Disabled, Pending };
    }
}