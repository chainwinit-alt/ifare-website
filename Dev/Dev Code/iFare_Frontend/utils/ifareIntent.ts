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

  // 順序重要：先比對「中低收」再比對「低收」，避免誤判。
  // 收「低收／中低收」這種省略「入」的口語寫法：追問框實測輸入「資格為低收」，
  // 字面抽不到，下游就只剩 LLM 的猜測（實測猜成中低收入戶），白名單也攔不住。
  // 「降低收入／降低收費／低收費」是同字不同義，要排除。
  const isLowIncomeFalseFriend = /[降減壓調]低收|低收費/u.test(text);
  if (/中低收/u.test(text)) conditions.income = "中低收入戶";
  else if (/低收/u.test(text) && !isLowIncomeFalseFriend) conditions.income = "低收入戶";
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

const AREA_ONLY_TERMS = new Set<string>([
  ...TAIWAN_AREA_NAMES,
  ...UNIQUE_AREA_SHORT_NAMES.map(([short]) => short),
]);

/**
 * 這個片段是否「只是」一個縣市名。
 *
 * 多關鍵字輸入會拆段各查一次（「新北市 孩童補助」→ 查「新北市」＋查「孩童補助」），
 * 但地區已經被抽出來套進 CodeDomicile 了，再把「新北市」單獨拿去做關鍵字查詢，
 * 會命中所有標題含【新北市】的政策，把真正的主題詞稀釋掉。
 *
 * 只排除純地區詞：年齡、經濟、身分那些詞本身常常也是有意義的主題詞
 * （失智、身心障礙、低收入戶），不能一併拿掉。
 */
export function isAreaOnlySegment(value: unknown) {
  const text = normalizeConditionText(fixCommonTypos(value));
  return Boolean(text) && AREA_ONLY_TERMS.has(text);
}

// 長的排前面，否則「新北」會先把「新北市」吃掉，留下一個孤零零的「市」。
const AREA_STRIP_PATTERNS = [...AREA_ONLY_TERMS]
  .sort((a, b) => b.length - a.length)
  .map((name) => new RegExp(name.replace(/台/gu, "[台臺]"), "gu"));

/**
 * 把縣市名從關鍵字裡拿掉，只留主題詞。
 *
 * 地區是獨立的篩選條件（CodeDomicile），結果集本來就全都是該地區。
 * 但每一筆政策的標題都以【新北市】開頭，所以拿縣市名去比對標題會讓所有結果
 * 一起命中，把真正的主題詞（孩童、長照…）擠到後面——實測「新北市 孩童補助」
 * 排在最前面的是身心障礙類政策，就是這樣來的。
 *
 * 前端兩套相關性評分（結果清單的 getPolicySearchTerms、摘要卡的 rankCases）
 * 都要先經過這一步。
 */
export function stripAreaTerms(value: unknown) {
  let text = String(value ?? "");
  for (const pattern of AREA_STRIP_PATTERNS) {
    text = text.replace(pattern, " ");
  }
  return text.replace(/\s+/gu, " ").trim();
}

// 訪客用語 → 站內政策實際使用的詞。
// 政策標題寫的是「兒童」「兒少」「子女」，沒有一筆寫「孩童」，所以字面比對完全落空。
// 只收幾乎不可能有別的意思的映射；「孩子」刻意不收（「孩子的媽」會被誤判）。
const SITE_VOCABULARY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/孩童|幼童|小孩/gu, "兒童"],
];

// ---------------------------------------------------------------------------
// 處境用語 → 站內政策用語
//
// 不知道補助叫什麼名字的人，打進來的是自己的處境：「我爸爸中風了沒辦法自己吃飯洗澡」。
// 但站內政策一筆都沒寫「中風」（實測 2 筆），寫的是「失能」「長期照顧」「無法自理」，
// 所以照字面查等於查不到——最需要幫助的人反而看到空白。
//
// 右邊的詞都先確認過站內真的查得到（失能 85 筆、長期照顧 172 筆、無法自理 70 筆、
// 失智 44 筆、早產 30 筆、發展遲緩 66 筆、生育 190 筆、失業 82 筆、急難 65 筆）。
// 這裡只補「政策實際會用的詞」，不推測使用者的身分、年齡或經濟狀況——那些條件
// 仍然只認使用者自己打出來的字（見 extractExplicitSearchConditions）。
// ---------------------------------------------------------------------------
const SITUATION_VOCABULARY: Array<[RegExp, string]> = [
  [/腦中風|中風|癱瘓|半身不遂|臥床|插鼻胃管|無法自理|不能自理|生活不能自理|沒辦法自己(?:吃飯|洗澡|穿衣|上廁所|走路)|需要人(?:照顧|看護)|行動不便/u, "失能 長期照顧 無法自理"],
  [/失智|阿茲海默|老年痴呆|記憶力(?:變差|退化|越來越差|不好)|忘東忘西|認知退化/u, "失智 長期照顧"],
  [/失業|被裁員|遭資遣|丟了工作|沒有工作|待業|找不到工作/u, "失業 非自願離職"],
  [/保溫箱|巴掌仙子|早產兒/u, "早產"],
  [/慢半拍|發展比較慢|說話(?:比較)?慢|不太會說話|遲緩/u, "發展遲緩 早期療育"],
  [/懷孕|坐月子|生小孩|生產|待產|新生兒/u, "生育"],
  [/繳不出(?:房租|租金)|租不起|沒地方住|房租太貴/u, "租金 住宅"],
  [/快沒錢|沒錢(?:吃飯|生活|看病)|生活過不下去|撐不下去|經濟困難|家裡沒收入|付不出醫藥費/u, "急難 生活扶助"],
  [/獨居|沒人照顧|一個人住/u, "獨居"],
  [/往生|過世|辦後事|喪事/u, "喪葬"],
];

/**
 * 把處境描述補上站內政策會用的詞，原文保留。
 *
 * 保留原文是刻意的：萬一站內真的有寫「中風」的政策（實測 2 筆），那幾筆仍然要找得到。
 * 補上的詞只用來擴大搜尋與排序，不會顯示在搜尋框裡，也不會變成篩選條件。
 *
 * sourceText：比對處境用語時要看的原文。意圖解析會把長句濃縮成「中風」，
 * 處境的線索（沒辦法自己吃飯洗澡）就不見了，所以比對要回頭看使用者真正打的字。
 */
export function expandSituationVocabulary(value: unknown, sourceText?: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const source = String(sourceText ?? "").trim() || text;

  const additions: string[] = [];
  for (const [pattern, siteTerms] of SITUATION_VOCABULARY) {
    if (!pattern.test(source)) continue;
    for (const term of siteTerms.split(" ")) {
      if (term && !text.includes(term) && !additions.includes(term)) additions.push(term);
    }
  }

  return additions.length ? `${text} ${additions.join(" ")}` : text;
}

/**
 * 相關性排序專用的關鍵字：拿掉縣市名，再把訪客用語換成站內政策實際使用的詞。
 * 只影響排序，不影響顯示給使用者的搜尋詞，也不影響送去後端的查詢字串。
 */
export function buildRelevanceQuery(value: unknown) {
  let text = stripAreaTerms(value);
  for (const [pattern, replacement] of SITE_VOCABULARY_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  // 處境描述（「中風」「臥床」）在站內政策裡幾乎不存在，不補上「失能」「長期照顧」
  // 這些政策實際用的詞，相關性一律算成 0，摘要卡會判定站內查無資料。
  return expandSituationVocabulary(text, value);
}

// ---------------------------------------------------------------------------
// 政策類別（後端 /Code/GetCodePolicyList，畫面上是「受助者情況」下拉）
//
// 訪客不會照著這 12 個官方名稱講——會說「長照」而不是「長期照顧」、
// 說「身障」而不是「身心障礙福利」。這張表把訪客用語對到官方類別名，
// 讓摘要的引導提問知道「這次要不要問類別」，也讓使用者的回答能套進篩選器。
// ---------------------------------------------------------------------------
export const POLICY_CATEGORY_KEYWORDS: Array<[string, RegExp]> = [
  ["長期照顧", /長期照顧|長照|失能|失智|喘息|照顧者|居家服務|日間照顧/u],
  ["身心障礙福利", /身心障礙|身障|智能障礙|輔具|重大傷病/u],
  ["兒少福利", /兒少|兒童|少年|孩童|幼童|小孩|育兒|托育|托嬰|生育|懷孕|新生兒|嬰幼兒|學童/u],
  ["老人福利", /老人|長者|長輩|高齡|銀髮|敬老/u],
  ["社會救助", /社會救助|低收入|中低收入|經濟弱勢|急難|生活扶助|喪葬/u],
  ["社會保險", /社會保險|健保|全民健康保險|勞保|勞工保險|國民年金|農保/u],
  ["勞工福利", /勞工|失業|就業|職業訓練|職訓|非自願離職/u],
  ["住宅福利", /住宅|租屋|租金|包租代管|購屋|房屋/u],
  ["原民福利", /原住民|原民/u],
  ["家庭福利", /家庭福利|特殊境遇|單親|婦女/u],
];

/** 從自由文字推出政策類別的官方名稱；推不出來回空字串（絕不猜） */
export function matchPolicyCategory(value: unknown) {
  const text = normalizeConditionText(fixCommonTypos(value));
  if (!text) return "";
  for (const [category, pattern] of POLICY_CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return category;
  }
  return "";
}

// ---------------------------------------------------------------------------
// 追問框：這句話是在「問問題」還是在「回答上一題的條件」
//
// 兩者要走完全不同的路：問題必須直接回答（answer 模式，拿政策明細去答），
// 條件則是拿去縮小搜尋再重寫摘要（overview / guidance 模式）。
// 判不出來就當成回答條件——那是原本就有的行為，不會比現在更糟。
// ---------------------------------------------------------------------------

/** 字面上的疑問寫法。「需要準備甚麼文件」沒有問號也算，訪客本來就很少打問號 */
const FOLLOW_UP_QUESTION_PATTERN =
  /[?？]|嗎|呢|什麼|甚麼|如何|怎麼|怎樣|哪|多少|多久|何時|幾天|幾歲|幾個月|幾次|是否|能不能|可不可以|有沒有|要不要|為何|請問/u;

/**
 * 沒有疑問詞、但明顯是在問政策細節的說法（「應備文件」「申請流程」「補助金額」）。
 *
 * 這裡只收「絕不可能是篩選條件答案」的詞。刻意不收「資格」——實測有人用
 * 「資格為低收」來補條件，那一句要走縮小搜尋，不是回答問題。
 */
const FOLLOW_UP_DETAIL_PATTERN =
  /文件|應備|備齊|流程|申請方式|申請時間|洽詢|承辦|聯絡|電話|金額|多少錢|補助多少|期限|截止/u;

/** 這句追問是不是在問問題（要直接回答，而不是拿去縮小搜尋） */
export function isFollowUpQuestion(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  return FOLLOW_UP_QUESTION_PATTERN.test(text) || FOLLOW_UP_DETAIL_PATTERN.test(text);
}
