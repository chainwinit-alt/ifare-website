using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_BDAPI
{
    public partial class ArticleLazy : Entity
    {
        public ArticleLazy()
        {
            ArticleLazyCodeKeywords = new HashSet<ArticleLazyCodeKeyword>();
            ArticleLazyImages = new HashSet<ArticleLazyImage>();
        }

        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public string Title { get; set; }
        public long? PolicyId { get; set; }
        public string State { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
        public long? CreateUserId { get; set; }
        public long? UpdateUserId { get; set; }

        public virtual SysUser CreateUser { get; set; }
        public virtual CodePolicy Policy { get; set; }
        public virtual SysUser UpdateUser { get; set; }
        public virtual ICollection<ArticleLazyCodeKeyword> ArticleLazyCodeKeywords { get; set; }
        public virtual ICollection<ArticleLazyImage> ArticleLazyImages { get; set; }
    }
}
