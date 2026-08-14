using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Chatbot.Card.Common;
using IFare_BDAPI.TaskManager.Chatbot.Card.ValueModel;

namespace IFare_BDAPI.TaskManager.Chatbot.Card
{
    public class ChatbotCardTaskManager : IChatbotCardTaskManager
    {
        private readonly IRepository<ChatbotCard> _repositoryChatbotCard;
        private readonly ICommonToolsManager _commonTools;

        public ChatbotCardTaskManager(IRepository<ChatbotCard> repositoryChatbotCard, ICommonToolsManager commonTools)
        {
            _repositoryChatbotCard = repositoryChatbotCard;
            _commonTools = commonTools;
        }

        public ChatbotCardResult GetDataList(ChatbotCardFilterParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<ChatbotCardData>();

            if (!paramChecker.IsCheckPass()) return new ChatbotCardResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

            var query = _repositoryChatbotCard.GetAll().Where(p => p.State != DataState.Delete);

            if (param.OnlyEnabled) query = query.Where(p => p.State == DataState.Enabled);
            if (param.IsCreateDateFiltered) query = query.Where(p => p.CreateTime >= param.CreateDateStart && p.CreateTime < param.CreateDateEnd.Value.AddDays(1));
            if (param.IsUpdateDateFiltered) query = query.Where(p => p.UpdateTime >= param.UpdateDateStart && p.UpdateTime < param.UpdateDateEnd.Value.AddDays(1));
            if (param.IsIDsFiltered) query = query.Where(p => param.IDs.Contains(p.Id));

            list = query.Select(p => new ChatbotCardData
                        {
                            ID = p.Id,
                            CardKey = p.CardKey,
                            Title = p.Title,
                            Keywords = p.Keywords,
                            Answer = p.Answer,
                            LinkKeys = p.LinkKeys,
                            Priority = p.Priority,
                            Sort = p.Sort,
                            State = p.State,
                            CreateDate = p.CreateTime,
                            CreateUserID = p.CreateUserId,
                            CreateUserName = p.CreateUser.UserName,
                            UpdateDate = p.UpdateTime,
                            UpdateUserID = p.UpdateUserId,
                            UpdateUserName = p.UpdateUser.UserName
                        })
                        .OrderBy(p => p.Sort)
                        .ThenByDescending(p => p.CreateDate)
                        .ToList();

            return new ChatbotCardResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public ErrorInfoBase InsertChatbotCard(ChatbotCardInsertData insertData)
        {
            try
            {
                var inputChecker = new InputChecker(insertData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var cardKey = insertData.CardKey.Trim().ToLower();

                // 卡片代號會被前台當識別碼使用，重複會導致選卡結果不可預期
                if (IsCardKeyDuplicated(cardKey, null))
                {
                    return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "卡片代號「" + cardKey + "」已存在，請換一個。");
                }

                _repositoryChatbotCard.Insert(new ChatbotCard
                {
                    CardKey = cardKey,
                    Title = insertData.Title,
                    Keywords = insertData.Keywords,
                    Answer = insertData.Answer,
                    LinkKeys = NormalizeLinkKeys(insertData.LinkKeys),
                    Priority = insertData.Priority,
                    Sort = insertData.Sort,
                    State = insertData.State,
                    CreateUserId = insertData.CreateUserID
                });

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase UpdateChatbotCard(ChatbotCardEditorData editorData)
        {
            try
            {
                var inputChecker = new InputChecker(editorData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var item = _repositoryChatbotCard.GetAll()
                                        .Where(p => p.Id == editorData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                var cardKey = editorData.CardKey.Trim().ToLower();

                if (IsCardKeyDuplicated(cardKey, editorData.ID))
                {
                    return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "卡片代號「" + cardKey + "」已存在，請換一個。");
                }

                item.CardKey = cardKey;
                item.Title = editorData.Title;
                item.Keywords = editorData.Keywords;
                item.Answer = editorData.Answer;
                item.LinkKeys = NormalizeLinkKeys(editorData.LinkKeys);
                item.Priority = editorData.Priority;
                item.Sort = editorData.Sort;
                item.State = editorData.State;
                item.UpdateUserId = editorData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryChatbotCard.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase DeleteChatbotCard(ChatbotCardDeleteData deleteData)
        {
            try
            {
                var item = _repositoryChatbotCard.GetAll()
                                        .Where(p => p.Id == deleteData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                item.State = DataState.Delete;
                item.UpdateUserId = deleteData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryChatbotCard.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        private bool IsCardKeyDuplicated(string cardKey, long? excludeId)
        {
            return _repositoryChatbotCard.GetAll()
                .Any(p => p.State != DataState.Delete
                    && p.CardKey == cardKey
                    && (!excludeId.HasValue || p.Id != excludeId.Value));
        }

        private string NormalizeLinkKeys(string linkKeys)
        {
            if (string.IsNullOrWhiteSpace(linkKeys)) return string.Empty;

            return string.Join(",", linkKeys
                .Split(new[] { ',', '，', '\n' })
                .Select(item => item.Trim().ToLower())
                .Where(item => !string.IsNullOrEmpty(item))
                .Distinct()
                .Take(2));
        }
    }
}
