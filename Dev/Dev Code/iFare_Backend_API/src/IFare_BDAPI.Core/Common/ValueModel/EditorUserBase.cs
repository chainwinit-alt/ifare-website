using System;

namespace IFare_BDAPI.Common.ValueModel
{
    public class EditorUserBase 
    {
        public string? CreateUserName { get; set; }
        public long? CreateUserID { get; set; }
        public DateTime? CreateDate { get; set; }
        public string? UpdateUserName { get; set; }
        public long? UpdateUserID { get; set; }
        public DateTime? UpdateDate { get; set; }
    }
}