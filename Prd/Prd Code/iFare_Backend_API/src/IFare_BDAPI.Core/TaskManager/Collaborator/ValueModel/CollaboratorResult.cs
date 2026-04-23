using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.Collaborator.ValueModel
{
    public class CollaboratorResult : ErrorInfoBase
    {
        public CollaboratorResult(ErrorInfoBase errorInfo, List<CollaboratorData> result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public List<CollaboratorData> Result { get; set; }
    }

    public class CollaboratorData : EditorUserBase
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string ServiceItem { get; set; }
        public string Tel { get; set; }
        public string Url { get; set; }
        public string ImageFile { get; set; }
        public string ImageName { get; set; }
        public string ImageExtension { get; set; }
        public string State { get; set; }
    }
}