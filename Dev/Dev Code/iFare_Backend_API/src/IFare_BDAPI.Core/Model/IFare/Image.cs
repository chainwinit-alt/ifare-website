using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_BDAPI
{
    public partial class Image : Entity
    {
        public Image()
        {
            ArticleLazyImages = new HashSet<ArticleLazyImage>();
            Collaborators = new HashSet<Collaborator>();
        }

        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public string ImagePath { get; set; }
        public string ImageName { get; set; }
        public string ImageNameExtension { get; set; }
        public long? CreateUserId { get; set; }

        public virtual SysUser CreateUser { get; set; }
        public virtual ICollection<ArticleLazyImage> ArticleLazyImages { get; set; }
        public virtual ICollection<Collaborator> Collaborators { get; set; }
    }
}
