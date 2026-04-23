using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.TaskManager.Articles.Lazy.ValueModel;

namespace IFare_BDAPI.Articles.Lazy.Dto
{
    [AutoMapTo(typeof(ArticlesLazyInputData))]
    public class ArticlesLazyInputDataDto
    {
        public string Title { get; set; }
        public List<ImageInfoDto> ImageList { get; set; }
        public long CodePolicyID { get; set; }
        public List<long> CodeKeywordIDs { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
        public bool IsEnabled { get; set; }
    }

    [AutoMapTo(typeof(ArticlesLazyInsertData))]
    public class ArticlesLazyInsertDataDto : ArticlesLazyInputDataDto 
    {

    }

    [AutoMapTo(typeof(ArticlesLazyEditorData))]
    public class ArticlesLazyEditorDataDto : ArticlesLazyInputDataDto
    {
        public long ID { get; set; }
    }

    [AutoMapTo(typeof(ArticlesLazyDeleteData))]
    public class ArticlesLazyDeleteDataDto
    {
        public long ID { get; set; }
    }
}