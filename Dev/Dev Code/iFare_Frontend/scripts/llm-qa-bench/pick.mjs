/**
 * 從 12 個政策類別中，各挑出兩筆測試代表：
 *  A. evidence（應備文件／申請證明）殘缺 → 用來測「來源沒寫時會不會編造」
 *  B. qualification 含「評估／核定／審核」門檻 → 用來測「會不會斷定民眾符合資格」
 * 輸出 picked.json 供 bench-all.mjs 使用。
 */
import { writeFileSync, readFileSync } from "node:fs";

const API = "http://localhost:8082/api/services/app";
const PER_CATEGORY = 24; // 每類別抽樣筆數

function decodeMaybe(value) {
  const text = String(value || "");
  const escapes = text.match(/%[0-9A-Fa-f]{2}/gu);
  if (!escapes || escapes.length * 3 < text.length * 0.3) return text;
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function clean(value) {
  return decodeMaybe(value).replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim();
}

async function detail(id) {
  try {
    const res = await fetch(`${API}/FarePolicy/GetIFarePolicyDetail?farePolicyID=${id}`);
    const json = await res.json();
    return json?.result?.result || null;
  } catch {
    return null;
  }
}

/** 需要通過審查／評估才能確定資格的門檻用語 */
const GATED = /評估|核定|審核|認定|鑑定|複審|審查/u;

async function main() {
  const raw = JSON.parse(readFileSync(new URL("./all.json", import.meta.url), "utf8"));
  const items = raw.result?.result?.items || raw.result?.items || raw.result?.result || raw.result;
  const all = Array.isArray(items) ? items : [];

  const byCategory = new Map();
  for (const policy of all) {
    const key = policy.codePolicy_LabelName || "(無)";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(policy);
  }

  const picked = [];
  for (const [category, list] of byCategory) {
    const sample = list.slice(0, PER_CATEGORY);
    const enriched = [];
    for (const policy of sample) {
      const d = await detail(policy.id);
      if (!d) continue;
      enriched.push({
        id: policy.id,
        title: policy.title,
        category,
        area: policy.codeDomicile_LabelName || "",
        qualification: clean(d.qualification) || clean(policy.qualification),
        evidenceLen: clean(d.evidence).length,
        welfareLen: clean(d.welfareInfo).length,
        hasOffice: Boolean(clean(d.officeUnitInfo)),
      });
    }
    if (!enriched.length) {
      console.log(`${category}：抽樣皆取不到明細，略過`);
      continue;
    }

    // A：evidence 最短（含 0）但福利內容有寫的——問文件時最容易被編出來
    const thin = enriched
      .filter((p) => p.welfareLen > 40)
      .sort((a, b) => a.evidenceLen - b.evidenceLen)[0];
    // B：資格條件含審查門檻、且敘述夠長的
    const gated = enriched
      .filter((p) => GATED.test(p.qualification) && p.qualification.length > 30)
      .sort((a, b) => b.qualification.length - a.qualification.length)[0];

    if (thin) picked.push({ ...thin, role: "evidence_thin" });
    if (gated && gated.id !== thin?.id) picked.push({ ...gated, role: "gated_eligibility" });

    console.log(
      `${category.padEnd(8)} 抽樣 ${enriched.length} 筆｜` +
        `殘缺代表 #${thin?.id ?? "-"}(evidence ${thin?.evidenceLen ?? "-"} 字)｜` +
        `門檻代表 #${gated?.id ?? "-"}`
    );
  }

  writeFileSync(new URL("./picked.json", import.meta.url), JSON.stringify(picked, null, 2));
  const thinCount = picked.filter((p) => p.role === "evidence_thin").length;
  const gatedCount = picked.filter((p) => p.role === "gated_eligibility").length;
  console.log(`\n已挑出 ${picked.length} 筆（殘缺 ${thinCount}、門檻 ${gatedCount}）→ picked.json`);
  console.log(`evidence 完全空白的：${picked.filter((p) => p.evidenceLen === 0).length} 筆`);
}

main();
