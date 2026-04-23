using System;
using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Articles.Lazy.ValueModel
{
    public class ArticlesLazyInputData
    {
        public string Title { get; set; }
        public List<ImageInfo> ImageList { get; set; }
        public long CodePolicyID { get; set; }
        public List<long> CodeKeywordIDs { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
        public bool IsEnabled { get; set; }
        public string State { get; set; } = DataState.Disabled;
    }

    public class ArticlesLazyInsertData : ArticlesLazyInputData 
    {
        public long CreateUserID { get; set; }
    }

    public class ArticlesLazyEditorData : ArticlesLazyInputData
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }

    public class ArticlesLazyDeleteData 
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }
}