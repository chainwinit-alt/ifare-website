using System.Threading.Tasks;
using IFare_BDAPI.Models.TokenAuth;
using IFare_BDAPI.Web.Controllers;
using Shouldly;
using Xunit;

namespace IFare_BDAPI.Web.Tests.Controllers
{
    public class HomeController_Tests: IFare_BDAPIWebTestBase
    {
        [Fact]
        public async Task Index_Test()
        {
            await AuthenticateAsync(null, new AuthenticateModel
            {
                UserNameOrEmailAddress = "admin",
                Password = "123qwe"
            });

            //Act
            var response = await GetResponseAsStringAsync(
                GetUrl<HomeController>(nameof(HomeController.Index))
            );

            //Assert
            response.ShouldNotBeNullOrEmpty();
        }
    }
}