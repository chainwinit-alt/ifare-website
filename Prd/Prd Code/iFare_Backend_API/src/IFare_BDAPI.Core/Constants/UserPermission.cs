using System.Collections.Generic;

namespace IFare_BDAPI.Constants
{
    public static class UserPermission 
    {
        public const string All = "不限";
        public const string Reader = "檢視者";
        public const string Editor = "編輯者";
        public const string Admin = "管理者";
        public static readonly List<string> PermissionList = new List<string>(){ All, Reader, Editor, Admin };
    }
}