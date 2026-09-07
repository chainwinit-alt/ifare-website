// 「主題落地檢查」的 JS 對照實作與案例驗收。
//
//   node gate-sim.mjs      # 抓全量政策當語料，跑底部 CASES，全過才 exit 0
//
// 這裡模擬的是 iFare_Frontend_API 的 FarePolicyTaskManager.HasGroundedSearchTopic：
// 查詢依空白／標點切段 → 每段依泛用詞切成具體片段 → 任一片段的每個相鄰二字組
// 都出現在政策庫全文即放行；全部片段都不落地才擋下。
//
// ⚠ 改 C# 規則（GenericSearchTerms、QuerySegmentSeparators、二字組鏈）時要同步這裡；
//   兩邊不一致以 C# 為準、以這裡的案例為驗收。語料組成須跟 C# 的 BuildSearchDocument
//   一致：title、qualification、政策類別、戶籍地、關鍵字／年齡／身分／經濟標籤。
const API = process.env.IFARE_API_BASE || "http://localhost:8082/api/services/app";

const res = await fetch(
  `${API}/FarePolicy/GetIFarePolicyList?MaxResultCount=2000&SkipCount=0`,
  { signal: AbortSignal.timeout(60000) }
);
const all = (await res.json())?.result?.result || [];
if (!all.length) {
  console.error("抓不到政策語料，確認政策 API 是否在跑（見 README 前置條件）");
  process.exit(2);
}

const codeNames = (v) => (v || []).map((x) => x?.codeName ?? "").join(" ");
// 對應 C# 的 TraditionalChineseFuzzyMatcher.Normalize ＋ FoldSearchText（臺→台）
const normalize = (s) =>
  String(s || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{Cc}]+/gu, "")
    .replace(/臺/g, "台");
const docs = all.map((p) =>
  normalize(
    [
      p.title, p.qualification, p.codePolicy_LabelName, p.codeDomicile_LabelName,
      codeNames(p.codeKeywordList), codeNames(p.codeRecipientList),
      codeNames(p.codeIdentityList), codeNames(p.codeIncomeList),
    ].join(" ")
  )
);

const corpusBigrams = new Set();
for (const d of docs) for (let i = 0; i + 1 < d.length; i++) corpusBigrams.add(d.slice(i, i + 2));

// 對應 C# 的 GenericSearchTerms
const GENERIC = ["補助", "津貼", "福利", "服務", "政策", "申請", "資格", "計畫", "方案", "資訊", "相關"];

function grounded(query) {
  const segments = String(query || "").split(/[\s,，、。．.;；:：/／|｜]+/u).filter(Boolean);
  let hasSpecific = false;
  for (const seg of segments) {
    let fragments = [normalize(seg)];
    for (const g of GENERIC) fragments = fragments.flatMap((r) => r.split(g));
    for (const fragment of fragments) {
      if (fragment.length < 2) continue;
      hasSpecific = true;
      let ok = true;
      for (let i = 0; i + 1 < fragment.length; i++) {
        if (!corpusBigrams.has(fragment.slice(i, i + 2))) { ok = false; break; }
      }
      if (ok) return { grounded: true, why: `片段「${fragment}」二字組鏈全存在` };
    }
  }
  return hasSpecific
    ? { grounded: false, why: "所有具體片段都含站內不存在的二字組" }
    : { grounded: true, why: "純泛用詞查詢，維持原行為" };
}

// [查詢, 期望放行?]。加新的邊界案例往這裡加。
const CASES = [
  // 站內沒有的主題：該擋
  ["寵物醫療補助", false], ["寵物醫療", false], ["電動車充電樁", false],
  ["無人機檢定", false], ["比特幣投資", false], ["老任津貼", false],
  // 混合查詢：有任一主題落地就放行
  ["寵物 長照", true],
  // 站內真實主題：該放行
  ["假牙", true], ["長照", true], ["老人津貼", true], ["育兒補助", true],
  ["低收入戶", true], ["身心障礙 輔具", true], ["長照 洗澡", true],
  ["新北市老人津貼", true], ["醫療補助", true], ["補助", true],
  ["老人福利中心", true], ["台中 假牙", true], ["原住民 假牙", true],
  ["孕婦 產檢", true], ["到宅沐浴", true], ["喘息服務", true],
  ["急難救助", true], ["租屋補助", true], ["失業給付", true],
  ["身心障礙者鑑定", true], ["敬老愛心卡", true], ["三節慰問金", true],
  ["假牙補助金額", true],
];

let fails = 0;
for (const [q, expect] of CASES) {
  const r = grounded(q);
  const ok = r.grounded === expect;
  if (!ok) fails++;
  console.log(ok ? "  ✓" : "✗✗✗", q.padEnd(10), "→", r.grounded ? "放行" : "擋下", "|", r.why);
}
console.log(fails === 0 ? `\n${CASES.length} 案例全部符合預期（語料 ${all.length} 筆）` : `\n${fails} 個不符合預期`);
process.exit(fails === 0 ? 0 : 1);
