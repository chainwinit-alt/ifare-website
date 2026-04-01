using System;
using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.Account.ValueModel
{
    public class AccountResult : ErrorInfoBase
    {
        public AccountResult() {}
        public AccountResult(ErrorInfoBase errInfo, List<AccountData> result)
        {
            ErrCode = errInfo.ErrCode;
            ErrMsg = errInfo.ErrMsg;
            Result = result;
        }
        public List<AccountData> Result { get; set; }
    }

    public class AccountData : EditorUserBase
    {
        public long ID { get; set; }
        public string Account { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Permission { get; set; }
        public string State { get; set; }
        public string Pwd { get; set; }
    }
}