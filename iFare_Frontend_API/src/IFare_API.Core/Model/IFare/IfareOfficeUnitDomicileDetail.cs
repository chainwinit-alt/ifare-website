using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_API
{
    public partial class IfareOfficeUnitDomicileDetail : Entity
    {
        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public long IfareOfficeUnitDomicileId { get; set; }
        public string UnitName { get; set; }
        public string Tel { get; set; }
        public string Address { get; set; }
        public long? CreateUserId { get; set; }

        public virtual SysUser CreateUser { get; set; }
        public virtual IfareOfficeUnitDomicile IfareOfficeUnitDomicile { get; set; }
    }
}
