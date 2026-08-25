using IFare_API.Constants;
using IFare_API.TaskManager.Common;
using IFare_API.TaskManager.Fare.Policy.ValueModel;

namespace IFare_API.TaskManager.Fare.Policy.Common
{
    public class FilterParamChecker
    {
        private FarePolicyFilterParam _param;
        private readonly ParamChecker _paramChecker;

        // 本層防呆攔截到明顯垃圾值時記錄的錯誤訊息，由 GetErrMsg() 帶出。
        private string _errMsg = "";

        public FilterParamChecker(FarePolicyFilterParam param)
        {
            _param = param;
            _paramChecker = new ParamChecker();
        }

        public bool IsCheckPass()
        {
            _param.IsQueryFiltered = !string.IsNullOrWhiteSpace(_param.Query);

            // Code Domicile Filter check.
            _param.IsCodeDomicileFiltered = _paramChecker.IsCodeDomicileFiltered(_param.CodeDomicile);

            // Code Recipient Filter check.
            _param.IsCodeRecipientFiltered = _paramChecker.IsCodeRecipientFiltered(_param.CodeRecipient);

            // Code Policy Filter check.
            _param.IsCodePolicyFiltered = _paramChecker.IsCodePolicyFiltered(_param.CodePolicy);

            // Code Income Filter check.
            _param.IsCodeIncomeFiltered = _paramChecker.IsCodeIncomeFiltered(_param.CodeIncome);

            // Code Identities Filter check.
            _param.IsCodeIdentitiesFiltered = _paramChecker.IsCodeIdentitiesFiltered(_param.CodeIdentities);

            // === 最小防呆 =====================================================
            // 驗證刻意維持寬鬆：只擋「前端不可能送出的明顯垃圾值」，其餘一律放行，
            // 讓呼叫端 (FarePolicyTaskManager.GetIFarePolicyList) 原本永遠走不到的
            // Code_ParamFail 路徑，只在真正畸形輸入時才觸發、不再是死碼。
            //
            // 「明顯無效」的唯一判定：某條件的 IsXxxFiltered 已為 true
            // （代表使用者確實帶了值），但帶入的 ID 卻 <= 0。
            //
            // 為何不會誤擋任何正常請求：
            //   - IsXxxFiltered 只有在「帶了實際值」時才為 true（見 ParamChecker）；
            //   - 前端正常送出的搜尋，帶值必為正整數 ID（>= 1），不帶則旗標為 false。
            //   因此「IsXxxFiltered == true 且 值 <= 0」這個組合對前端正常請求永遠不成立，
            //   不會改變任何合法搜尋的結果；只有人為畸形輸入（<= 0 的 ID）才會被擋下。
            //   單一 ID 為 null 時走 nullable 比較會得 false，天然不進攔截分支。

            // 戶籍地：帶了值卻不是正整數 ID。
            if (_param.IsCodeDomicileFiltered && _param.CodeDomicile <= 0)
            {
                _errMsg = $"【{TypeFilter.CodeDomicile}】{ErrMsg.InputFail}";
                return false;
            }

            // 政策類別：帶了值卻不是正整數 ID。
            if (_param.IsCodePolicyFiltered && _param.CodePolicy <= 0)
            {
                _errMsg = $"【{TypeFilter.CodePolicy}】{ErrMsg.InputFail}";
                return false;
            }

            // 受助者：帶了值卻不是正整數 ID。
            if (_param.IsCodeRecipientFiltered && _param.CodeRecipient <= 0)
            {
                _errMsg = $"【受助者】{ErrMsg.InputFail}";
                return false;
            }

            // 經濟條件：帶了值卻不是正整數 ID。
            if (_param.IsCodeIncomeFiltered && _param.CodeIncome <= 0)
            {
                _errMsg = $"【經濟條件】{ErrMsg.InputFail}";
                return false;
            }

            // 特殊身分：帶了清單，但清單中出現 <= 0 的明顯無效項。
            // IsCodeIdentitiesFiltered 為 true 時清單必為非 null 且至少一筆，故 Exists 安全。
            if (_param.IsCodeIdentitiesFiltered && _param.CodeIdentities.Exists(id => id <= 0))
            {
                _errMsg = $"【特殊身分】{ErrMsg.InputFail}";
                return false;
            }

            return true;
        }

        public string GetErrMsg()
        {
            // 優先回傳本層防呆訊息；若本層未攔截，沿用 ParamChecker 既有的訊息機制。
            return string.IsNullOrEmpty(_errMsg) ? _paramChecker.GetErrMsg() : _errMsg;
        }
    }
}
