using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Converter;
using IFare_BDAPI.TaskManager.Account.ValueModel;
using Newtonsoft.Json;

namespace IFare_BDAPI.Account.Dto
{
    [AutoMapTo(typeof(AccountResult))]
    [AutoMapFrom(typeof(AccountResult))]
    public class AccountResultDto : ErrorInfoBaseDto
    {
        public List<AccountDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(AccountData))]
    [AutoMapFrom(typeof(AccountData))]
    public class AccountDataDto : EditorUserBaseDto
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