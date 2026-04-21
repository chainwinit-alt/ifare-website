using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_API.Common.Dto;
using IFare_API.Converter;
using IFare_API.TaskManager.News.ValueModel;
using Newtonsoft.Json;

namespace IFare_API.News.Dto
{
    /// <summary>
    /// 最新消息查詢結果 DTO，為 API 回應的外層包裝物件，繼承錯誤資訊基底。
    /// 此 DTO 與 TaskManager 的 <see cref="NewsResult"/> 值模型雙向對應。
    /// </summary>
    [AutoMapTo(typeof(NewsResult))]
    [AutoMapFrom(typeof(NewsResult))]
    public class NewsResultDto : ErrorInfoBaseDto
    {
        /// <summary>最新消息資料列表，每筆包含標題、內容及發布時間</summary>
        public List<NewsDataDto> Result { get; set; }
    }

    /// <summary>
    /// 單筆最新消息資料 DTO，包含消息的基本資訊。
    /// 此 DTO 與 TaskManager 的 <see cref="NewsData"/> 值模型雙向對應。
    /// </summary>
    [AutoMapTo(typeof(NewsData))]
    [AutoMapFrom(typeof(NewsData))]
    public class NewsDataDto
    {
        /// <summary>消息唯一識別碼</summary>
        public long ID { get; set; }

        /// <summary>消息標題</summary>
        public string Title { get; set; }

        /// <summary>消息詳細內容（可為 null，JSON 序列化時仍輸出 null）</summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string Content { get; set; }

        /// <summary>
        /// 消息發布時間，使用自訂格式化轉換器（不含時間部分，僅顯示日期）。
        /// [DisableDateTimeNormalization] 確保 ABP 不自動轉換時區。
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_DotNoTime))]
        [DisableDateTimeNormalization]
        public DateTime ReleaseTime { get; set; }
    }
}
