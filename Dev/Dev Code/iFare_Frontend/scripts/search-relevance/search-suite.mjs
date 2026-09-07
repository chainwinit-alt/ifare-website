// 檢索調參的前後對照。
//
//   node search-suite.mjs > baseline.json          改動前：存基準（JSON 到 stdout）
//   node search-suite.mjs --compare baseline.json  改動後：逐項對照，有回歸就 exit 1
//
// 判定規則寫死在查詢分組裡，不從基準檔推論：
//   ZERO_TOPICS  站內沒有的主題 → 必須 0 筆（不管基準當時是幾筆）
//   REAL_TOPICS  站內真實主題   → 筆數與排名第一筆都要跟基準一致
const API = process.env.IFARE_API_BASE || "http://localhost:8082/api/services/app";

// 站內沒有的主題：主題落地檢查應該全部擋下
const ZERO_TOPICS = [
  "寵物醫療補助",
  "寵物醫療",
  "電動車充電樁",
  "無人機檢定",
  "比特幣投資",
  "老任津貼", // 錯字直打後端；正常流程由前端修字後才查（見 README 已知取捨）
];

// 站內真實主題：筆數與第一名不能被調參動到
const REAL_TOPICS = [
  "假牙",
  "長照",
  "老人津貼",
  "育兒補助",
  "低收入戶",
  "身心障礙 輔具",
  "長照 洗澡",
  "新北市老人津貼",
  "醫療補助", // 純泛用詞查詢：落地檢查不得介入，維持原本的寬列表行為
];

async function runSuite() {
  const rows = [];
  for (const q of [...ZERO_TOPICS, ...REAL_TOPICS]) {
    const url = `${API}/FarePolicy/GetIFarePolicyList?Query=${encodeURIComponent(q)}&MaxResultCount=2000&SkipCount=0`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const json = await res.json();
      const items = json?.result?.result || [];
      rows.push({ q, count: items.length, top3: items.slice(0, 3).map((it) => it.title) });
    } catch (e) {
      rows.push({ q, count: "ERR", top3: [String(e?.message || e).slice(0, 60)] });
    }
  }
  return rows;
}

const rows = await runSuite();
const compareAt = process.argv.indexOf("--compare");

if (compareAt < 0) {
  console.log(JSON.stringify(rows, null, 1));
} else {
  const baselinePath = process.argv[compareAt + 1];
  if (!baselinePath) {
    console.error("用法：node search-suite.mjs --compare baseline.json");
    process.exit(2);
  }
  const { readFileSync } = await import("node:fs");
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  const baseByQuery = new Map(baseline.map((row) => [row.q, row]));

  let fails = 0;
  console.log("判定  查詢".padEnd(16), "| 基準 | 本次 | 說明");
  for (const row of rows) {
    const base = baseByQuery.get(row.q);
    let ok;
    let note;
    if (ZERO_TOPICS.includes(row.q)) {
      ok = row.count === 0;
      note = ok ? "站內沒有的主題，正確回 0" : "應為 0 筆";
    } else if (!base) {
      ok = false;
      note = "基準檔沒有這一題，重抓基準";
    } else {
      ok = row.count === base.count && (row.top3[0] || "") === (base.top3[0] || "");
      note = ok ? "筆數與第一名一致" : `基準第一名：${(base.top3[0] || "").slice(0, 24)}`;
    }
    if (!ok) fails++;
    console.log(
      (ok ? "  ✓ " : "✗✗✗ ") + row.q.padEnd(10),
      "|", String(base?.count ?? "—").padStart(4),
      "|", String(row.count).padStart(4),
      "|", note
    );
  }
  console.log(fails === 0 ? "\n全部符合預期" : `\n${fails} 項回歸，請先修再合`);
  process.exit(fails === 0 ? 0 : 1);
}
