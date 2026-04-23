// 生產環境伺服器啟動入口
// 執行 `nuxt build` 後，由此檔案載入編譯好的伺服器端程式
// 部署至 IIS 或 Node.js 伺服器時，以此作為啟動點
import("./.output/server/index.mjs");
