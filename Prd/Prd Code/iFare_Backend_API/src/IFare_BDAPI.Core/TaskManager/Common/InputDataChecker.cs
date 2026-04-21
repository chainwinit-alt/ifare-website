using System;
using System.Linq;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Common
{
    public class InputDataChecker 
    {
        private string _errMsg = "";
        public InputDataChecker(){}

        public bool IsValStringNull(string value, string inputType)
        {
            var isNull = value == null;
            if (isNull) 
            {
                _errMsg = $"【{inputType}】{ErrMsg.CannotEmpty}";
            }
            return isNull;
        }

        public bool IsPwdDoublePass(string pwd, string pwdConfirm)
        {
            var isPass = pwd == pwdConfirm;
            if (!isPass) 
            {
                _errMsg = $"【{TypeInput.Pwd}】{ErrMsg.InputNotSame}";
            }
            return isPass;
        }

        public bool IsPwdMatchRule(string pwd)
        {
            if (pwd.Length < 6) 
            {
                _errMsg = $"【{TypeInput.Pwd}】{ErrMsg.StrLenLessThan} 6";
                return false;
            }

            if (!pwd.Any(char.IsUpper) || !pwd.Any(char.IsLower) || !pwd.Any(char.IsDigit))
            {
                _errMsg = $"【{TypeInput.Pwd}】{ErrMsg.PwdRuleContainsFail}";
                return false;
            }

            return true;
        }

        public bool IsDataStatePass(string state)
        {
            var isPass = DataState.StateList.Contains(state);
            if (!isPass) 
            {
                _errMsg = $"【{TypeInput.DataState}】{ErrMsg.InputFail}";
            }
            return isPass;
        }

        public bool IsUserPermissionPass(string permission)
        {
            var isPass = UserPermission.PermissionList.Contains(permission);
            if (!isPass) 
            {
                _errMsg = $"【{TypeInput.UserPermission}】{ErrMsg.InputFail}";
            }
            return isPass;
        }

        public bool IsImgManagerType(string type)
        {
            var isPass = PageConst.ImgManageType.Contains(type);
            if (!isPass)
            {
                _errMsg = $"【{TypeInput.ImgType}】{ErrMsg.InputFail}";
            }
            return isPass;
        }

        public string GetErrMsg()
        {
            return _errMsg;
        }
    }
}