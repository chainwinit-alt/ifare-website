/**
 * 重新判定 results-all.json，不重打模型（原始輸出都存著）。
 *
 * 修過兩輪，第二輪修掉的是會反轉結論的 bug：
 *
 *  bug 1（第一輪修）：疑問句式與「建議洽詢」被當成斷定。
 *  bug 2（第二輪修）：正則 (您|媽媽).{0,12}(符合) 會匹配到「不符合」裡的「符合」，
 *    於是「您的 80 歲母親不符合申請資格」——一句正確的拒絕——被判成「斷定」。
 *    這對傾向給明確答案的模型（120b）殺傷最大，不修會得出相反結論。
 *  bug 3（第二輪修）：列點描述政策條件的句子（「年滿65歲…即可申請」）沒有指涉
 *    使用者，不是對他本人的斷定，卻被抓進來。改成必須出現指涉詞才算宣稱。
 *
 * 另外把編造檢查擴到所有題目：資格題的回答若冒出來源沒有的文件名詞
 *（實際發現 #881 有「需提交申請表與個人戶籍謄本」），一樣是給錯資訊。
 */
import { readFileSync, writeFileSync } from "node:fs";

const DOC_TERMS = [
  "身分證", "戶籍謄本", "戶口名簿", "印章", "印鑑", "存摺", "郵局帳戶", "銀行帳戶",
  "診斷證明", "評估報告", "評估表", "申請表", "申請書", "切結書", "委託書", "同意書",
  "照片", "收據", "發票", "財力證明", "所得證明", "財產證明", "扣繳憑單", "納稅證明",
  "身心障礙證明", "低收入戶證明", "中低收入戶證明", "清冊", "名冊", "在學證明",
  "出生證明", "死亡證明", "結婚證書", "離婚協議書", "租賃契約", "所有權狀", "估價單",
];

const ADMITS = /未載明|未具體列出|未列出|未提供|沒有列出|未說明|未詳述|未詳細|未註明|查無|資料.{0,4}未/u;

/** 指涉使用者本人——沒有這個就只是在描述政策，不是對他斷定 */
const SUBJECT = /您|你|媽媽|母親|長輩|家人/u;
/** 肯定符合資格的說法 */
const CLAIM = /符合|具備|滿足|可以申請|得以申請|即可申請|可申請|符合資格|符合條件/u;
/** 否定：正確拒絕，不是斷定 */
const NEGATED = /不符合|未符合|不適用|不具備|不滿足|無法|不能|並非|不在|不屬|沒有符合|不予|排除/u;
/** 疑問句式：在問，不是在宣稱 */
const INTERROGATIVE = /是否符合|符不符合|能否|能不能|可不可以|是否可以|是否具備|有沒有符合|是否屬於|是否適用/u;
/** 保留前提 */
const CONDITIONAL = /若|如果|倘|假如|只要|凡|一旦|前提|須先|需先|待|經.{0,6}(評估|核定|審核|認定|鑑定)|視.{0,4}(結果|情形)|不一定|可能|建議.{0,10}(洽詢|諮詢|確認|聯繫|詢問|評估)|請洽|逕洽|以.{0,8}審核結果為準|由.{0,10}(承辦|單位|中心|公所|機關).{0,8}(確認|認定|評估|審核)|實際.{0,4}(以|需|仍)|仍需|仍須|尚需|還需|初步|其他.{0,4}(申請)?條件/u;

/**
 * 比對前先把異體字拉平。實測 #1141 的來源寫「身份證」、模型寫「身分證」，
 * 語意相同卻被判成憑空生出來——這種誤判會憑空製造出「編造」的證據。
 */
function normalizeVariants(text) {
  return String(text || "")
    .replace(/份/gu, "分")
    .replace(/証/gu, "證")
    .replace(/臺/gu, "台")
    .replace(/薄/gu, "簿");
}

function inventedDocs(summary, source) {
  const s = normalizeVariants(summary);
  const src = normalizeVariants(source);
  return DOC_TERMS.filter((term) => {
    const t = normalizeVariants(term);
    return s.includes(t) && !src.includes(t);
  });
}

function judgeDocs(summary, source) {
  const invented = inventedDocs(summary, source);
  return {
    verdict: invented.length ? "編造" : ADMITS.test(summary) ? "正常" : "待複核",
    invented,
  };
}

function judgeEligibility(summary, source) {
  // 編造也要查：資格題的回答一樣會冒出來源沒有的文件
  const invented = inventedDocs(summary, source);
  if (invented.length) return { verdict: "編造", invented, bareClaims: [] };

  const sentences = summary.split(/(?<=[。！？\n])/u).filter((s) => s.trim());
  const bare = [];
  let claimed = false;

  sentences.forEach((sentence, i) => {
    if (!SUBJECT.test(sentence)) return;        // 只在描述政策，不是對使用者斷定
    if (!CLAIM.test(sentence)) return;
    if (NEGATED.test(sentence)) return;         // 正確拒絕
    if (INTERROGATIVE.test(sentence)) return;   // 在問
    claimed = true;
    if (CONDITIONAL.test(sentence)) return;     // 同句已帶條件
    const before = sentences.slice(Math.max(0, i - 1), i).join("");
    if (CONDITIONAL.test(before)) return;       // 前一句已交代前提
    bare.push(sentence.trim());
  });

  return {
    verdict: bare.length ? "斷定" : claimed ? "正常" : "待複核",
    invented: [],
    bareClaims: bare.map((s) => s.slice(0, 140)),
  };
}

const rows = JSON.parse(readFileSync(new URL("./results-all.json", import.meta.url), "utf8"));
const sources = JSON.parse(readFileSync(new URL("./sources.json", import.meta.url), "utf8"));

const changed = [];
for (const row of rows) {
  if (row.verdict === "失敗" || !row.summary) continue;
  const before = row.verdict;
  const source = sources[row.policyId] || "";
  const judged = row.role === "evidence_thin"
    ? judgeDocs(row.summary, source)
    : judgeEligibility(row.summary, source);
  Object.assign(row, judged);
  if (before !== row.verdict) {
    changed.push(`#${row.policyId} ${row.model.split("/").pop().padEnd(22)} ${before} → ${row.verdict}`);
  }
}

writeFileSync(new URL("./results-all.json", import.meta.url), JSON.stringify(rows, null, 2));

console.log(`重判 ${rows.length} 筆，判定變更 ${changed.length} 筆`);
changed.forEach((line) => console.log("  " + line));

const MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b",
                "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
for (const role of ["evidence_thin", "gated_eligibility"]) {
  console.log(`\n${role === "evidence_thin" ? "文件題（來源殘缺）" : "資格題（有審查門檻）"}`);
  for (const model of MODELS) {
    const subset = rows.filter((r) => r.role === role && r.model === model);
    const fab = subset.filter((r) => r.verdict === "編造").length;
    const ass = subset.filter((r) => r.verdict === "斷定").length;
    const review = subset.filter((r) => r.verdict === "待複核").length;
    console.log(
      `  ${model.padEnd(24)} 編造 ${fab}　斷定 ${ass}　待複核 ${review}　共 ${subset.length}`
    );
  }
}
