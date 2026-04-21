using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_BDAPI
{
    public partial class SysUser : Entity
    {
        public SysUser()
        {
            ArticleLazyCreateUsers = new HashSet<ArticleLazy>();
            ArticleLazyUpdateUsers = new HashSet<ArticleLazy>();
            ArticleWelfareCreateUsers = new HashSet<ArticleWelfare>();
            ArticleWelfareUpdateUsers = new HashSet<ArticleWelfare>();
            CodeDomicileCreateUsers = new HashSet<CodeDomicile>();
            CodeDomicileUpdateUsers = new HashSet<CodeDomicile>();
            CodeIdentityCreateUsers = new HashSet<CodeIdentity>();
            CodeIdentityUpdateUsers = new HashSet<CodeIdentity>();
            CodeIncomeCreateUsers = new HashSet<CodeIncome>();
            CodeIncomeUpdateUsers = new HashSet<CodeIncome>();
            CodeKeywordCreateUsers = new HashSet<CodeKeyword>();
            CodeKeywordUpdateUsers = new HashSet<CodeKeyword>();
            CodePolicyCreateUsers = new HashSet<CodePolicy>();
            CodePolicyUpdateUsers = new HashSet<CodePolicy>();
            CodeRecipientCreateUsers = new HashSet<CodeRecipient>();
            CodeRecipientUpdateUsers = new HashSet<CodeRecipient>();
            CollaboratorCreateUsers = new HashSet<Collaborator>();
            CollaboratorUpdateUsers = new HashSet<Collaborator>();
            IfareOfficeUnitCreateUsers = new HashSet<IfareOfficeUnit>();
            IfareOfficeUnitDomicileDetails = new HashSet<IfareOfficeUnitDomicileDetail>();
            IfareOfficeUnitDomiciles = new HashSet<IfareOfficeUnitDomicile>();
            IfareOfficeUnitUpdateUsers = new HashSet<IfareOfficeUnit>();
            IfarePolicyCreateUsers = new HashSet<IfarePolicy>();
            IfarePolicyUpdateUsers = new HashSet<IfarePolicy>();
            IfareQaCreateUsers = new HashSet<IfareQa>();
            IfareQaUpdateUsers = new HashSet<IfareQa>();
            Images = new HashSet<Image>();
            ImgManages = new HashSet<ImgManage>();
            InverseCreateUser = new HashSet<SysUser>();
            InverseUpdateUser = new HashSet<SysUser>();
            NewsCreateUsers = new HashSet<News>();
            NewsUpdateUsers = new HashSet<News>();
        }

        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public string Account { get; set; }
        public string Password { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Permissions { get; set; }
        public string State { get; set; }
        public long? CreateUserId { get; set; }
        public long? UpdateUserId { get; set; }

        public virtual SysUser CreateUser { get; set; }
        public virtual SysUser UpdateUser { get; set; }
        public virtual ICollection<ArticleLazy> ArticleLazyCreateUsers { get; set; }
        public virtual ICollection<ArticleLazy> ArticleLazyUpdateUsers { get; set; }
        public virtual ICollection<ArticleWelfare> ArticleWelfareCreateUsers { get; set; }
        public virtual ICollection<ArticleWelfare> ArticleWelfareUpdateUsers { get; set; }
        public virtual ICollection<CodeDomicile> CodeDomicileCreateUsers { get; set; }
        public virtual ICollection<CodeDomicile> CodeDomicileUpdateUsers { get; set; }
        public virtual ICollection<CodeIdentity> CodeIdentityCreateUsers { get; set; }
        public virtual ICollection<CodeIdentity> CodeIdentityUpdateUsers { get; set; }
        public virtual ICollection<CodeIncome> CodeIncomeCreateUsers { get; set; }
        public virtual ICollection<CodeIncome> CodeIncomeUpdateUsers { get; set; }
        public virtual ICollection<CodeKeyword> CodeKeywordCreateUsers { get; set; }
        public virtual ICollection<CodeKeyword> CodeKeywordUpdateUsers { get; set; }
        public virtual ICollection<CodePolicy> CodePolicyCreateUsers { get; set; }
        public virtual ICollection<CodePolicy> CodePolicyUpdateUsers { get; set; }
        public virtual ICollection<CodeRecipient> CodeRecipientCreateUsers { get; set; }
        public virtual ICollection<CodeRecipient> CodeRecipientUpdateUsers { get; set; }
        public virtual ICollection<Collaborator> CollaboratorCreateUsers { get; set; }
        public virtual ICollection<Collaborator> CollaboratorUpdateUsers { get; set; }
        public virtual ICollection<IfareOfficeUnit> IfareOfficeUnitCreateUsers { get; set; }
        public virtual ICollection<IfareOfficeUnitDomicileDetail> IfareOfficeUnitDomicileDetails { get; set; }
        public virtual ICollection<IfareOfficeUnitDomicile> IfareOfficeUnitDomiciles { get; set; }
        public virtual ICollection<IfareOfficeUnit> IfareOfficeUnitUpdateUsers { get; set; }
        public virtual ICollection<IfarePolicy> IfarePolicyCreateUsers { get; set; }
        public virtual ICollection<IfarePolicy> IfarePolicyUpdateUsers { get; set; }
        public virtual ICollection<IfareQa> IfareQaCreateUsers { get; set; }
        public virtual ICollection<IfareQa> IfareQaUpdateUsers { get; set; }
        public virtual ICollection<Image> Images { get; set; }
        public virtual ICollection<ImgManage> ImgManages { get; set; }
        public virtual ICollection<SysUser> InverseCreateUser { get; set; }
        public virtual ICollection<SysUser> InverseUpdateUser { get; set; }
        public virtual ICollection<News> NewsCreateUsers { get; set; }
        public virtual ICollection<News> NewsUpdateUsers { get; set; }
    }
}
