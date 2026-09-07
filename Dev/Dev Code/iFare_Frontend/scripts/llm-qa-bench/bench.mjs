/**
 * AI 摘要「問答」模型比較。
 * 打本機 dev server 的 /api/llm/summarize/stream，指定 provider/model 不做退讓，
 * 對同一組情境逐一比較。跑法：node bench.mjs
 */
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const API = "http://localhost:8082/api/services/app";

const MODELS = [
  { provider: "groq", model: "openai/gpt-oss-120b", label: "120b（現行第一順位）" },
  { provider: "groq", model: "openai/gpt-oss-20b", label: "20b（第二順位）" },
  { provider: "gemini", model: "gemini-3.5-flash-lite", label: "G3.5-lite（第三）" },
  { provider: "gemini", model: "gemini-3.1-flash-lite", label: "G3.1-lite（第四）" },
];

// 明細頁「問這筆政策」用的單筆政策，以及搜尋追問用的三筆
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
    qualification:
      "年滿65歲以上老人、領有身心障礙證明(手冊)者或年滿55歲以上原住民及50歲以上失智症者，經本府衛生局照管中心評估，符合長照需要等級2級(含)以上者，具輔具使用及居家無障礙環境改善服務需求。",
    hasRecipient: false,
    hasIncome: false,
    hasIndentity: true,
  },
];

const SEARCH_CONTEXT = { query: "長照", policy: "長期照顧", area: "桃園市" };

// 情境：前四個走明細頁「問這筆政策」（focusPolicy），後兩個走搜尋摘要卡追問
const SCENARIOS = [
  {
    key: "docs",
    name: "要準備什麼文件",
    route: "focus",
    question: "申請要準備什麼文件？",
    expect: "應照 evidence 欄位列出應備文件，沒寫的不能自己編",
  },
  {
    key: "money",
    name: "補助多少錢",
    route: "focus",
    question: "這個補助可以領多少錢？",
    expect: "應照 welfareInfo 給金額或額度；來源沒金額就要說沒載明",
  },
  {
    key: "where",
    name: "去哪裡申請",
    route: "focus",
    question: "要去哪裡申請？可以打電話問嗎？",
    expect: "應給承辦單位／電話；來源沒有就不能捏造號碼",
  },
  {
    key: "eligible",
    name: "資格判斷（推理）",
    route: "focus",
    question: "我媽媽今年 80 歲，中風後行動不便，這個她可以申請嗎？",
    expect: "須依 qualification 判斷並點出「長照需要等級2級以上」這個前提，不能直接說可以",
  },
  {
    key: "compare",
    name: "多筆比較",
    route: "search",
    question: "這幾個有什麼不一樣？我該申請哪一個？",
    expect: "須分辨三筆的差異並給選擇建議，不能只重列一次清單",
  },
  {
    key: "scope",
    name: "問到範圍外（帶 scopeHint）",
    route: "search",
    question: "那台北市有沒有類似的補助？",
    scopeHint: { field: "area", label: "地區", value: "台北市", count: 68 },
    expect: "應說出本站台北市有 68 筆，並引導改地區；不能假裝知道台北市的政策內容",
  },
  {
    key: "guidance",
    name: "只補條件（guidance 模式）",
    route: "search",
    question: "高雄",
    expect: "非問句，應走 guidance：一句話引導，不該長篇大論",
  },
];

function buildPayload(scenario, model) {
  const base = {
    provider: model.provider,
    model: model.model,
    refresh: true,
  };
  if (scenario.route === "focus") {
    return {
      ...base,
      query: FOCUS_POLICY.title,
      cases: [FOCUS_POLICY],
      conversation: [{ role: "user", content: scenario.question }],
      focusPolicy: true,
    };
  }
  return {
    ...base,
    query: "長照",
    context: SEARCH_CONTEXT,
    cases: SEARCH_CASES,
    conversation: [
      { role: "user", content: "長照" },
      { role: "assistant", content: "以下是桃園市長期照顧相關的補助整理。" },
      { role: "user", content: scenario.question },
    ],
    ...(scenario.scopeHint ? { scopeHint: scenario.scopeHint } : {}),
  };
}

async function callStream(payload) {
  const startedAt = Date.now();
  const res = await fetch(`${BASE}/api/llm/summarize/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = null;
  let meta = null;
  let firstChunkMs = null;

  for (;;) {
    const { value, done: finished } = await reader.read();
    if (finished) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";
    for (const block of blocks) {
      const eventLine = block.match(/^event: (.+)$/mu);
      const dataLine = block.match(/^data: (.+)$/mu);
      if (!eventLine || !dataLine) continue;
      const name = eventLine[1].trim();
      const data = JSON.parse(dataLine[1]);
      if (name === "chunk" && firstChunkMs === null) firstChunkMs = Date.now() - startedAt;
      if (name === "meta") meta = { ...(meta || {}), ...data };
      if (name === "done") done = data;
    }
  }
  return { done, meta, firstChunkMs, totalMs: Date.now() - startedAt };
}

/** 送進模型的來源全文：用來查模型講的數字是不是憑空生出來的 */
async function fetchSourceText(ids) {
  const parts = [];
  for (const id of ids) {
    const res = await fetch(`${API}/FarePolicy/GetIFarePolicyDetail?farePolicyID=${id}`);
    const json = await res.json();
    const detail = json?.result?.result;
    if (!detail) continue;
    for (const value of Object.values(detail)) {
      if (typeof value !== "string") continue;
      let text = value;
      try {
        if ((text.match(/%[0-9A-Fa-f]{2}/gu) || []).length * 3 >= text.length * 0.3) {
          text = decodeURIComponent(text);
        }
      } catch {
        /* 壞掉的編碼原樣留著 */
      }
      parts.push(text.replace(/<[^>]+>/gu, " "));
    }
  }
  return parts.join("\n");
}

/** 阿拉伯數字正規化：全形、逗號分隔都拉平，好跟來源比對 */
function normalizeNumbers(text) {
  return text
    .replace(/[０-９]/gu, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/(\d),(\d)/gu, "$1$2")
    .replace(/(\d),(\d)/gu, "$1$2");
}

function analyze(summary, sourceText) {
  const text = summary || "";
  const chars = text.replace(/\s/gu, "").length;
  const source = normalizeNumbers(sourceText);
  const normalized = normalizeNumbers(text);

  // 具體數字：金額、成數、次數、年齡、等級、電話。兩位數以上才算，避免抓到條列編號
  const numbers = [...new Set((normalized.match(/\d+/gu) || []).filter((n) => n.length >= 2))];
  const unsupported = numbers.filter((n) => !source.includes(n));

  const admitsUnknown = /未載明|沒有載明|未提供|未說明|未列|查無|未明確|沒有寫|未註明/u.test(text);
  const citations = (text.match(/\[參考\s*\d+\]/gu) || []).length;
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 12);
  const repeatedLines = lines.length - new Set(lines).size;

  return { chars, numbers: numbers.length, unsupportedNumbers: unsupported, admitsUnknown, citations, repeatedLines };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const focusSource = await fetchSourceText([FOCUS_POLICY.id]);
  const searchSource = await fetchSourceText(SEARCH_CASES.map((item) => item.id));
  console.log(`來源文字長度：focus ${focusSource.length}、search ${searchSource.length}`);

  const results = [];
  for (const scenario of SCENARIOS) {
    for (const model of MODELS) {
      const payload = buildPayload(scenario, model);
      const source = scenario.route === "focus" ? focusSource : searchSource;
      process.stdout.write(`→ ${scenario.key} / ${model.model} ... `);
      try {
        const { done, meta, firstChunkMs, totalMs } = await callStream(payload);
        const summary = done?.summary || "";
        const row = {
          scenario: scenario.key,
          scenarioName: scenario.name,
          route: scenario.route,
          question: scenario.question,
          expect: scenario.expect,
          provider: model.provider,
          model: model.model,
          label: model.label,
          mode: done?.mode || meta?.mode || "",
          fallback: done?.fallback === true,
          resolvedModel: done?.model || "",
          firstChunkMs,
          totalMs,
          durationMs: done?.durationMs ?? null,
          responseKilobytes: done?.responseKilobytes ?? null,
          summary,
          ...analyze(summary, source),
          error: "",
        };
        results.push(row);
        console.log(
          `${row.mode} ${row.chars}字 ${totalMs}ms${row.fallback ? " [FALLBACK]" : ""}` +
            `${row.unsupportedNumbers.length ? ` 查無數字x${row.unsupportedNumbers.length}` : ""}`
        );
      } catch (error) {
        results.push({
          scenario: scenario.key,
          scenarioName: scenario.name,
          route: scenario.route,
          question: scenario.question,
          provider: model.provider,
          model: model.model,
          label: model.label,
          error: String(error?.message || error),
        });
        console.log(`失敗：${error?.message || error}`);
      }
      await sleep(2500); // 避開免費方案 TPM
    }
  }

  writeFileSync(new URL("./results.json", import.meta.url), JSON.stringify(results, null, 2));
  console.log(`\n完成，共 ${results.length} 筆，已寫入 results.json`);
}

main();
