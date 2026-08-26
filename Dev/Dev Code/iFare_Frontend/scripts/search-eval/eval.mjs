// 搜尋品質評估：用一組固定的使用者問法打政策 API，把「找得好不好」換算成數字。
//
//   node eval.mjs                        跑 cases.json，印總表與總分
//   node eval.mjs --json after.json      同時把結果存檔（給 compare.mjs 對照用）
//   node eval.mjs --cases my-cases.json  換一份評估集
//   node eval.mjs --max-fail 12          容許 N 題失敗才算過（棘輪用，預設 0）
//
// 與 scripts/search-relevance 的分工：那邊證明「沒退化」（筆數與第一名不變），
// 這邊證明「有變好」（正確答案有沒有被撈到、排在多前面）。詳見 README。
//
// ⚠ 目前 cases.json 的 expectPolicyIds 全是空的，分數走的是關鍵字命中率這條
//   過渡期粗略判準。人工標註完 id 之後，recall@10 與 MRR 才是真正的指標。
import { readFileSync, writeFileSync } from "node:fs";

const API = process.env.IFARE_API_BASE || "http://localhost:8082/api/services/app";
// 走完整流程時要打 Nuxt 的意圖端點（站上就是先經過它再查政策 API）
const NUXT = process.env.IFARE_NUXT_BASE || "http://localhost:3000";
const RAW_MODE = process.argv.includes("--raw");
const TOP_K = 10;

/**
 * 處境用語 → 站內政策用語（utils/ifareIntent.ts 的 SITUATION_VOCABULARY 最小複本）。
 *
 * 為什麼複製而不 import：那個檔在 Nuxt 應用內、依賴 Nuxt 的模組解析，
 * 獨立腳本 import 會把整包相依拉進來。這份只取「擴充搜尋詞」需要的對照，
 * 不含條件抽取那些邏輯。
 *
 * ⚠ 改了 utils/ifareIntent.ts 的 SITUATION_VOCABULARY 記得同步這裡，
 *   否則評估分數會與站上實際行為脫節（低估）。
 */
const SITUATION_VOCABULARY = [
  [/長照|長期照顧/u, "長照 長期照顧"],
  [/早療|早期療育/u, "早療 早期療育"],
  [/腦中風|中風|癱瘓|半身不遂|臥床|插鼻胃管|無法自理|不能自理|生活不能自理|沒辦法自己(?:吃飯|洗澡|穿衣|上廁所|走路)|需要人(?:照顧|看護)|行動不便/u, "失能 長期照顧 無法自理"],
  [/失智|阿茲海默|老年痴呆|記憶力(?:變差|退化|越來越差|不好)|忘東忘西|認知退化/u, "失智 長期照顧"],
  [/跌倒|摔倒|跌傷|滑倒|防跌|居家安全|浴室很滑|怕再跌|站不穩/u, "無障礙 修繕 輔具"],
  [/失業|被裁員|遭資遣|丟了工作|沒有工作|待業|找不到工作/u, "失業 非自願離職"],
  [/沒(?:有)?薪水|沒領(?:到)?薪水|領不到薪水|被欠薪|欠薪|積欠(?:薪資|工資)|薪水沒(?:發|著落)|發不出薪水|好幾個月沒(?:領到?錢|發薪)/u, "失業 急難 生活扶助"],
  [/保溫箱|巴掌仙子|早產兒/u, "早產"],
  [/慢半拍|發展比較慢|說話(?:比較)?慢|不太會說話|遲緩/u, "發展遲緩 早期療育"],
  [/懷孕|坐月子|生小孩|生產|待產|新生兒/u, "生育"],
  [/(?:繳|付)不(?:出|起)(?:房租|租金)|(?:房租|租金)[^\s，,。；;、]{0,3}?(?:繳|付)不(?:出|起)|租不起|沒地方住|(?:房租|租金)太(?:貴|高)/u, "租金 住宅"],
  [/學費|學雜費|註冊費|補習費|書籍費|念不起(?:書|大學)|讀不起(?:書|大學)|上不起學/u, "就學 教育 助學"],
  [/缺錢|沒錢|沒有錢|快沒錢|手頭(?:很|有點)?緊|經濟(?:困難|壓力|拮据|吃緊)|生活(?:過不下去|困難|陷入困境|有困難)|撐不下去|快活不下去|入不敷出|家裡沒(?:收入|錢)|沒(?:有)?收入|付不出(?:醫藥費|錢)?|繳不出/u, "急難 生活扶助"],
  [/獨居|沒人照顧|一個人住/u, "獨居"],
  [/往生|過世|辦後事|喪事/u, "喪葬"],
];

/**
 * 站內認得的福利概念詞（result.vue 的 policySearchConceptPattern 複本）。
 * 用途：從連續中文長句抽出主題詞當兜底查詢路徑。
 * ⚠ 那邊改了記得同步這裡。
 */
const CONCEPT_PATTERN =
  /長期照顧|長照|照顧者|照顧|生育|懷孕|孕婦|新生兒|育兒|托育|身心障礙|智能障礙|身障|老人|長者|高齡|兒少|兒童|青少年|低收入|中低收入|經濟弱勢|原住民|新住民|醫療|教育|就學|學費|租屋|住宅|失業|就業|急難|喪葬|交通|輔具|看護|居家|喘息|假牙|補助|津貼/gu;

// 對應 result.vue 的 GENERIC_CONCEPT_TERMS，改那邊記得同步這裡
const GENERIC_CONCEPT_TERMS = new Set([
  "補助", "津貼", "醫療", "教育", "交通", "居家", "照顧", "就業", "住宅",
]);

function extractConceptTerms(text) {
  const source = String(text || "");
  const terms = new Set();
  for (const m of source.matchAll(CONCEPT_PATTERN)) {
    const term = String(m[0] || "").trim();
    // 排除過度通用的詞（對應 result.vue 的 GENERIC_CONCEPT_TERMS）：
    // 單獨查「醫療」等於沒篩，還會繞過後端的主題落地守門——
    // 「寵物醫療補助」站內本來正確回 0，抽出「醫療」單獨查就撈回幾百筆弱相關。
    if (term.length >= 2 && !GENERIC_CONCEPT_TERMS.has(term)) terms.add(term);
  }
  terms.delete(source.trim());
  return [...terms];
}

function expandSituation(text) {
  const source = String(text || "");
  const additions = [];
  for (const [pattern, siteTerms] of SITUATION_VOCABULARY) {
    if (!pattern.test(source)) continue;
    for (const term of siteTerms.split(" ")) {
      if (term && !source.includes(term) && !additions.includes(term)) additions.push(term);
    }
  }
  return additions.length ? `${source} ${additions.join(" ")}` : source;
}

const argAt = (flag) => {
  const i = process.argv.indexOf(flag);
  return i < 0 ? null : process.argv[i + 1] ?? null;
};
const casesPath = argAt("--cases") || new URL("./cases.json", import.meta.url);
const jsonOut = argAt("--json");
const maxFail = Number(argAt("--max-fail") ?? 0) || 0;

// 對照 C# 的 TraditionalChineseFuzzyMatcher.Normalize ＋ FoldSearchText（臺→台）
const normalize = (s) =>
  String(s || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{Cc}]+/gu, "")
    .replace(/臺/g, "台");

// CJK 佔兩格，讓總表對得齊
const width = (s) => [...String(s)].reduce((w, c) => w + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/.test(c) ? 2 : 1), 0);
const pad = (s, n) => String(s) + " ".repeat(Math.max(0, n - width(s)));
const pct = (x) => `${(x * 100).toFixed(0)}%`;

function kindOf(c) {
  if (c.expectZero) return "zero";
  if ((c.expectPolicyIds || []).length) return "labeled";
  return "keyword";
}

async function queryBackend(query) {
  const url = `${API}/FarePolicy/GetIFarePolicyList?Query=${encodeURIComponent(query)}&MaxResultCount=2000&SkipCount=0`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json())?.result?.result || [];
}

/**
 * 走「使用者實際經歷的流程」，而不是直接把原句丟給後端。
 *
 * 這個差別很大，不修正的話數字會嚴重誤導：實測「老任津貼」直打後端 0 筆、
 * 經 AI 意圖判讀（修成「老人津貼」）後 376 筆；「我媽媽80歲想裝假牙」也是 0 → 38。
 * 站上真正的搜尋是多路查詢再合併——原始字一路、AI 核心詞一路、處境擴充詞一路——
 * 只量其中一路，等於在評估一個使用者根本不會遇到的系統。
 *
 * 這裡以「多路查詢後取聯集」近似 result.vue 的行為。它不複製前端的加權融合排序，
 * 所以名次不會與畫面完全一致；但「該撈到的有沒有撈到」（recall）是準的，
 * 而那正是這套評估集要回答的問題。名次相關的判準（MRR）請理解為近似值。
 *
 * 加 --raw 可跳過這一層，只量後端原始能力（做後端調參時比較乾淨）。
 */
async function search(query) {
  if (RAW_MODE) return queryBackend(query);

  const paths = [query];

  // 第一路：AI 意圖判讀（修錯字、整句抽核心詞）。失敗就跳過，不要讓評估掛掉——
  // 沒有金鑰或 LLM 全掛時，站上本來也是退回原始字那一路。
  try {
    const res = await fetch(`${NUXT}/api/llm/search-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(45000),
    });
    if (res.ok) {
      const intent = await res.json();
      if (intent?.searchQuery) paths.push(intent.searchQuery);
      // 召回概念詞（v.1.7.19）：AI 給的站內福利用語，站上也會拿去查一路
      if (Array.isArray(intent?.recallConcepts) && intent.recallConcepts.length) {
        paths.push(intent.recallConcepts.join(" "));
      }
    }
  } catch {
    // 靜默略過：這一路失敗不代表評估失敗
  }

  // 概念詞兜底：從原句抽出站內認得的福利概念詞各查一路（對應 result.vue 的
  // conceptFallbackPlans）。意圖 LLM 的輸出會浮動——同一句「我媽媽80歲想裝假牙」
  // 可能回乾淨的「假牙」也可能回「媽媽80歲假牙」（後者查無），這一路是那時候的救命索。
  for (const term of extractConceptTerms(query)) paths.push(term);

  // 第二路：處境對照擴充（缺錢→急難 生活扶助、忘東忘西→失智 長期照顧…）。
  // 這層在前端 utils/ifareIntent.ts，直接 import 會把 Nuxt 的相依一起拉進來，
  // 所以走 nuxt server 的意圖端點拿不到——這裡改用同一份對照表的最小複本。
  const expanded = expandSituation(query);
  if (expanded && expanded !== query) paths.push(expanded);

  const merged = new Map();
  for (const path of [...new Set(paths)].filter(Boolean)) {
    try {
      for (const item of await queryBackend(path)) {
        if (!merged.has(item.id)) merged.set(item.id, item);
      }
    } catch {
      // 單一路失敗不影響其他路
    }
  }
  return [...merged.values()];
}

function scoreCase(c, items) {
  const kind = kindOf(c);
  const count = items.length;
  const top = items.slice(0, TOP_K).map((it) => ({ id: it.id, title: it.title }));
  const row = {
    query: c.query, kind, note: c.note || "", count,
    top: top.map((t) => `[${t.id}] ${t.title}`),
  };

  if (kind === "zero") {
    row.pass = count === 0;
    row.score = row.pass ? 1 : 0;
    row.metric = row.pass ? "0 筆" : `${count} 筆`;
    row.why = row.pass ? "站內沒有的主題，正確回 0" : "應為 0 筆，卻撈回弱相關";
    return row;
  }

  if (kind === "labeled") {
    const want = new Set(c.expectPolicyIds);
    const hit = top.filter((t) => want.has(t.id));
    const rank = items.findIndex((it) => want.has(it.id)) + 1; // 0 = 沒找到
    row.recall10 = hit.length / want.size;
    row.mrr = rank ? 1 / rank : 0;
    row.firstHitRank = rank || null;
    row.pass = row.recall10 > 0;
    row.score = row.recall10;
    row.metric = `R@10 ${pct(row.recall10)} / MRR ${row.mrr.toFixed(2)}`;
    row.why = rank
      ? `${want.size} 個正確答案命中 ${hit.length} 個，最前面排第 ${rank}`
      : `${count} 筆結果裡沒有任何一個正確答案`;
    return row;
  }

  // keyword：過渡期判準——前 10 筆標題有幾筆含任一關鍵字
  const keys = (c.expectKeywords || []).map(normalize).filter(Boolean);
  const isHit = (t) => keys.some((k) => normalize(t.title).includes(k));
  const hits = top.filter(isHit).length;
  const denom = Math.min(TOP_K, count) || 0;
  const rank = items.findIndex(isHit) + 1;
  row.keywordHits = hits;
  row.keywordRate = denom ? hits / denom : 0;
  row.firstHitRank = rank || null;
  row.pass = count > 0 && hits > 0;
  row.score = row.keywordRate;
  row.metric = count ? `前${denom} 命中 ${hits}（${pct(row.keywordRate)}）` : "0 筆";
  row.why = count === 0
    ? "查無結果，使用者會直接撞到查無資料"
    : hits === 0
      ? `${count} 筆結果前 ${denom} 名都沒有預期關鍵字`
      : `第一個命中排第 ${rank}`;
  return row;
}

const cases = JSON.parse(readFileSync(casesPath, "utf8"));
const rows = [];
for (const c of cases) {
  try {
    rows.push(scoreCase(c, await search(c.query)));
  } catch (e) {
    rows.push({
      query: c.query, kind: kindOf(c), note: c.note || "", count: "ERR",
      pass: false, score: 0, metric: "ERR", why: String(e?.message || e).slice(0, 60), top: [],
    });
  }
}

const qW = Math.max(...rows.map((r) => width(r.query)), 8);
const groups = { zero: "站內沒有", labeled: "已標註", keyword: "僅關鍵字" };

console.log(`評估集 ${cases.length} 題　API ${API}\n`);
console.log(`判定  ${pad("查詢", qW)}  ${pad("類型", 10)} ${"筆數".padStart(6)}  ${pad("指標", 22)} 說明`);
console.log("-".repeat(qW + 78));
for (const r of rows) {
  console.log(
    (r.pass ? "  ✓ " : "✗✗✗ ") + ` ${pad(r.query, qW)}  ${pad(groups[r.kind], 10)} ${String(r.count).padStart(6)}  ${pad(r.metric, 22)} ${r.why}`
  );
}

const failed = rows.filter((r) => !r.pass);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const of = (k) => rows.filter((r) => r.kind === k);
const summary = {
  total: rows.length,
  passed: rows.length - failed.length,
  failed: failed.length,
  score: mean(rows.map((r) => r.score)),
  zero: { total: of("zero").length, passed: of("zero").filter((r) => r.pass).length },
  labeled: {
    total: of("labeled").length,
    passed: of("labeled").filter((r) => r.pass).length,
    recall10: mean(of("labeled").map((r) => r.recall10 ?? 0)),
    mrr: mean(of("labeled").map((r) => r.mrr ?? 0)),
  },
  keyword: {
    total: of("keyword").length,
    passed: of("keyword").filter((r) => r.pass).length,
    withResults: of("keyword").filter((r) => Number(r.count) > 0).length,
    hitRate: mean(of("keyword").map((r) => r.keywordRate ?? 0)),
  },
};

console.log(`\n總分 ${pct(summary.score)}　通過 ${summary.passed}/${summary.total}`);
console.log(`  站內沒有的主題　正確回 0：${summary.zero.passed}/${summary.zero.total}`);
console.log(`  已標註 id　　　 通過 ${summary.labeled.passed}/${summary.labeled.total}　recall@10 ${pct(summary.labeled.recall10)}　MRR ${summary.labeled.mrr.toFixed(2)}`);
console.log(`  僅關鍵字　　　　通過 ${summary.keyword.passed}/${summary.keyword.total}　有結果 ${summary.keyword.withResults}/${summary.keyword.total}　命中率 ${pct(summary.keyword.hitRate)}`);
if (!summary.labeled.total) {
  console.log("\n⚠ 沒有任何一題填了 expectPolicyIds，recall@10 與 MRR 都是空的。");
  console.log("  現在的分數只是關鍵字命中率的粗估，人工標註後才算數（見 README）。");
}

if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify({
    generatedAt: new Date().toISOString(), api: API, topK: TOP_K, summary, rows,
  }, null, 1));
  console.log(`\n已存檔 ${jsonOut}（下次改動後跑 compare.mjs 對照）`);
}

if (failed.length) {
  console.log(`\n${failed.length} 題未通過：${failed.map((r) => r.query).join("、")}`);
  if (failed.length <= maxFail) console.log(`（--max-fail ${maxFail}，仍視為通過）`);
}
process.exit(failed.length <= maxFail ? 0 : 1);
