namespace IFare_API.Common.ValueModel
{
    public class ErrorInfoBase 
    {
        public ErrorInfoBase() {}
        public ErrorInfoBase(int _errCode, string _errMsg)
        {
            ErrCode = _errCode;
            ErrMsg = _errMsg;
        }
        public int ErrCode { get; set; }
        public string ErrMsg { get; set; }
    }
}