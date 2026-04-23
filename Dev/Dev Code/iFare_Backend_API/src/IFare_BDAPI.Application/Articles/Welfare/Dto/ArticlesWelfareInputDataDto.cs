using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Articles.Welfare.ValueModel;

namespace IFare_BDAPI.Articles.Welfare.Dto
{
    [AutoMapTo(typeof(ArticlesWelfareInputData))]
    public class ArticlesWelfareInputDataDto
    {
        public string Title { get; set; }
        public string? Detail { get; set; }
        public long CodePolicyID { get; set; }
        public List<long> CodeKeywordIDs { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
        public bool IsEnabled { get; set; }
    }

    [AutoMapTo(typeof(ArticlesWelfareInsertData))]
    public class ArticlesWelfareInsertDataDto : ArticlesWelfareInputDataDto 
    {
        
    }

    [AutoMapTo(typeof(ArticlesWelfareEditorData))]
    public class ArticlesWelfareEditorDataDto : ArticlesWelfareInputDataDto
    {
        public long ID { get; set; }
    }

    [AutoMapTo(typeof(ArticlesWelfareDeleteData))]
    public class ArticlesWelfareDeleteDataDto
    {
        public long ID { get; set; }
    }
}