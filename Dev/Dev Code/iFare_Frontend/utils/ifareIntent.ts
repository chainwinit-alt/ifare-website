// 常見錯字與同音誤植：在意圖解析前先修正，讓「新北市老任津貼」這類輸入也能正確比對。
// 只收「幾乎不可能是本意」的寫法，避免誤傷正常詞。
const commonTypoReplacements: Array<[RegExp, string]> = [
  [/老任(?=津貼|補助|福利|年金|照顧|服務)/gu, "老人"],
  [/老年人/gu, "老人"],
  [/身障(?!礙)/gu, "身心障礙"],
  [/低收戶/gu, "低收入戶"],
  [/中低收戶/gu, "中低收入戶"],
];

export function fixCommonTypos(value: unknown) {
  let normalized = String(value ?? "");
  for (const [pattern, replacement] of commonTypoReplacements) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

const respectfulTermReplacements: Array<[RegExp, string]> = [
  [/低能兒/gu, "智能障礙兒童"],
  [/智障兒/gu, "智能障礙兒童"],
  [/低能/gu, "智能障礙"],
  [/弱智/gu, "智能障礙"],
  [/智障/gu, "智能障礙"],
  [/殘障/gu, "身心障礙"],
];

export function normalizeRespectfulPolicyTerm(value: unknown) {
  let normalized = String(value ?? "").trim();
  for (const [pattern, replacement] of respectfulTermReplacements) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized.replace(/\s+/g, " ").trim();
}

export function normalizeFallbackIntentTopic(value: unknown) {
  const original = String(value ?? "").trim();
  if (!original) return "";

  const candidate = normalizeRespectfulPolicyTerm(original)
    .replace(
      /(?:可以申請什麼|可以申請|有什麼|有哪些|補助|津貼|福利|政策|資格|申請|查詢|搜尋)/gu,
      " "
    )
    .replace(/[?？!！,，。；;：:、]/gu, " ")
    .replace(/\s+/g, "")
    .replace(/相關$/u, "")
    .trim();
  const hasConcreteTopic =
    candidate.length >= 2 &&
    !/^(?:我|想|要|請問|幫我|知道|了解|找|看看|目前|可以|能否|是否|什麼|相關)+$/u.test(
      candidate
    );

  return hasConcreteTopic
    ? candidate.slice(0, 30)
    : normalizeRespectfulPolicyTerm(original).slice(0, 30);
}

export function buildFallbackIntentSummary(value: unknown) {
  const topic = normalizeFallbackIntentTopic(value).replace(/相關$/u, "");
  if (!topic) return "";
  return `我會依照您提到的「${topic.slice(0, 30)}」整理本站相符政策，不另外加入未提及的需求或條件。您還想補充哪一項條件呢？`;
}

// ---------------------------------------------------------------------------
// 明確搜尋條件抽取（純正則、零 LLM）
//
// 訪客常把篩選條件直接打進關鍵字框：「老人可以申請甚麼補助？」「低收入戶」
// 「新北市老人津貼」。這裡把字面上明確出現的條件抽出來，讓頁面自動套用
// 對應篩選。LLM 意圖解析可用時作為補充驗證，LLM 掛掉時作為完整兜底。
// 原則：只抽「字面明確寫出」的條件，絕不推測。
// ---------------------------------------------------------------------------

export const TAIWAN_AREA_NAMES = [
  "台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", "基隆市",
  "新竹市", "嘉義市", "新竹縣", "苗栗縣", "彰化縣", "南投縣", "雲林縣",
  "嘉義縣", "屏東縣", "宜蘭縣", "花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣",
] as const;

// 縣市簡稱（去掉市／縣字尾後仍唯一者才收；新竹、嘉義有同名縣市，不收簡稱）
const UNIQUE_AREA_SHORT_NAMES: Array<[string, string]> = [
  ["台北", "台北市"], ["新北", "新北市"], ["桃園", "桃園市"], ["台中", "台中市"],
  ["台南", "台南市"], ["高雄", "高雄市"], ["基隆", "基隆市"], ["苗栗", "苗栗縣"],
  ["彰化", "彰化縣"], ["南投", "南投縣"], ["雲林", "雲林縣"], ["屏東", "屏東縣"],
  ["宜蘭", "宜蘭縣"], ["花蓮", "花蓮縣"], ["台東", "台東縣"], ["澎湖", "澎湖縣"],
  ["金門", "金門縣"], ["連江", "連江縣"],
];

export type ExplicitSearchConditions = {
  /** 標準縣市名，未提及為空字串 */
  area: string;
  /** 嬰幼兒｜兒童＆青少年｜成人｜老人，未提及為空字串 */
  recipient: string;
  /** 低收入戶｜中低收入戶｜經濟弱勢，未提及為空字串 */
  income: string;
  /** 身心障礙｜特殊境遇｜重大傷病｜原住民｜新住民（可複數） */
  identities: string[];
};

function normalizeConditionText(value: unknown) {
  return String(value ?? "")
    .replace(/臺/gu, "台")
    .replace(/[\s　]+/gu, "");
}

export function extractExplicitSearchConditions(value: unknown): ExplicitSearchConditions {
  const text = normalizeConditionText(fixCommonTypos(value));
  const conditions: ExplicitSearchConditions = {
    area: "",
    recipient: "",
    income: "",
    identities: [],
  };
  if (!text) return conditions;

  conditions.area =
    TAIWAN_AREA_NAMES.find((area) => text.includes(area)) ||
    UNIQUE_AREA_SHORT_NAMES.find(([short]) => text.includes(short))?.[1] ||
    "";

  // 順序重要：先比對「中低收入」再比對「低收入」，避免誤判
  if (/中低收入/u.test(text)) conditions.income = "中低收入戶";
  else if (/低收入/u.test(text)) conditions.income = "低收入戶";
  else if (/經濟弱勢/u.test(text)) conditions.income = "經濟弱勢";

  if (/老人|長者|長輩|高齡|銀髮|失智|敬老/u.test(text)) conditions.recipient = "老人";
  else if (/嬰幼兒|嬰兒|新生兒|寶寶|幼兒|托嬰/u.test(text)) conditions.recipient = "嬰幼兒";
  else if (/兒童|兒少|青少年|學童|國小|國中|高中/u.test(text)) conditions.recipient = "兒童＆青少年";
  else if (/成人|青年|壯年/u.test(text)) conditions.recipient = "成人";

  if (/身心障礙|智能障礙/u.test(text)) conditions.identities.push("身心障礙");
  if (/特殊境遇/u.test(text)) conditions.identities.push("特殊境遇");
  if (/重大傷病/u.test(text)) conditions.identities.push("重大傷病");
  if (/原住民/u.test(text)) conditions.identities.push("原住民");
  if (/新住民|外籍配偶/u.test(text)) conditions.identities.push("新住民");

  return conditions;
}
