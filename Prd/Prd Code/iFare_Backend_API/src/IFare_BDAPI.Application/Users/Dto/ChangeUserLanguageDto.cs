using System.ComponentModel.DataAnnotations;

namespace IFare_BDAPI.Users.Dto
{
    public class ChangeUserLanguageDto
    {
        [Required]
        public string LanguageName { get; set; }
    }
}