using System.Collections.Generic;
using IFare_API.Common.ValueModel;

namespace IFare_API.Constants
{
    public static class ErrAPI
    {
        public const int ErrorInfoCode_Success = 0;
        public const float Code_Success = 0F;
        public const string Msg_Success = "成功/Success";
        public const float Code_Success_Create = 0.1F;
        public const string Msg_Success_Create = "新增成功/Create Success";
        public const float Code_Success_Update = 0.2F;
        public const string Msg_Success_Update = "更新成功/Update Success";
        public const float Code_Success_Delete = 0.3F;
        public const string Msg_Success_Delete = "刪除成功/Delete Success";
        public const float Code_Success_Disable = 0.4F;
        public const string Msg_Success_Disable = "停用成功/Disable Success";
        public const float Code_Success_Enable = 0.5F;
        public const string Msg_Success_Enable = "啟用成功/Enable Success";

        public const int ErrorInfoCode_Exception = 999;
        public const float Code_Exception = 999F;
        public const string Msg_Exception = "System Exception";

        public const int ErrorInfoCode_Fail = -1;
        public const float Code_Fail = -1F;
        public const string Msg_Fail = "失敗/Fail";
        public const float Code_Fail_Create = -1.1F;
        public const string Msg_Fail_Create = "新增失敗/Create Fail";
        public const float Code_Fail_Update = -1.2F;
        public const string Msg_Fail_Update = "更新失敗/Update Fail";
        public const float Code_Fail_Delete = -1.3F;
        public const string Msg_Fail_Delete = "刪除失敗/Delete Fail";
        public const float Code_Fail_Disable = -1.4F;
        public const string Msg_Fail_Disable = "停用失敗/Disable Fail";
        public const float Code_Fail_Enable = -1.5F;
        public const string Msg_Fail_Enable = "啟用失敗/Enable Fail";
        public const int ErrorInfoCode_ParamFail = -2;
        public const float Code_ParamFail = -2F;
        public const string Msg_ParamFail = "參數格式錯誤/Param format Fail";
        public const float Code_ParamFail_ValNull = -2.1F;
        public const string Msg_ParamFail_ValNull = "參數輸入為空/Param value is null";

        public static readonly Dictionary<float, ErrorInfoBase> RefDict = new Dictionary<float, ErrorInfoBase>
        {
            { Code_Success, new ErrorInfoBase(ErrorInfoCode_Success, Msg_Success) },
            { Code_Success_Create, new ErrorInfoBase(ErrorInfoCode_Success, Msg_Success_Create) },
            { Code_Success_Update, new ErrorInfoBase(ErrorInfoCode_Success, Msg_Success_Update) },
            { Code_Success_Delete, new ErrorInfoBase(ErrorInfoCode_Success, Msg_Success_Delete) },
            { Code_Success_Disable, new ErrorInfoBase(ErrorInfoCode_Success, Msg_Success_Disable) },
            { Code_Success_Enable, new ErrorInfoBase(ErrorInfoCode_Success, Msg_Success_Enable) },
            { Code_Fail, new ErrorInfoBase(ErrorInfoCode_Fail, Msg_Fail) },
            { Code_Fail_Create, new ErrorInfoBase(ErrorInfoCode_Fail, Msg_Fail_Create) },
            { Code_Fail_Update, new ErrorInfoBase(ErrorInfoCode_Fail, Msg_Fail_Update) },
            { Code_Fail_Delete, new ErrorInfoBase(ErrorInfoCode_Fail, Msg_Fail_Delete) },
            { Code_Fail_Disable, new ErrorInfoBase(ErrorInfoCode_Fail, Msg_Fail_Disable) },
            { Code_Fail_Enable, new ErrorInfoBase(ErrorInfoCode_Fail, Msg_Fail_Enable) },
            { Code_ParamFail, new ErrorInfoBase(ErrorInfoCode_ParamFail, Msg_ParamFail) },
            { Code_ParamFail_ValNull, new ErrorInfoBase(ErrorInfoCode_ParamFail, Msg_ParamFail_ValNull) },
            { Code_Exception, new ErrorInfoBase(ErrorInfoCode_Exception, Msg_Exception) }
        };
    }
}