namespace IFare_API.Constants
{
    public static class ErrMsgFilter 
    {
        
        public const string DateStart = "起始日期";
        public const string DateEnd = "結束日期";
        public const string CannotEmpty_DateStart = $"{DateStart}{ErrMsg.CannotEmpty}";
        public const string CannotEmpty_DateEnd = $"{DateEnd}{ErrMsg.CannotEmpty}";
        public const string CannotGreater_DateRange = $"{DateStart}{ErrMsg.CannotGreater}{DateEnd}";
    }
}