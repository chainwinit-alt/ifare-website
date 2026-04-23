using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_API
{
    public partial class CodePolicy : Entity
    {
        public CodePolicy()
        {
            ArticleLazies = new HashSet<ArticleLazy>();
            ArticleWelfares = new HashSet<ArticleWelfare>();
            IfarePolicies = new HashSet<IfarePolicy>();
        }

        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public string LabelName { get; set; }
        public string State { get; set; }
        public long? CreateUserId { get; set; }
        public long? UpdateUserId { get; set; }

        public virtual SysUser CreateUser { get; set; }
        public virtual SysUser UpdateUser { get; set; }
        public virtual ICollection<ArticleLazy> ArticleLazies { get; set; }
        public virtual ICollection<ArticleWelfare> ArticleWelfares { get; set; }
        public virtual ICollection<IfarePolicy> IfarePolicies { get; set; }
    }
}
