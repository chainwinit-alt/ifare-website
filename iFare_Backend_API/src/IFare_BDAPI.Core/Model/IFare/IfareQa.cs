using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_BDAPI
{
    public partial class IfareQa : Entity
    {
        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public string Question { get; set; }
        public string Answer { get; set; }
        public string State { get; set; }
        public long? CreateUserId { get; set; }
        public long? UpdateUserId { get; set; }

        public virtual SysUser CreateUser { get; set; }
        public virtual SysUser UpdateUser { get; set; }
    }
}
