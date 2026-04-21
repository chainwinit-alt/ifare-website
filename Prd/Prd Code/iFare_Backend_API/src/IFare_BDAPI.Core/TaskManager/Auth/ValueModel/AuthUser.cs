namespace IFare_BDAPI.TaskManager.Auth.ValueModel
{
    public class AuthUser 
    {
        public long Id { get; set;}
        public string Act { get; set; }
        public string Pwd { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Permission { get; set; }
        public string State { get; set; }
    }
}