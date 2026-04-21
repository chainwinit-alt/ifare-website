
namespace IFare_BDAPI.TaskManager.Personal.ValueModel
{
    public class PersonalReq 
    {
        public long UserID { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Password_Old { get; set; }
        public string Password_New { get; set; }
        public long UpdateUserID { get; set; }
    }
}