using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_API
{
    public partial class VisitorRecord : Entity
    {
        public long Id { get; set; }
        public DateTime CreateDate { get; set; }
        public string VisitorName { get; set; }
        public string VisitorFrom { get; set; }
        public string Ip { get; set; }
        public string VisitorRoute { get; set; }
    }
}
