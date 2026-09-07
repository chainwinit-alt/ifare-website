import { spawn } from "node:child_process";
import { defineNuxtModule, useLogger } from "nuxt/kit";

// 開發用：dev server 起來後自動用預設瀏覽器開啟 i-Fare 查詢頁。
// nuxi 原生的 `--open` 只會開到 app.baseURL（本站為 "/"），無法指定路徑，因此改掛 listen hook。
// 放在 modules/ 由 Nuxt 自動掃描載入，所以 npm run dev 與 npx nuxi dev --host 都會生效。
//
// 環境變數：
//   IFARE_DEV_OPEN=0                    關閉自動開啟
//   IFARE_DEV_OPEN_PATH=/ifare/compare  改成開別的頁面
const DEFAULT_PATH = "/ifare";

// listener 綁在「全介面」時不能直接拿來開本機瀏覽器（--host 啟動會是 0.0.0.0）。
const ANY_HOSTS = new Set(["0.0.0.0", "::", "[::]"]);

// 重載時 nuxi 會建立新的 Nuxt 實體並再次觸發 listen，所以旗標放在 process 層級而非模組層級。
// 涵蓋所有程序內的重載，包含存檔 nuxt.config.ts（走 loadDebounced 軟重載）。
// 例外：改 .env 會讓 nuxi 重新 fork 子程序，那種情況會再開一個分頁。
const OPENED_FLAG = "__IFARE_DEV_OPENED";

const logger = useLogger("dev-auto-open");

const isDisabled = (value?: string) =>
  ["0", "false", "off"].includes((value || "").trim().toLowerCase());

const browserCommand = (url: string): [string, string[]] => {
  switch (process.platform) {
    case "win32":
      // 第二個引數是 start 的視窗標題，不可省略，否則網址會被誤當成標題。
      return ["cmd", ["/c", "start", "", url]];
    case "darwin":
      return ["open", [url]];
    default:
      return ["xdg-open", [url]];
  }
};

export default defineNuxtModule({
  meta: { name: "dev-auto-open" },

  setup(_options, nuxt) {
    // 只在 dev 生效；nuxt build / generate / build_iis_node 完全不受影響。
    if (!nuxt.options.dev || isDisabled(process.env.IFARE_DEV_OPEN)) {
      return;
    }

    nuxt.hook("listen", (_server, listener) => {
      if (process.env[OPENED_FLAG]) {
        return;
      }
      process.env[OPENED_FLAG] = "1";

      // listener.url 已被 nuxi 換成對外的 proxy 網址（nuxi/dist/chunks/dev2.mjs:123-126）。
      // 不能用 listener.address.port——那是 proxy 後面的內部隨機埠（例如 50342）。
      const fallbackBase = `http://localhost:${nuxt.options.devServer.port || 3000}`;
      const path = process.env.IFARE_DEV_OPEN_PATH?.trim() || DEFAULT_PATH;
      let target: URL;
      try {
        target = new URL(path, listener?.url || fallbackBase);
      } catch {
        target = new URL(path, fallbackBase);
      }
      if (ANY_HOSTS.has(target.hostname)) {
        target.hostname = "localhost";
      }
      const url = target.toString();

      const [command, args] = browserCommand(url);
      const warn = (error: unknown) =>
        logger.warn(`無法自動開啟瀏覽器，請手動開啟 ${url}（${error}）`);

      try {
        const child = spawn(command, args, { detached: true, stdio: "ignore" });
        // 非互動式環境（例如當成服務啟動）開不了瀏覽器時只記警告，不讓 dev server 掛掉。
        child.on("error", warn);
        child.unref();
        logger.info(`已自動開啟 ${url}`);
      } catch (error) {
        warn(error);
      }
    });
  },
});
