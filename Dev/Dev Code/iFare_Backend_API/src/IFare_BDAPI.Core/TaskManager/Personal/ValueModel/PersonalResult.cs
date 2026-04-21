using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.Personal.ValueModel
{
    public class PersonalResult : ErrorInfoBase 
    {
        public PersonalResult() {}
        public PersonalResult(ErrorInfoBase errorInfo, PersonalInfo result) 
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public PersonalInfo Result { get; set; }
    }

    public class PersonalInfo 
    {
        public long ID { get; set; }
        public string Account { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Permission { get; set; }
        public string State { get; set; }
    }
}