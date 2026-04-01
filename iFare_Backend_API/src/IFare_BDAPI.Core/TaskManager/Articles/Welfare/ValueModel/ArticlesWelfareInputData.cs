using System;
using System.Collections.Generic;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Articles.Welfare.ValueModel
{
    public class ArticlesWelfareInputData
    {
        public string Title { get; set; }
        public string? Detail { get; set; }
        public long CodePolicyID { get; set; }
        public List<long> CodeKeywordIDs { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
        public bool IsEnabled { get; set; }
        public string State { get; set; } = DataState.Disabled;
    }

    public class ArticlesWelfareInsertData : ArticlesWelfareInputData 
    {
        public long CreateUserID { get; set; }
    }

    public class ArticlesWelfareEditorData : ArticlesWelfareInputData
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }

    public class ArticlesWelfareDeleteData 
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }
}