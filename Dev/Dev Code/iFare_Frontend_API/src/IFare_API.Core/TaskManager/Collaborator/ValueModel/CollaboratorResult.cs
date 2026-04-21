using System.Collections.Generic;
using IFare_API.Common.ValueModel;

namespace IFare_API.TaskManager.Collaborator.ValueModel 
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

    public class CollaboratorData 
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string ServiceItem { get; set; }
        public string Tel { get; set; }
        public string Url { get; set; }
        public string ImageFile { get; set; }
        public string ImageName { get; set; }
        public string ImageExtension { get; set; }
    }
}