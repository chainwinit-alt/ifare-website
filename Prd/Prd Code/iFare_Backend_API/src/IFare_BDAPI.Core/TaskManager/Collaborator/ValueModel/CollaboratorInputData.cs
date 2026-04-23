using System;
using System.Collections.Generic;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Collaborator.ValueModel
{
    public class CollaboratorInputData
    {
        public string Title { get; set; }
        public string ServiceItem { get; set; }
        public string? Tel { get; set; }
        public string? Url { get; set; }
        public string ImageFile { get; set; }
        public string ImageName { get; set; }
        public string ImageExtension { get; set; }
        public bool IsEnabled { get; set; }
        public string State { get; set; } = DataState.Disabled;
    }

    public class CollaboratorInsertData : CollaboratorInputData 
    {
        public long CreateUserID { get; set; }
    }

    public class CollaboratorEditorData : CollaboratorInputData
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }

    public class CollaboratorDeleteData 
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }
}