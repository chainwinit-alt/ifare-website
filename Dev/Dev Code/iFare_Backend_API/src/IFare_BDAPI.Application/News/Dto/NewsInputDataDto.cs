using System;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.News.ValueModel;

namespace IFare_BDAPI.News.Dto
{
    [AutoMapTo(typeof(NewsInputData))]
    public class NewsInputDataDto
    {
        public string Title { get; set; }
        public string? Detail { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
        public bool IsEnabled { get; set; }
    }

    [AutoMapTo(typeof(NewsInsertData))]
    public class NewsInsertDataDto : NewsInputDataDto 
    {
        
    }

    [AutoMapTo(typeof(NewsEditorData))]
    public class NewsEditorDataDto : NewsInputDataDto
    {
        public long ID { get; set; }
    }

    [AutoMapTo(typeof(NewsDeleteData))]
    public class NewsDeleteDataDto
    {
        public long ID { get; set; }
    }
}