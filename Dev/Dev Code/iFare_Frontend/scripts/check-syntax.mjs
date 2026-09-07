/**
 * 語法檢查：把專案裡的 .ts / .vue 全部丟進編譯器跑一遍。
 *
 * 這不是型別檢查（專案沒裝 vue-tsc / typescript），但足以擋掉最常見的意外——
 * 改壞括號、漏掉逗號、SFC 的 template 寫錯。這些在 Nuxt dev 底下往往要等到
 * 真的打開那一頁才會爆，改完 server 檔案更是完全沒感覺。
 *
 * 用的是 nuxt 已經帶進來的 esbuild 與 @vue/compiler-sfc，不新增任何相依。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { transformSync } from "esbuild";
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc";

const SKIP_DIRS = new Set(["node_modules", ".nuxt", ".output", ".git", "dist", "IP"]);
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith(".ts") || name.endsWith(".vue")) files.push(full);
  }
}

walk(process.cwd());

const failures = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  try {
    if (file.endsWith(".ts")) {
      transformSync(source, { loader: "ts" });
      continue;
    }

    const { descriptor, errors } = parse(source, { filename: file });
    if (errors.length) throw new Error(errors.map((item) => item.message).join(" / "));
    if (descriptor.script || descriptor.scriptSetup) compileScript(descriptor, { id: "check" });
    if (descriptor.template) {
      const result = compileTemplate({
        source: descriptor.template.content,
        filename: file,
        id: "check",
      });
      if (result.errors.length) {
        throw new Error(result.errors.map((item) => item.message || item).join(" / "));
      }
    }
  } catch (error) {
    failures.push({ file, message: error.message });
  }
}

for (const item of failures) {
  console.error("FAIL " + item.file);
  console.error("     " + item.message);
}
console.log(
  failures.length
    ? failures.length + " / " + files.length + " 個檔案有語法錯誤"
    : files.length + " 個檔案語法檢查通過"
);
process.exit(failures.length ? 1 : 0);
