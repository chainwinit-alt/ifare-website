using System;

namespace IFare_BDAPI.TaskManager.ImgManager.ValueModel
{
    public class ImgManagerFilterParam
    {
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public string? Type { get; set; }
        public string? SearchName { get; set; }
        public bool IsUpdateDateFiltered { get; set;} = false;
        public bool IsTypeFiltered { get; set;} = false;
        public bool IsSearchNameFiltered { get; set;} = false;
    }
}