using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_API
{
    public partial class ArticleLazyCodeKeyword : Entity
    {
        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public long ArticleLazyId { get; set; }
        public long CodeKeywordId { get; set; }

        public virtual ArticleLazy ArticleLazy { get; set; }
        public virtual CodeKeyword CodeKeyword { get; set; }
    }
}
