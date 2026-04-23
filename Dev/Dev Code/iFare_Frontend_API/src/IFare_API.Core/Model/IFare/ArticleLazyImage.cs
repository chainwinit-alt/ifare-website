using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_API
{
    public partial class ArticleLazyImage : Entity
    {
        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public long ArticleLazyId { get; set; }
        public long ImagesId { get; set; }

        public virtual ArticleLazy ArticleLazy { get; set; }
        public virtual Image Images { get; set; }
    }
}
