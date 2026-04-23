using System;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Code.ValueModel
{
    public class CodeEditorData 
    {
        public long ID { get; set; }
        public string LabelName { get; set; }
        public bool IsEnabled { get; set; }
        public long UpdateUserID { get; set; }
        public string State { get; set; } = DataState.Disabled;
    }
}