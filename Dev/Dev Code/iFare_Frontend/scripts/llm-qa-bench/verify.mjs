/**
 * 驗證兩件事：
 *  1. 首次搜尋摘要（overview）不再輸出「如何申請」，且字數降下來
 *  2. 摘要走的是哪一個模型（.env 的候選清單覆寫有沒有讀到）
 * 跑法：node verify.mjs
 */
const BASE = "http://localhost:3000";

const CASES = [
  {
    query: "家中有跌倒",
    context: { query: "家中有跌倒", area: "新北市" },
    cases: [
      { id: 898, title: "【桃園市】失能者長照輔具租賃補助", area: "桃園市",
        qualification: "年滿65歲以上老人、領有身心障礙證明(手冊)者，經照管中心評估符合長照需要等級2級(含)以上者。",
        hasRecipient: true, hasIncome: false, hasIndentity: false },
      { id: 59, title: "【全國】照顧及專業服務", area: "全國",
        qualification: "長照中心評估長照需求等級第2(含)以上",
        hasRecipient: false, hasIncome: false, hasIndentity: false },
    ],
  },
  {
    query: "長照",
    context: { query: "長照", policy: "長期照顧", area: "桃園市" },
    cases: [
      { id: 898, title: "【桃園市】失能者長照輔具租賃補助", area: "桃園市",
        qualification: "年滿65歲以上老人，經照管中心評估符合長照需要等級2級(含)以上者。",
        hasRecipient: true, hasIncome: false, hasIndentity: false },
      { id: 1258, title: "【桃園市】失能者長照輔具租賃補助", area: "桃園市",
        qualification: "領有身心障礙證明(手冊)者，經本府衛生局照管中心評估符合長照需要等級2級(含)以上者。",
        hasRecipient: false, hasIncome: false, hasIndentity: true },
    ],
  },
];

async function callStream(payload) {
  const res = await fetch(`${BASE}/api/llm/summarize/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
  const text = await res.text();
  const blocks = text.split("\n\n").filter((block) => /^event: done/mu.test(block));
  const dataLine = blocks.at(-1)?.match(/^data: (.+)$/mu);
  return dataLine ? JSON.parse(dataLine[1]) : null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  let pass = true;
  for (const item of CASES) {
    for (let round = 1; round <= 2; round += 1) {
      const done = await callStream({ ...item, refresh: true });
      const summary = done?.summary || "";
      const chars = summary.replace(/\s/gu, "").length;
      const hasHowTo = /如何申請|申請流程|申請步驟/u.test(summary);
      const headings = (summary.match(/^###\s*(.+)$/gmu) || []).map((h) => h.replace(/^###\s*/u, ""));
      if (hasHowTo || chars > 240) pass = false;
      console.log(
        `[${item.query}] r${round} 模型=${done?.model} 模式=${done?.mode} 字數=${chars} ` +
          `小標=${JSON.stringify(headings)} 含申請流程=${hasHowTo}`
      );
      if (round === 1) {
        console.log("--------");
        console.log(summary);
        console.log("--------");
      }
      await sleep(1500);
    }
  }
  console.log(`\n結果：${pass ? "通過" : "未通過"}`);
}

main();
