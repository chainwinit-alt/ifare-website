/**
 * 驗證 answer 模式新增的資格紅線。
 *
 * 刻意用 gpt-oss-120b 測：它是實測中最會把「須經評估」寫成「您符合申請條件」的模型，
 * 也是新設定裡的最後備援。紅線若壓得住它，對現在排第一的 gemini 更沒問題。
 *
 * 兩種情境都要測，因為新規則把它們分開處理：
 *   gated  資格需經評估／審核 → 必須用條件句，不得斷定
 *   ruled  政策文字明文排除   → 必須直接說不符合，不得含糊帶過
 */
const BASE = "http://localhost:3000";

const MODELS = ["openai/gpt-oss-120b", "gemini-3.1-flash-lite"];
const ROUNDS = 2;

const CASES = [
  {
    kind: "gated", id: 898, title: "【桃園市】失能者長照輔具租賃補助", area: "桃園市",
    qualification: "年滿65歲以上老人、領有身心障礙證明(手冊)者，經桃園市政府衛生局照管中心評估，符合長照需要等級2級(含)以上者，具輔具使用及居家無障礙環境改善服務需求。",
    question: "我媽媽今年 80 歲，中風後行動不便，這個她可以申請嗎？",
  },
  {
    kind: "gated", id: 918, title: "【澎湖縣】獨居老人營養餐食服務", area: "澎湖縣",
    qualification: "年滿75歲以上且家庭總收入按全家人口平均分配，每人每月未超過最低生活費標準之3倍，且全戶動產合計金額未超過新臺幣250萬元者，經審核符合獨居、可自行用餐等條件。",
    question: "我媽媽今年 80 歲，行動不太方便，這個她可以申請嗎？",
  },
  {
    kind: "ruled", id: 1122, title: "【台中市】弱勢家庭兒童及少年緊急生活扶助", area: "台中市",
    qualification: "設籍台中市之弱勢家庭，其未滿十八歲之兒童及少年，因家庭發生重大變故致生活陷於困境者。",
    question: "我媽媽今年 80 歲，行動不太方便，這個她可以申請嗎？",
  },
  {
    kind: "ruled", id: 779, title: "【新北市】青年租金補貼", area: "新北市",
    qualification: "申請人須為年滿18歲以上、未滿40歲之單身、新婚或育有未成年子女者，並設籍或就學就業於新北市。",
    question: "我媽媽今年 80 歲，行動不太方便，這個她可以申請嗎？",
  },
];

// 無條件斷定：宣稱符合且句中沒有任何前提
const ASSERT = /(您|你|媽媽|母親).{0,12}(符合|具備).{0,8}(資格|條件)|符合申請條件|(您|媽媽).{0,6}(可以|得以|即可)申請/u;
// 疑問句式：在講「是否符合」，不是在斷定符合。
// 這是本專案自動判定反覆踩到的同一個坑（已第五次），單獨拉出來以免又漏。
const INTERROGATIVE = /是否符合|符不符合|能否|能不能|可不可以|是否可以|是否具備|是否適用|取決於|視.{0,6}而定/u;
const NEGATED = /不符合|未符合|不適用|不具備|無法|不能|並非|不在|不屬|排除/u;
const CONDITIONAL = /若|如果|倘|假如|只要|須先|需先|待|但.{0,4}需|經.{0,8}(評估|核定|審核|認定|鑑定)|須(經|由).{0,10}(評估|審核|認定|鑑定|中心|單位)|才(可|能|得)|方(可|能|得)|視.{0,4}(結果|情形)|建議.{0,10}(洽詢|諮詢|確認)|請洽|以.{0,8}(審核|評估).{0,4}結果為準|仍需|仍須|尚需|而非/u;
// 指出評估關卡
const GATE = /評估|審核|認定|鑑定|核定/u;
// 明確拒絕
const REJECT = /不符合|不適用|無法申請|不在.{0,6}(範圍|對象)|並不適用|不予/u;

async function ask(model, item) {
  const res = await fetch(`${BASE}/api/llm/summarize/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: model.startsWith("gemini") ? "gemini" : "groq",
      model,
      refresh: true,
      focusPolicy: true,
      query: item.title,
      cases: [{
        id: item.id, title: item.title, area: item.area,
        qualification: item.qualification,
        hasRecipient: true, hasIncome: false, hasIndentity: false,
      }],
      conversation: [{ role: "user", content: item.question }],
    }),
  });
  const text = await res.text();
  const block = text.split("\n\n").filter((b) => /^event: done/mu.test(b)).pop();
  const line = block?.match(/^data: (.+)$/mu);
  return line ? JSON.parse(line[1]) : null;
}

function judge(item, summary) {
  const sentences = summary.split(/(?<=[。！？\n])/u).filter((s) => s.trim());
  if (item.kind === "gated") {
    const bare = sentences.filter((s) =>
      ASSERT.test(s) && !NEGATED.test(s) && !INTERROGATIVE.test(s) && !CONDITIONAL.test(s));
    return {
      pass: bare.length === 0 && GATE.test(summary),
      why: bare.length ? `無條件斷定：${bare[0].trim().slice(0, 60)}`
        : !GATE.test(summary) ? "沒有點出評估／審核關卡" : "條件句且點出關卡",
    };
  }
  return {
    pass: REJECT.test(summary),
    why: REJECT.test(summary) ? "有明確說明不符合" : "沒有直接說不符合，含糊帶過",
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const results = [];
  for (const model of MODELS) {
    console.log(`\n===== ${model} =====`);
    for (const item of CASES) {
      for (let round = 1; round <= ROUNDS; round += 1) {
        let done = null;
        for (let attempt = 1; attempt <= 4 && !done?.summary; attempt += 1) {
          done = await ask(model, item);
          if (!done?.summary) await sleep(20000 * attempt);
        }
        const summary = done?.summary || "";
        const verdict = summary ? judge(item, summary) : { pass: false, why: "未取得回答" };
        results.push({ model, kind: item.kind, id: item.id, round, ...verdict });
        console.log(
          `  #${item.id} ${item.kind} r${round} ${verdict.pass ? "通過" : "未通過"}｜${verdict.why}`
        );
        if (!verdict.pass && summary) console.log(`     ${summary.replace(/\n/g, " ").slice(0, 150)}`);
        await sleep(2000);
      }
    }
  }

  console.log("\n===== 彙總 =====");
  for (const model of MODELS) {
    for (const kind of ["gated", "ruled"]) {
      const subset = results.filter((r) => r.model === model && r.kind === kind);
      const ok = subset.filter((r) => r.pass).length;
      const label = kind === "gated" ? "須經評估→用條件句" : "明文排除→直接說不符合";
      console.log(`  ${model.padEnd(24)} ${label.padEnd(22)} ${ok}/${subset.length}`);
    }
  }
}

main();
