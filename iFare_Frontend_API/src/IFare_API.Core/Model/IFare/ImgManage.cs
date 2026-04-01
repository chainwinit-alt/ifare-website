using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_API
{
    public partial class ImgManage : Entity
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string ImgPath { get; set; }
        public string ImgExtension { get; set; }
        public string Type { get; set; }
        public int Size { get; set; }
        public long? UpdateUserId { get; set; }
        public DateTime UpdateTime { get; set; }

        public virtual SysUser UpdateUser { get; set; }
    }
}
