using System.Collections.Generic;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Account.ValueModel
{
    public class AccountInputData
    {
        public string UserName { get; set; }
        public string Account { get; set; }
        public string Email { get; set; }
        public string Permission { get; set; }
        public bool IsEnabled { get; set; }
        public string State { get; set; } = DataState.Disabled;
    }

    public class AccountInsertData : AccountInputData 
    {
        public string Pwd { get; set; }
        public string PwdConfirm { get; set; }
        public long CreateUserID { get; set; }
    }

    public class AccountEditorData : AccountInputData
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }
}