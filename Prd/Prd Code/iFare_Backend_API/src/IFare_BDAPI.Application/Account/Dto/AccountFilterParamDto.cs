using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Account.ValueModel;

namespace IFare_BDAPI.Account.Dto
{
    [AutoMapTo(typeof(AccountFilterParam))]
    public class AccountFilterParamDto
    {
        public string Permission { get; set; }
        public string State { get; set; }
        public string Account { get; set; }
        public List<long>? IDs { get; set; }
    }
}