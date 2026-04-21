using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Account.ValueModel;

namespace IFare_BDAPI.Account.Dto
{
    [AutoMapTo(typeof(AccountInputData))]
    public class AccountInputDataDto
    {
        public string UserName { get; set; }
        public string Account { get; set; }
        public string Email { get; set; }
        public string Permission { get; set; }
        public bool IsEnabled { get; set; }
    }

    [AutoMapTo(typeof(AccountInsertData))]
    public class AccountInsertDataDto : AccountInputDataDto 
    {
        public string Pwd { get; set; }
        public string PwdConfirm { get; set; }
    }

    [AutoMapTo(typeof(AccountEditorData))]
    public class AccountEditorDataDto : AccountInputDataDto
    {
        public long ID { get; set; }
    }
}