using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_BDAPI
{
    public partial class ArticleWelfareCodeKeyword : Entity
    {
        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public long ArticleWelfareId { get; set; }
        public long CodeKeywordId { get; set; }

        public virtual ArticleWelfare ArticleWelfare { get; set; }
        public virtual CodeKeyword CodeKeyword { get; set; }
    }
}
