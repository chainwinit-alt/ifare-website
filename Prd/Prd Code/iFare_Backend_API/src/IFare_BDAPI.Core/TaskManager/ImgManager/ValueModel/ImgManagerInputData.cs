namespace IFare_BDAPI.TaskManager.ImgManager.ValueModel
{
    public class ImgManagerInputData
    {
        public string Title { get; set; }
        public string ImgPath { get; set; }
        public string ImgExtension { get; set; }
        public string Type { get; set; }
        public int Size { get; set; }
        public long UpdateUserID { get; set; }
    }

    public class ImgManagerInsertData : ImgManagerInputData
    {

    }

    public class ImgManagerEditData : ImgManagerInputData
    {
        public long ID { get; set; }
    }
}