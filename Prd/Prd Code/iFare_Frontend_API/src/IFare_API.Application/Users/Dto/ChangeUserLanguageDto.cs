using System.ComponentModel.DataAnnotations;

namespace IFare_API.Users.Dto
{
    public class ChangeUserLanguageDto
    {
        [Required]
        public string LanguageName { get; set; }
    }
}