using System;
using System.Collections.Generic;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Fare.QA.ValueModel
{
    public class FareQAInputData
    {
        public string Question { get; set; }
        public string Answer { get; set; }
        public bool IsEnabled { get; set; }
        public string State { get; set; } = DataState.Disabled;
    }

    public class FareQAInsertData : FareQAInputData 
    {
        public long CreateUserID { get; set; }
    }

    public class FareQAEditorData : FareQAInputData
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }

    public class FareQADeleteData 
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }
}