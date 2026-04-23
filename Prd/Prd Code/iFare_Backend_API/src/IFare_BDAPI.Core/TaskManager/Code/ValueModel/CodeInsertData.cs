using System;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Code.ValueModel
{
    public class CodeInsertData 
    {
        public string LabelName { get; set; }
        public bool IsEnabled { get; set; }
        public long CreateUserID { get; set; }
        public string State { get; set; } = DataState.Disabled;
    }
}