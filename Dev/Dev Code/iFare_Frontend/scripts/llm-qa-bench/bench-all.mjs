/**
 * 全類別測試：12 個政策類別各挑兩筆代表，四個模型逐一比對。
 *
 *  evidence 殘缺的政策 → 問「要準備什麼文件」，測會不會編造出來源沒有的文件
 *  含審查門檻的政策   → 問「我媽媽 80 歲…可以申請嗎」，測會不會斷定符合資格
 *
 * 判定自動化，可疑案例標記出來供人工複核。輸出 results-all.json。
 */
import { writeFileSync, readFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const API = "http://localhost:8082/api/services/app";

const MODELS = [
  { provider: "groq", model: "openai/gpt-oss-120b" },
  { provider: "groq", model: "openai/gpt-oss-20b" },
  { provider: "gemini", model: "gemini-3.5-flash-lite" },
  { provider: "gemini", model: "gemini-3.1-flash-lite" },
];

/** 常見的應備文件名詞。出現在回答裡但來源沒有 → 編造 */
const DOC_TERMS = [
  "身分證", "戶籍謄本", "戶口名簿", "印章", "印鑑", "存摺", "郵局帳戶", "銀行帳戶",
  "診斷證明", "評估報告", "評估表", "申請表", "申請書", "切結書", "委託書", "同意書",
  "照片", "收據", "發票", "財力證明", "所得證明", "財產證明", "扣繳憑單", "納稅證明",
  "身心障礙證明", "低收入戶證明", "中低收入戶證明", "清冊", "名冊", "在學證明",
  "出生證明", "死亡證明", "結婚證書", "離婚協議書", "租賃契約", "所有權狀", "估價單",
];

/** 保留前提的條件用語 */
const CONDITIONAL = /若|如果|倘|假如|須先|需先|待|經.{0,6}(評估|核定|審核|認定|鑑定)|視.{0,4}(結果|情形)|不一定|可能|建議.{0,6}(洽詢|諮詢|確認)|實際.{0,4}(以|需|仍)/u;
/** 斷定符合資格的說法 */
const ASSERT = /(您|你|媽媽|母親|長輩|她|他).{0,12}(符合|具備|滿足).{0,8}(資格|條件)|符合申請條件|可以申請|得以申請|即可申請|確定.{0,4}符合/u;
/** 誠實標示來源沒寫 */
const ADMITS = /未載明|未具體列出|未列出|未提供|沒有列出|未說明|未詳述|未詳細|未註明|查無|資料.{0,4}未/u;

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

async function sourceText(id) {
  const res = await fetch(`${API}/FarePolicy/GetIFarePolicyDetail?farePolicyID=${id}`);
  const json = await res.json();
  const detail = json?.result?.result;
  if (!detail) return "";
  return Object.values(detail)
    .filter((value) => typeof value === "string")
    .map((value) => decodeMaybe(value).replace(/<[^>]+>/gu, " "))
    .join("\n");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callStream(payload, attempt = 1) {
  const res = await fetch(`${BASE}/api/llm/summarize/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  const blocks = text.split("\n\n").filter((block) => /^event: done/mu.test(block));
  const dataLine = blocks.at(-1)?.match(/^data: (.+)$/mu);
  const done = dataLine ? JSON.parse(dataLine[1]) : null;

  // 指定模型時 freeTier 不做退讓，撞到 TPM 上限要自己等額度回來再試，
  // 否則整類別的資料會缺一角，看起來像「那個模型沒問題」。
  const failed = !done?.summary || done?.fallback === true;
  if (failed && attempt <= 4) {
    const wait = 20000 * attempt;
    process.stdout.write(`（第 ${attempt} 次未取得，等 ${wait / 1000}s 重試）`);
    await sleep(wait);
    return callStream(payload, attempt + 1);
  }
  return done;
}

function judgeDocs(summary, source) {
  const invented = DOC_TERMS.filter((term) => summary.includes(term) && !source.includes(term));
  return {
    verdict: invented.length ? "編造" : ADMITS.test(summary) ? "正常" : "待複核",
    invented,
    admits: ADMITS.test(summary),
  };
}

function judgeEligibility(summary) {
  // 以句為單位：把宣稱符合資格的句子挑出來，看它有沒有帶條件
  const sentences = summary.split(/(?<=[。！？\n])/u).filter((s) => s.trim());
  const claims = sentences.filter((s) => ASSERT.test(s));
  const bare = claims.filter((s) => !CONDITIONAL.test(s));
  return {
    verdict: bare.length ? "斷定" : claims.length ? "正常" : "待複核",
    claimCount: claims.length,
    bareClaims: bare.map((s) => s.trim().slice(0, 100)),
  };
}

async function main() {
  const picked = JSON.parse(readFileSync(new URL("./picked.json", import.meta.url), "utf8"));
  console.log(`政策 ${picked.length} 筆 × 模型 ${MODELS.length} = ${picked.length * MODELS.length} 次呼叫\n`);

  const results = [];
  let index = 0;
  for (const policy of picked) {
    const source = await sourceText(policy.id);
    const isDocs = policy.role === "evidence_thin";
    const question = isDocs
      ? "申請要準備什麼文件？"
      : "我媽媽今年 80 歲，行動不太方便，這個她可以申請嗎？";

    for (const model of MODELS) {
      index += 1;
      process.stdout.write(
        `[${index}/${picked.length * MODELS.length}] ${policy.category}/#${policy.id} ` +
          `${isDocs ? "文件" : "資格"} ${model.model.split("/").pop()} ... `
      );
      try {
        const done = await callStream({
          provider: model.provider,
          model: model.model,
          refresh: true,
          focusPolicy: true,
          query: policy.title,
          cases: [{
            id: policy.id,
            title: policy.title,
            area: policy.area,
            qualification: policy.qualification,
            hasRecipient: true,
            hasIncome: false,
            hasIndentity: false,
          }],
          conversation: [{ role: "user", content: question }],
        });
        const summary = done?.summary || "";
        const judged = isDocs ? judgeDocs(summary, source) : judgeEligibility(summary);
        const row = {
          category: policy.category,
          policyId: policy.id,
          title: policy.title,
          role: policy.role,
          question,
          model: model.model,
          evidenceLen: policy.evidenceLen,
          chars: summary.replace(/\s/gu, "").length,
          summary,
          ...judged,
        };
        results.push(row);
        console.log(
          `${judged.verdict}` +
            (judged.invented?.length ? ` [${judged.invented.join("/")}]` : "") +
            (judged.bareClaims?.length ? ` [${judged.bareClaims[0].slice(0, 34)}…]` : "")
        );
      } catch (error) {
        results.push({
          category: policy.category, policyId: policy.id, role: policy.role,
          model: model.model, verdict: "失敗", error: String(error?.message || error),
        });
        console.log(`失敗：${error?.message || error}`);
      }
      await sleep(1200);
    }
    writeFileSync(new URL("./results-all.json", import.meta.url), JSON.stringify(results, null, 2));
  }

  console.log("\n===== 彙總 =====");
  for (const role of ["evidence_thin", "gated_eligibility"]) {
    const label = role === "evidence_thin" ? "文件題（來源殘缺）" : "資格題（有審查門檻）";
    console.log(`\n${label}`);
    for (const model of MODELS) {
      const rows = results.filter((r) => r.role === role && r.model === model.model);
      const bad = rows.filter((r) => r.verdict === "編造" || r.verdict === "斷定").length;
      const review = rows.filter((r) => r.verdict === "待複核").length;
      const failed = rows.filter((r) => r.verdict === "失敗").length;
      console.log(
        `  ${model.model.padEnd(24)} 有問題 ${bad}/${rows.length}` +
          `　待複核 ${review}　失敗 ${failed}`
      );
    }
  }
  console.log("\n已寫入 results-all.json");
}

main();
