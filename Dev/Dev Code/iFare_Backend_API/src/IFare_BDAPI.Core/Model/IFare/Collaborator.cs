using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_BDAPI
{
    public partial class Collaborator : Entity
    {
        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public string Title { get; set; }
        public string ServiceItem { get; set; }
        public string Tel { get; set; }
        public string Url { get; set; }
        public long? ImagesId { get; set; }
        public string State { get; set; }
        public long? CreateUserId { get; set; }
        public long? UpdateUserId { get; set; }

        public virtual SysUser CreateUser { get; set; }
        public virtual Image Images { get; set; }
        public virtual SysUser UpdateUser { get; set; }
    }
}
