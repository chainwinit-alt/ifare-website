using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using IFare_API;
using Abp.EntityFrameworkCore;

namespace IFare_API.Context
{
    public partial class IFareContext : AbpDbContext
    {
        // public IFareContext()
        // {
        // }

        public IFareContext(DbContextOptions<IFareContext> options)
            : base(options)
        {
        }

        public virtual DbSet<ArticleLazy> ArticleLazies { get; set; }
        public virtual DbSet<ArticleLazyCodeKeyword> ArticleLazyCodeKeywords { get; set; }
        public virtual DbSet<ArticleLazyImage> ArticleLazyImages { get; set; }
        public virtual DbSet<ArticleWelfare> ArticleWelfares { get; set; }
        public virtual DbSet<ArticleWelfareCodeKeyword> ArticleWelfareCodeKeywords { get; set; }
        public virtual DbSet<CodeDomicile> CodeDomiciles { get; set; }
        public virtual DbSet<CodeIdentity> CodeIdentities { get; set; }
        public virtual DbSet<CodeIncome> CodeIncomes { get; set; }
        public virtual DbSet<CodeKeyword> CodeKeywords { get; set; }
        public virtual DbSet<CodePolicy> CodePolicies { get; set; }
        public virtual DbSet<CodeRecipient> CodeRecipients { get; set; }
        public virtual DbSet<Collaborator> Collaborators { get; set; }
        public virtual DbSet<IfareOfficeUnit> IfareOfficeUnits { get; set; }
        public virtual DbSet<IfareOfficeUnitDomicile> IfareOfficeUnitDomiciles { get; set; }
        public virtual DbSet<IfareOfficeUnitDomicileDetail> IfareOfficeUnitDomicileDetails { get; set; }
        public virtual DbSet<IfarePolicy> IfarePolicies { get; set; }
        public virtual DbSet<IfarePolicyCodeIdentity> IfarePolicyCodeIdentities { get; set; }
        public virtual DbSet<IfarePolicyCodeIncome> IfarePolicyCodeIncomes { get; set; }
        public virtual DbSet<IfarePolicyCodeKeyword> IfarePolicyCodeKeywords { get; set; }
        public virtual DbSet<IfarePolicyCodeRecipient> IfarePolicyCodeRecipients { get; set; }
        public virtual DbSet<IfareQa> IfareQas { get; set; }
        public virtual DbSet<Image> Images { get; set; }
        public virtual DbSet<ImgManage> ImgManages { get; set; }
        public virtual DbSet<News> News { get; set; }
        public virtual DbSet<SysUser> SysUsers { get; set; }
        public virtual DbSet<VisitorRecord> VisitorRecords { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseSqlServer("Server=localhost; Database=IFare; Trusted_Connection=True;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ArticleLazy>(entity =>
            {
                entity.ToTable("ArticleLazy");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.DiscontinuedTime).HasColumnType("datetime");

                entity.Property(e => e.PolicyId).HasColumnName("Policy_ID");

                entity.Property(e => e.ReleaseTime).HasColumnType("datetime");

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.ArticleLazyCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_ArticleLazy_SysUser");

                entity.HasOne(d => d.Policy)
                    .WithMany(p => p.ArticleLazies)
                    .HasForeignKey(d => d.PolicyId)
                    .HasConstraintName("FK_ArticleLazy_CodePolicy");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.ArticleLazyUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_ArticleLazy_SysUser1");
            });

            modelBuilder.Entity<ArticleLazyCodeKeyword>(entity =>
            {
                entity.ToTable("ArticleLazy_CodeKeyword");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.ArticleLazyId).HasColumnName("ArticleLazy_ID");

                entity.Property(e => e.CodeKeywordId).HasColumnName("CodeKeyword_ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.ArticleLazy)
                    .WithMany(p => p.ArticleLazyCodeKeywords)
                    .HasForeignKey(d => d.ArticleLazyId)
                    .HasConstraintName("FK_ArticleLazy_CodeKeyword_ArticleLazy");

                entity.HasOne(d => d.CodeKeyword)
                    .WithMany(p => p.ArticleLazyCodeKeywords)
                    .HasForeignKey(d => d.CodeKeywordId)
                    .HasConstraintName("FK_ArticleLazy_CodeKeyword_CodeKeyword");
            });

            modelBuilder.Entity<ArticleLazyImage>(entity =>
            {
                entity.ToTable("ArticleLazy_Images");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.ArticleLazyId).HasColumnName("ArticleLazy_ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.ImagesId).HasColumnName("Images_ID");

                entity.HasOne(d => d.ArticleLazy)
                    .WithMany(p => p.ArticleLazyImages)
                    .HasForeignKey(d => d.ArticleLazyId)
                    .HasConstraintName("FK_ArticleLazy_Images_ArticleLazy");

                entity.HasOne(d => d.Images)
                    .WithMany(p => p.ArticleLazyImages)
                    .HasForeignKey(d => d.ImagesId)
                    .HasConstraintName("FK_ArticleLazy_Images_Images");
            });

            modelBuilder.Entity<ArticleWelfare>(entity =>
            {
                entity.ToTable("ArticleWelfare");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.Detail)
                    .IsRequired()
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.DiscontinuedTime).HasColumnType("datetime");

                entity.Property(e => e.PolicyId).HasColumnName("Policy_ID");

                entity.Property(e => e.ReleaseTime).HasColumnType("datetime");

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.ArticleWelfareCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_ArticleWelfare_SysUser");

                entity.HasOne(d => d.Policy)
                    .WithMany(p => p.ArticleWelfares)
                    .HasForeignKey(d => d.PolicyId)
                    .HasConstraintName("FK_ArticleWelfare_CodePolicy");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.ArticleWelfareUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_ArticleWelfare_SysUser1");
            });

            modelBuilder.Entity<ArticleWelfareCodeKeyword>(entity =>
            {
                entity.ToTable("ArticleWelfare_CodeKeyword");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.ArticleWelfareId).HasColumnName("ArticleWelfare_ID");

                entity.Property(e => e.CodeKeywordId).HasColumnName("CodeKeyword_ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.ArticleWelfare)
                    .WithMany(p => p.ArticleWelfareCodeKeywords)
                    .HasForeignKey(d => d.ArticleWelfareId)
                    .HasConstraintName("FK_ArticleWelfare_CodeKeyword_ArticleWelfare");

                entity.HasOne(d => d.CodeKeyword)
                    .WithMany(p => p.ArticleWelfareCodeKeywords)
                    .HasForeignKey(d => d.CodeKeywordId)
                    .HasConstraintName("FK_ArticleWelfare_CodeKeyword_CodeKeyword");
            });

            modelBuilder.Entity<CodeDomicile>(entity =>
            {
                entity.ToTable("CodeDomicile");

                entity.HasIndex(e => e.LabelName, "IX_CodeDomicile")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.LabelName)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.CodeDomicileCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_CodeDomicile_SysUser");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.CodeDomicileUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_CodeDomicile_SysUser1");
            });

            modelBuilder.Entity<CodeIdentity>(entity =>
            {
                entity.ToTable("CodeIdentity");

                entity.HasIndex(e => e.LabelName, "IX_CodeIdentity")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.LabelName)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.CodeIdentityCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_CodeIdentity_SysUser");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.CodeIdentityUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_CodeIdentity_SysUser1");
            });

            modelBuilder.Entity<CodeIncome>(entity =>
            {
                entity.ToTable("CodeIncome");

                entity.HasIndex(e => e.LabelName, "IX_CodeIncome")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.LabelName)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.CodeIncomeCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_CodeIncome_SysUser");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.CodeIncomeUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_CodeIncome_SysUser1");
            });

            modelBuilder.Entity<CodeKeyword>(entity =>
            {
                entity.ToTable("CodeKeyword");

                entity.HasIndex(e => e.LabelName, "IX_CodeKeyword")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.LabelName)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.CodeKeywordCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_CodeKeyword_SysUser");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.CodeKeywordUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_CodeKeyword_SysUser1");
            });

            modelBuilder.Entity<CodePolicy>(entity =>
            {
                entity.ToTable("CodePolicy");

                entity.HasIndex(e => e.LabelName, "IX_CodePolicy")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.LabelName)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.CodePolicyCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_CodePolicy_SysUser");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.CodePolicyUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_CodePolicy_SysUser1");
            });

            modelBuilder.Entity<CodeRecipient>(entity =>
            {
                entity.ToTable("CodeRecipient");

                entity.HasIndex(e => e.LabelName, "IX_CodeRecipient")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.LabelName)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.CodeRecipientCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_CodeRecipient_SysUser");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.CodeRecipientUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_CodeRecipient_SysUser1");
            });

            modelBuilder.Entity<Collaborator>(entity =>
            {
                entity.ToTable("Collaborator");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.ImagesId).HasColumnName("Images_ID");

                entity.Property(e => e.ServiceItem)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.Tel).HasMaxLength(20);

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.Property(e => e.Url).HasMaxLength(100);

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.CollaboratorCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_Collaborator_SysUser");

                entity.HasOne(d => d.Images)
                    .WithMany(p => p.Collaborators)
                    .HasForeignKey(d => d.ImagesId)
                    .HasConstraintName("FK_Collaborator_Images");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.CollaboratorUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_Collaborator_SysUser1");
            });

            modelBuilder.Entity<IfareOfficeUnit>(entity =>
            {
                entity.ToTable("IFareOfficeUnit");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.IfareOfficeUnitCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_IFareOfficeUnit_SysUser");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.IfareOfficeUnitUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_IFareOfficeUnit_SysUser1");
            });

            modelBuilder.Entity<IfareOfficeUnitDomicile>(entity =>
            {
                entity.ToTable("IFareOfficeUnit_Domicile");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CodeDomicileId).HasColumnName("CodeDomicile_ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.IfareOfficeUnitId).HasColumnName("IFareOfficeUnit_ID");

                entity.HasOne(d => d.CodeDomicile)
                    .WithMany(p => p.IfareOfficeUnitDomiciles)
                    .HasForeignKey(d => d.CodeDomicileId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_IFareOfficeUnit_Domicile_CodeDomicile");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.IfareOfficeUnitDomiciles)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_IFareOfficeUnit_Domicile_SysUser");

                entity.HasOne(d => d.IfareOfficeUnit)
                    .WithMany(p => p.IfareOfficeUnitDomiciles)
                    .HasForeignKey(d => d.IfareOfficeUnitId)
                    .HasConstraintName("FK_IFareOfficeUnit_Domicile_IFareOfficeUnit");
            });

            modelBuilder.Entity<IfareOfficeUnitDomicileDetail>(entity =>
            {
                entity.ToTable("IFareOfficeUnit_DomicileDetail");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.Address).HasMaxLength(50);

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.IfareOfficeUnitDomicileId).HasColumnName("IFareOfficeUnit_Domicile_ID");

                entity.Property(e => e.Tel).HasMaxLength(20);

                entity.Property(e => e.UnitName).HasMaxLength(50);

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.IfareOfficeUnitDomicileDetails)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_IFareOfficeUnit_DomicileDetail_SysUser");

                entity.HasOne(d => d.IfareOfficeUnitDomicile)
                    .WithMany(p => p.IfareOfficeUnitDomicileDetails)
                    .HasForeignKey(d => d.IfareOfficeUnitDomicileId)
                    .HasConstraintName("FK_IFareOfficeUnit_DomicileDetail_IFareOfficeUnit_Domicile");
            });

            modelBuilder.Entity<IfarePolicy>(entity =>
            {
                entity.ToTable("IFarePolicy");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CodeDomicileId).HasColumnName("CodeDomicile_ID");

                entity.Property(e => e.CodePolicyId).HasColumnName("CodePolicy_ID");

                entity.Property(e => e.CompetentAuthority).HasMaxLength(50);

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.DiscontinuedTime).HasColumnType("datetime");

                entity.Property(e => e.IfareOfficeUnitId).HasColumnName("IFareOfficeUnit_ID");

                entity.Property(e => e.OfficeUnitInfo)
                    .HasMaxLength(50)
                    .HasColumnName("OfficeUnit_Info");

                entity.Property(e => e.OfficeUnitTel)
                    .HasMaxLength(20)
                    .HasColumnName("OfficeUnit_Tel");

                entity.Property(e => e.ReleaseTime).HasColumnType("datetime");

                entity.Property(e => e.Remark).HasMaxLength(100);

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CodeDomicile)
                    .WithMany(p => p.IfarePolicies)
                    .HasForeignKey(d => d.CodeDomicileId)
                    .HasConstraintName("FK_IFarePolicy_CodeDomicile");

                entity.HasOne(d => d.CodePolicy)
                    .WithMany(p => p.IfarePolicies)
                    .HasForeignKey(d => d.CodePolicyId)
                    .HasConstraintName("FK_IFarePolicy_CodePolicy");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.IfarePolicyCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_IFarePolicy_SysUser");

                entity.HasOne(d => d.IfareOfficeUnit)
                    .WithMany(p => p.IfarePolicies)
                    .HasForeignKey(d => d.IfareOfficeUnitId)
                    .HasConstraintName("FK_IFarePolicy_IFareOfficeUnit");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.IfarePolicyUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_IFarePolicy_SysUser1");
            });

            modelBuilder.Entity<IfarePolicyCodeIdentity>(entity =>
            {
                entity.ToTable("IFarePolicy_CodeIdentity");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CodeIdentityId).HasColumnName("CodeIdentity_ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.IfarePolicyId).HasColumnName("IFarePolicy_ID");

                entity.HasOne(d => d.CodeIdentity)
                    .WithMany(p => p.IfarePolicyCodeIdentities)
                    .HasForeignKey(d => d.CodeIdentityId)
                    .HasConstraintName("FK_IFarePolicy_CodeIdentity_CodeIdentity");

                entity.HasOne(d => d.IfarePolicy)
                    .WithMany(p => p.IfarePolicyCodeIdentities)
                    .HasForeignKey(d => d.IfarePolicyId)
                    .HasConstraintName("FK_IFarePolicy_CodeIdentity_IFarePolicy");
            });

            modelBuilder.Entity<IfarePolicyCodeIncome>(entity =>
            {
                entity.ToTable("IFarePolicy_CodeIncome");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CodeIncomeId).HasColumnName("CodeIncome_ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.IfarePolicyId).HasColumnName("IFarePolicy_ID");

                entity.HasOne(d => d.CodeIncome)
                    .WithMany(p => p.IfarePolicyCodeIncomes)
                    .HasForeignKey(d => d.CodeIncomeId)
                    .HasConstraintName("FK_IFarePolicy_Income_CodeIncome");

                entity.HasOne(d => d.IfarePolicy)
                    .WithMany(p => p.IfarePolicyCodeIncomes)
                    .HasForeignKey(d => d.IfarePolicyId)
                    .HasConstraintName("FK_IFarePolicy_Income_IFarePolicy");
            });

            modelBuilder.Entity<IfarePolicyCodeKeyword>(entity =>
            {
                entity.ToTable("IFarePolicy_CodeKeyword");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CodeKeywordId).HasColumnName("CodeKeyword_ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.IfarePolicyId).HasColumnName("IFarePolicy_ID");

                entity.HasOne(d => d.CodeKeyword)
                    .WithMany(p => p.IfarePolicyCodeKeywords)
                    .HasForeignKey(d => d.CodeKeywordId)
                    .HasConstraintName("FK_IFarePolicy_CodeKeyword_CodeKeyword");

                entity.HasOne(d => d.IfarePolicy)
                    .WithMany(p => p.IfarePolicyCodeKeywords)
                    .HasForeignKey(d => d.IfarePolicyId)
                    .HasConstraintName("FK_IFarePolicy_CodeKeyword_IFarePolicy");
            });

            modelBuilder.Entity<IfarePolicyCodeRecipient>(entity =>
            {
                entity.ToTable("IFarePolicy_CodeRecipient");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CodeRecipientId).HasColumnName("CodeRecipient_ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.IfarePolicyId).HasColumnName("IFarePolicy_ID");

                entity.HasOne(d => d.CodeRecipient)
                    .WithMany(p => p.IfarePolicyCodeRecipients)
                    .HasForeignKey(d => d.CodeRecipientId)
                    .HasConstraintName("FK_IFarePolicy_CodeRecipient_CodeRecipient");

                entity.HasOne(d => d.IfarePolicy)
                    .WithMany(p => p.IfarePolicyCodeRecipients)
                    .HasForeignKey(d => d.IfarePolicyId)
                    .HasConstraintName("FK_IFarePolicy_CodeRecipient_IFarePolicy");
            });

            modelBuilder.Entity<IfareQa>(entity =>
            {
                entity.ToTable("IFareQA");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.Answer).IsRequired();

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.Question)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.IfareQaCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_IFareQA_SysUser");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.IfareQaUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_IFareQA_SysUser1");
            });

            modelBuilder.Entity<Image>(entity =>
            {
                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.ImageName).HasMaxLength(50);

                entity.Property(e => e.ImageNameExtension).HasMaxLength(15);

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.Images)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_Images_SysUser");
            });

            modelBuilder.Entity<ImgManage>(entity =>
            {
                entity.ToTable("ImgManage");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.ImgExtension)
                    .IsRequired()
                    .HasMaxLength(15);

                entity.Property(e => e.ImgPath).IsRequired();

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Type)
                    .IsRequired()
                    .HasMaxLength(8);

                entity.Property(e => e.UpdateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.ImgManages)
                    .HasForeignKey(d => d.UpdateUserId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_ImgManage_SysUser");
            });

            modelBuilder.Entity<News>(entity =>
            {
                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.DiscontinuedTime).HasColumnType("datetime");

                entity.Property(e => e.ReleaseTime).HasColumnType("datetime");

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.Title).IsRequired();

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.NewsCreateUsers)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_News_SysUser");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.NewsUpdateUsers)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_News_SysUser1");
            });

            modelBuilder.Entity<SysUser>(entity =>
            {
                entity.ToTable("SysUser");

                entity.HasIndex(e => e.Account, "IX_SysUser")
                    .IsUnique();

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.Account)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.CreateTime)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreateUserId).HasColumnName("CreateUser_ID");

                entity.Property(e => e.Email).HasMaxLength(100);

                entity.Property(e => e.Password).IsRequired();

                entity.Property(e => e.Permissions)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Reader')");

                entity.Property(e => e.State)
                    .IsRequired()
                    .HasMaxLength(10)
                    .HasDefaultValueSql("(N'Disabled')");

                entity.Property(e => e.UpdateTime).HasColumnType("datetime");

                entity.Property(e => e.UpdateUserId).HasColumnName("UpdateUser_ID");

                entity.Property(e => e.UserName)
                    .IsRequired()
                    .HasMaxLength(25);

                entity.HasOne(d => d.CreateUser)
                    .WithMany(p => p.InverseCreateUser)
                    .HasForeignKey(d => d.CreateUserId)
                    .HasConstraintName("FK_SysUser_SysUser");

                entity.HasOne(d => d.UpdateUser)
                    .WithMany(p => p.InverseUpdateUser)
                    .HasForeignKey(d => d.UpdateUserId)
                    .HasConstraintName("FK_SysUser_SysUser1");
            });

            modelBuilder.Entity<VisitorRecord>(entity =>
            {
                entity.ToTable("VisitorRecord");

                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.CreateDate)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.Ip)
                    .HasMaxLength(50)
                    .HasColumnName("IP");

                entity.Property(e => e.VisitorFrom).HasMaxLength(50);

                entity.Property(e => e.VisitorName).HasMaxLength(50);

                entity.Property(e => e.VisitorRoute).HasMaxLength(50);
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
