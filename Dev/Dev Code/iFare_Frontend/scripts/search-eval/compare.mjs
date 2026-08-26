// 兩次 eval.mjs 結果的逐題對照：改動前 vs 改動後，哪些變好、哪些變差。
//
//   node eval.mjs --json before.json     改動前：存基準
//   ...改檢索邏輯...
//   node eval.mjs --json after.json      改動後：再跑一次
//   node compare.mjs before.json after.json
//
// 只要有任何一題變差就 exit 1——「總分變高」不能拿來換「某幾題壞掉」。
import { readFileSync } from "node:fs";

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath || !afterPath) {
  console.error("用法：node compare.mjs before.json after.json");
  process.exit(2);
}

const EPS = 1e-9;
const load = (p) => {
  const j = JSON.parse(readFileSync(p, "utf8"));
  if (!Array.isArray(j?.rows)) {
    console.error(`${p} 不像 eval.mjs 的輸出（找不到 rows），確認是用 --json 產生的檔案`);
    process.exit(2);
  }
  return j;
};

const before = load(beforePath);
const after = load(afterPath);
const beforeBy = new Map(before.rows.map((r) => [r.query, r]));
const afterBy = new Map(after.rows.map((r) => [r.query, r]));

const width = (s) => [...String(s)].reduce((w, c) => w + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/.test(c) ? 2 : 1), 0);
const pad = (s, n) => String(s) + " ".repeat(Math.max(0, n - width(s)));
const pct = (x) => `${(Number(x) * 100).toFixed(0)}%`;

const queries = [...new Set([...beforeBy.keys(), ...afterBy.keys()])];
const qW = Math.max(...queries.map(width), 8);

let worse = 0;
let better = 0;
let same = 0;
let onlyOne = 0;

console.log(`前 ${beforePath}（${before.generatedAt || "?"}）\n後 ${afterPath}（${after.generatedAt || "?"}）\n`);
console.log(`判定    ${pad("查詢", qW)}  ${pad("分數 前→後", 18)} ${pad("筆數 前→後", 16)} 說明`);
console.log("-".repeat(qW + 62));

for (const q of queries) {
  const b = beforeBy.get(q);
  const a = afterBy.get(q);

  if (!b || !a) {
    onlyOne++;
    const only = b ? "只在前次" : "只在本次";
    console.log(`  ・   ${pad(q, qW)}  ${pad("—", 18)} ${pad("—", 16)} ${only}（新增或移除的題目，不列入判定）`);
    continue;
  }

  const delta = a.score - b.score;
  let tag;
  if (delta > EPS) { tag = " ↑好 "; better++; }
  else if (delta < -EPS) { tag = "✗↓差"; worse++; }
  else { tag = "  ＝ "; same++; }

  const passNote = b.pass === a.pass ? "" : a.pass ? "（新通過）" : "（原本通過，現在失敗）";
  console.log(
    `${tag}  ${pad(q, qW)}  ${pad(`${pct(b.score)} → ${pct(a.score)}`, 18)} ${pad(`${b.count} → ${a.count}`, 16)} ${a.why || ""}${passNote}`
  );
}

const bs = before.summary || {};
const as = after.summary || {};
const dScore = (as.score ?? 0) - (bs.score ?? 0);
const sign = dScore > EPS ? "+" : "";

console.log(`\n變好 ${better}　變差 ${worse}　持平 ${same}${onlyOne ? `　未對照 ${onlyOne}` : ""}`);
console.log(`總分 ${pct(bs.score ?? 0)} → ${pct(as.score ?? 0)}（${sign}${(dScore * 100).toFixed(0)} 個百分點）`);
console.log(`通過 ${bs.passed ?? "?"}/${bs.total ?? "?"} → ${as.passed ?? "?"}/${as.total ?? "?"}`);

if (worse) {
  console.log(`\n${worse} 題變差，先修再合。`);
  process.exit(1);
}
console.log(better ? "\n沒有任何一題變差，可以合。" : "\n沒有變差，但也沒有變好——這次改動對搜尋品質沒有影響。");
process.exit(0);
