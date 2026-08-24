/**
 * 只重跑兩個關鍵題，各 3 輪，確認是穩定行為還是單次噪音：
 *  A. docs：來源沒有應備文件清單時，模型會不會自己編一份出來（幻覺）
 *  B. scope：問到範圍外時，模型會不會用上 scopeHint 給的「台北市 68 筆」
 */
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const ROUNDS = 3;

const MODELS = [
  { provider: "groq", model: "openai/gpt-oss-120b" },
  { provider: "groq", model: "openai/gpt-oss-20b" },
  { provider: "gemini", model: "gemini-3.5-flash-lite" },
  { provider: "gemini", model: "gemini-3.1-flash-lite" },
];

const FOCUS_POLICY = {
  id: 898,
  title: "【桃園市】失能者長照輔具租賃補助",
  area: "桃園市",
  qualification:
    "年滿65歲以上老人、領有身心障礙證明(手冊)者或年滿55歲以上原住民及50歲以上失智症者，經桃園市政府衛生局照管中心評估，符合長照需要等級2級(含)以上者，具輔具使用及居家無障礙環境改善服務需求。",
  hasRecipient: true,
  hasIncome: false,
  hasIndentity: false,
};

const SEARCH_CASES = [
  FOCUS_POLICY,
  {
    id: 59,
    title: "【全國】照顧及專業服務",
    area: "全國",
    qualification: "長照中心評估長照需求等級第2(含)以上",
    hasRecipient: false,
    hasIncome: false,
    hasIndentity: false,
  },
  {
    id: 1258,
    title: "【桃園市】失能者長照輔具租賃補助",
    area: "桃園市",
    qualification: "年滿65歲以上老人、領有身心障礙證明(手冊)者，經本府衛生局照管中心評估，符合長照需要等級2級(含)以上者。",
    hasRecipient: false,
    hasIncome: false,
    hasIndentity: true,
  },
];

// 來源 evidence 只寫流程，完全沒有「應備文件清單」。憑空冒出這些詞就是編的。
const INVENTED_DOC_WORDS = [
  "身分證", "戶籍謄本", "印章", "存摺", "郵局", "銀行帳戶", "診斷證明",
  "評估報告", "評估表", "申請表", "需求說明", "照片", "切結書", "委託書",
];

function buildPayload(kind, model) {
  const base = { provider: model.provider, model: model.model, refresh: true };
  if (kind === "docs") {
    return {
      ...base,
      query: FOCUS_POLICY.title,
      cases: [FOCUS_POLICY],
      conversation: [{ role: "user", content: "申請要準備什麼文件？" }],
      focusPolicy: true,
    };
  }
  return {
    ...base,
    query: "長照",
    context: { query: "長照", policy: "長期照顧", area: "桃園市" },
    cases: SEARCH_CASES,
    conversation: [
      { role: "user", content: "長照" },
      { role: "assistant", content: "以下是桃園市長期照顧相關的補助整理。" },
      { role: "user", content: "那台北市有沒有類似的補助？" },
    ],
    scopeHint: { field: "area", label: "地區", value: "台北市", count: 68 },
  };
}

async function callStream(payload) {
  const res = await fetch(`${BASE}/api/llm/summarize/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.split("\n\n").filter((block) => /^event: done/mu.test(block));
  const dataLine = lines.at(-1)?.match(/^data: (.+)$/mu);
  return dataLine ? JSON.parse(dataLine[1]) : null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const rows = [];
  for (const kind of ["docs", "scope"]) {
    for (const model of MODELS) {
      for (let round = 1; round <= ROUNDS; round += 1) {
        const done = await callStream(buildPayload(kind, model));
        const summary = done?.summary || "";
        const verdict =
          kind === "docs"
            ? {
                // 編出來的文件名詞
                invented: INVENTED_DOC_WORDS.filter((word) => summary.includes(word)),
                // 有沒有誠實說「沒有列出」
                admits: /未載明|未具體列出|未列出|未提供|沒有列出|未說明|未詳述|未詳細/u.test(summary),
              }
            : {
                // 有沒有用上 scopeHint 的 68 筆
                usedScopeHint: summary.includes("68"),
                // 有沒有引導改地區
                guidesSwitch: /改成|調整|切換|換成|把地區/u.test(summary),
              };
        rows.push({ kind, model: model.model, round, chars: summary.replace(/\s/gu, "").length, ...verdict, summary });
        const flag =
          kind === "docs"
            ? `編造詞:${verdict.invented.length ? verdict.invented.join("/") : "無"} 誠實:${verdict.admits}`
            : `用上68筆:${verdict.usedScopeHint} 引導改地區:${verdict.guidesSwitch}`;
        console.log(`${kind} r${round} ${model.model.padEnd(24)} ${flag}`);
        await sleep(2000);
      }
    }
  }
  writeFileSync(new URL("./repeat.json", import.meta.url), JSON.stringify(rows, null, 2));

  console.log("\n===== 彙總（3 輪） =====");
  for (const kind of ["docs", "scope"]) {
    console.log(`\n[${kind}]`);
    for (const model of MODELS) {
      const subset = rows.filter((row) => row.kind === kind && row.model === model.model);
      if (kind === "docs") {
        const bad = subset.filter((row) => row.invented.length > 0).length;
        const honest = subset.filter((row) => row.admits).length;
        console.log(`  ${model.model.padEnd(24)} 編造文件 ${bad}/${ROUNDS} 輪，誠實標示 ${honest}/${ROUNDS} 輪`);
      } else {
        const used = subset.filter((row) => row.usedScopeHint).length;
        console.log(`  ${model.model.padEnd(24)} 用上 68 筆 ${used}/${ROUNDS} 輪`);
      }
    }
  }
}

main();
