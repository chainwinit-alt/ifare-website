// 常見錯字與同音誤植：在意圖解析前先修正，讓「新北市老任津貼」這類輸入也能正確比對。
// 只收「幾乎不可能是本意」的寫法，避免誤傷正常詞。
const commonTypoReplacements: Array<[RegExp, string]> = [
  [/老任(?=津貼|補助|福利|年金|照顧|服務)/gu, "老人"],
  [/老年人/gu, "老人"],
  [/身障(?!礙)/gu, "身心障礙"],
  [/低收戶/gu, "低收入戶"],
  [/中低收戶/gu, "中低收入戶"],
  // 「假牙」的常見同音誤植。2026-08-26 評估集實測「假芽補助」查 0 筆——
  // 「假芽」不會有別的意思（發芽、芽苗都不含「假」），無條件修正不會誤傷。
  [/假芽/gu, "假牙"],
];

/**
 * 簡體字 → 繁體字（只收會影響福利搜尋的常用字）。
 *
 * 站內政策全是繁體，簡體輸入完全查不到——實測「医疗补助」0 筆、「醫療補助」702 筆，
 * 「低收入户」0 筆、「低收入戶」566 筆。陸配、陸生或使用簡體輸入法的民眾會直接撞到查無。
 *
 * 刻意不做全套簡繁轉換：那需要龐大對照表，且一對多的字（后→後/后、干→乾/幹）
 * 轉錯反而會把正常查詢弄壞。這裡只收「站內高頻福利用語」裡出現、且簡繁一對一的字。
 */
const SIMPLIFIED_TO_TRADITIONAL: Array<[RegExp, string]> = [
  [/医/gu, "醫"], [/疗/gu, "療"], [/补/gu, "補"], [/贴/gu, "貼"], [/户/gu, "戶"],
  [/济/gu, "濟"], [/费/gu, "費"], [/务/gu, "務"], [/护/gu, "護"], [/养/gu, "養"],
  [/儿/gu, "兒"], [/岁/gu, "歲"], [/龄/gu, "齡"], [/残/gu, "殘"], [/碍/gu, "礙"],
  [/请/gu, "請"], [/证/gu, "證"], [/书/gu, "書"], [/县/gu, "縣"], [/长/gu, "長"],
  [/顾/gu, "顧"], [/学/gu, "學"], [/亲/gu, "親"], [/属/gu, "屬"], [/单/gu, "單"],
  [/结/gu, "結"], [/关/gu, "關"], [/务/gu, "務"], [/员/gu, "員"], [/资/gu, "資"],
  [/额/gu, "額"], [/领/gu, "領"], [/给/gu, "給"], [/条/gu, "條"], [/则/gu, "則"],
  [/伤/gu, "傷"], [/风/gu, "風"], [/发/gu, "發"], [/达/gu, "達"], [/迟/gu, "遲"],
  [/缓/gu, "緩"], [/术/gu, "術"], [/业/gu, "業"], [/产/gu, "產"], [/义/gu, "義"],
  [/绍/gu, "紹"], [/统/gu, "統"], [/务/gu, "務"], [/县/gu, "縣"], [/济/gu, "濟"],
];

export function normalizeSimplifiedChinese(value: unknown) {
  let normalized = String(value ?? "");
  for (const [pattern, replacement] of SIMPLIFIED_TO_TRADITIONAL) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

export function fixCommonTypos(value: unknown) {
  // 先轉簡體再修錯字：錯字表寫的是繁體，簡體輸入不先轉就一條都對不上
  let normalized = normalizeSimplifiedChinese(value);
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

  // 家族稱謂也算「字面明確講出年齡族群」：民眾說「我爺爺」「我阿嬤」時，
  // 受助者是長輩這件事是他自己講的，不是系統推測。實測「我的爺爺癌症…」原本
  // 連年齡都抽不到。刻意不收「爸爸／媽媽」——那不一定是老人（可能是中壯年）。
  if (/老人|長者|長輩|高齡|銀髮|失智|敬老|爺爺|奶奶|阿公|阿嬤|外公|外婆|祖父|祖母/u.test(text)) conditions.recipient = "老人";
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
  // 同一件事的簡稱與全稱。訪客習慣打「長照」，但政策條文多半寫「長期照顧」——
  // 實測站內含「長期照顧」172 筆、含「長照」只有 52 筆，只打簡稱會漏掉 120 筆。
  // 台北市的「失能老人營養餐飲服務」寫的是「經長期照顧管理中心評估」，就是這樣
  // 被判成與「長照」無關而排到第 9 名，使用者選了台北市卻一筆在地政策都看不到。
  [/長照|長期照顧/u, "長照 長期照顧"],
  [/早療|早期療育/u, "早療 早期療育"],
  [/腦中風|中風|癱瘓|半身不遂|臥床|插鼻胃管|無法自理|不能自理|生活不能自理|沒辦法自己(?:吃飯|洗澡|穿衣|上廁所|走路)|需要人(?:照顧|看護)|行動不便/u, "失能 長期照顧 無法自理"],
  [/失智|阿茲海默|老年痴呆|記憶力(?:變差|退化|越來越差|不好)|忘東忘西|認知退化/u, "失智 長期照顧"],
  // 跌倒是長輩家屬最常見的求助起點，但站內政策幾乎沒人寫「跌倒」（實測 1 筆），
  // 寫的是無障礙（435 筆）、修繕（29 筆）、輔具（63 筆）。不補這一條的話，
  // 打「家裡有人跌倒」撈回來的是停車位補貼與喪葬補助——實測 20 筆，沒有一筆跟
  // 居家安全有關，而站上其實有住屋修繕、無障礙環境改造、輔具租借這些政策。
  [/跌倒|摔倒|跌傷|滑倒|防跌|居家安全|浴室很滑|怕再跌|站不穩/u, "無障礙 修繕 輔具"],
  [/失業|被裁員|遭資遣|丟了工作|沒有工作|待業|找不到工作/u, "失業 非自願離職"],
  // 「沒有薪水兩個月」「被欠薪」這類收入中斷的講法：可能是失業、也可能是被積欠工資，
  // 站內兩邊都有對應（失業給付／急難救助／生活扶助），一併展開。實測「我已經沒有薪水
  // 兩個月」原本 0 筆——「薪水」既不符失業 pattern（認的是失業/沒工作）也不符缺錢 pattern
  //（認的是沒有錢/沒收入），剛好漏掉。
  [/沒(?:有)?薪水|沒領(?:到)?薪水|領不到薪水|被欠薪|欠薪|積欠(?:薪資|工資)|薪水沒(?:發|著落)|發不出薪水|好幾個月沒(?:領到?錢|發薪)/u, "失業 急難 生活扶助"],
  [/保溫箱|巴掌仙子|早產兒/u, "早產"],
  [/慢半拍|發展比較慢|說話(?:比較)?慢|不太會說話|遲緩/u, "發展遲緩 早期療育"],
  [/懷孕|坐月子|生小孩|生產|待產|新生兒/u, "生育"],
  // 原本只認「繳不出房租」這一種語序（動詞在前），但實測民眾更常把名詞放前面講
  //「房租繳不出來」——同一件事、換個語序就整條落空，DB 查 0 筆。現在名詞在前在後都認，
  // 中間允許最多 3 個字的插入語（「房租快繳不出來」「房租我付不出來」），
  // 但不跨標點與空白，避免把兩句不相干的話串成一個誤判。
  // 展開詞維持不變：租金 62 筆、住宅 99 筆（合查 108 筆）。
  [/(?:繳|付)不(?:出|起)(?:房租|租金)|(?:房租|租金)[^\s，,。；;、]{0,3}?(?:繳|付)不(?:出|起)|租不起|沒地方住|(?:房租|租金)太(?:貴|高)/u, "租金 住宅"],
  // 家長問的是「學費」，站內政策寫的是「就學」「教育」「助學」。實測「小孩的學費有補助嗎」
  // 0 筆——不是站內沒有這類政策，是字面對不上：站內含「學費」只有 39 筆、「學雜費」10 筆、
  //「註冊費」0 筆，而「就學」147 筆、「教育」166 筆、「助學」80 筆（合查 172 筆）。
  // 註冊費刻意只放在左邊（訪客會這樣講）、絕不放進展開詞，展開查不到的詞等於沒修。
  [/學費|學雜費|註冊費|補習費|書籍費|念不起(?:書|大學)|讀不起(?:書|大學)|上不起學/u, "就學 教育 助學"],
  // 「缺錢」「手頭緊」「入不敷出」這類最直白的經濟困難講法原本沒收，實測「我缺錢可以怎麼辦」
  // 因此展開不出站內詞、DB 查 0 筆。站內對應的是急難救助（65 筆）與生活扶助，一併補齊常見說法。
  [/缺錢|沒錢|沒有錢|快沒錢|手頭(?:很|有點)?緊|經濟(?:困難|壓力|拮据|吃緊)|生活(?:過不下去|困難|陷入困境|有困難)|撐不下去|快活不下去|入不敷出|家裡沒(?:收入|錢)|沒(?:有)?收入|付不出(?:醫藥費|錢)?|繳不出/u, "急難 生活扶助"],
  // 重大傷病：民眾講「癌症」「洗腎」「化療」，政策寫的是「重大傷病」「重病」。
  // 實測「我的爺爺癌症有可以甚麼申請的」四道防線全失效、查 0 筆——但站內有癌症慰問金
  // 4 筆、重大傷病 137 筆、重病 60 筆。這裡只展開確認過查得到的詞。
  [/癌症|罹癌|癌友|化療|放療|標靶治療|洗腎|透析|重大傷病|重症|安寧療護|器官移植/u, "重大傷病 重病 醫療"],
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
// 受助對象（beneficiary）分類與重排
//
// 使用者問「我兩個月沒工作怎麼辦」（本人失業），摘要卻推「失業勞工子女就學補助」——
// 那是補助申請人的「子女」、不是「本人」，答非所問。這裡把「這筆政策是給誰的」與
// 「使用者關心的是誰」抽成可重用的判斷，讓摘要卡與結果清單用同一套邏輯重排。
//
// 紅線：只用來「排序加權/降權」，絕不硬篩掉。判斷錯只會順序差一點、其他排序訊號會
// 兜回；硬篩錯會把符合資格的政策藏起來。地區/年齡/經濟/身分的硬篩選仍只認字面。
//
// 範圍（Phase 1）：只做最明確的「子女就學類 vs 非子女查詢」這一組；照顧者/父母等
// 雙向視角風險較高（求助者常本身就是照顧者），留待後續。
// ---------------------------------------------------------------------------

// 政策「主要是給子女」的訊號：標題/資格出現子女就學相關字。刻意收窄到「子女/就學/
// 助學/學費」這種明確「給孩子」的字，不收「兒童/兒少」——兒少生活扶助那類直接受助者
// 就是孩子、在問孩子時本來就該出現，收進來反而會誤降。
const POLICY_CHILD_BENEFICIARY_PATTERN = /子女|就學|助學|學費|學雜費/u;

// 使用者這句話「關心的是子女」：提到小孩/就學等。比對用修過錯字、去空白的正規化文字。
const QUERY_CHILD_CONCERN_PATTERN =
  /子女|小孩|兒子|女兒|孩子|寶寶|嬰|新生兒|就學|上學|學費|學雜費|註冊|念書|讀書|育兒|托育|幼兒|學童|兒少|兒童|青少年|學生|教育/u;

/** 這筆政策的主要受助對象是不是「子女」（從標題與資格判斷） */
export function isChildBeneficiaryPolicy(item: { title?: string; qualification?: string } | null | undefined) {
  const text = normalizeConditionText(`${item?.title ?? ""}${item?.qualification ?? ""}`);
  return POLICY_CHILD_BENEFICIARY_PATTERN.test(text);
}

/** 使用者這句查詢關心的對象是不是子女 */
export function queryConcernsChild(value: unknown) {
  const text = normalizeConditionText(fixCommonTypos(value));
  return QUERY_CHILD_CONCERN_PATTERN.test(text);
}

/**
 * 受助對象不符時的排序懲罰（負值，只影響排序）。
 * 政策是給「子女」的、但使用者查詢沒提到子女 → 降權，讓給本人的政策排到前面。
 * 一提到小孩/就學就回 0（不降），避免把該給的子女政策壓掉。
 */
export function beneficiaryMismatchPenalty(queryText: unknown, item: { title?: string; qualification?: string } | null | undefined) {
  if (isChildBeneficiaryPolicy(item) && !queryConcernsChild(queryText)) return -80;
  return 0;
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
  // 「租房子」「租房」是口語常見說法，原本只收「租屋」會漏掉
  ["住宅福利", /住宅|租屋|租房|房租|租金|包租代管|購屋|房屋/u],
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

/**
 * 這句話是不是「只講了條件」——只有縣市、年齡、經濟或身分，沒有帶新的主題。
 *
 * 追問框裡補一句「高雄」「台北的」時，主題並沒有改變，本地正則也抽得出條件，
 * 不需要再叫一次意圖解析（實測那一次 LLM 要 1.3 秒）。
 * 只要句子裡還剩下有意義的字（例如「長照 高雄」的「長照」），就不算，照常送去解析。
 */
const CONDITION_ONLY_RESIDUE = /低收入戶|中低收入戶|經濟弱勢|中低收|低收|嬰幼兒|幼兒|兒童|青少年|兒少|成人|老人|長者|長輩|高齡|身心障礙|身障|原住民|新住民|特殊境遇|重大傷病|[的了嗎呢喔啦我是有在住要想找看]|[\s，,。、！!？?]/gu;

/**
 * 這句追問是不是在「換一個主題」，而不是補條件或問問題。
 *
 * 追問框原本只分兩種：有疑問詞就直接回答，其餘一律當成補充條件疊到舊搜尋上。
 * 「高雄」「低收入戶」疊上去是對的，但「孩童補助的政策」是換主題——實測搜「跌倒」
 * 再打這句，兩個主題被合併成「跌倒導致受傷的孩童」，結果從 54 筆變成 151 筆，
 * 搜尋框還停在「跌倒」。越補越大，跟使用者想做的事剛好相反。
 *
 * 判斷刻意保守：必須明確指向某一類福利（照 POLICY_CATEGORY_KEYWORDS）或某個
 * 站內認得的處境詞，才算換主題。「我爸爸也需要」這種沒有主題的話抽不出東西，
 * 會落回原本的補條件行為——誤判成補條件只是沒幫上忙，誤判成換主題卻會把
 * 使用者辛苦收斂的搜尋整個清掉。
 */
/**
 * 這段文字指向哪一個福利主題：先看政策類別，再看處境詞。指不出來回空字串。
 * 只用來比對「跟現在搜的是不是同一件事」，不對外。
 */
function getTopicKey(value: unknown) {
  const text = fixCommonTypos(normalizeRespectfulPolicyTerm(String(value ?? "")));
  if (!text) return "";
  const category = matchPolicyCategory(text);
  if (category) return category;
  const situation = SITUATION_VOCABULARY.find(([pattern]) => pattern.test(text));
  return situation ? situation[1] : "";
}

/**
 * 「孩童補助呢」這種用「呢」結尾的轉移話題問法。
 *
 * 中文裡「那 X 呢？」就是換一個對象問，不是在問眼前這幾筆政策。但「呢」也是
 * 疑問詞，會先被 isFollowUpQuestion 攔下來——實測使用者打「孩童補助呢」，
 * 系統當成提問去翻現有政策，回了一句「站內資料未載明孩童補助」，等於答非所問。
 *
 * 只認這一種寫法，而且句子裡不能有別的疑問詞：「要準備什麼文件呢？」含「什麼」，
 * 那是在問眼前的政策，不能當成換主題。
 */
const TOPIC_SHIFT_PARTICLE_PATTERN = /^[^？?]{2,24}呢[？?]?$/u;
const NON_SHIFT_QUESTION_WORDS =
  /[?？]|嗎|什麼|甚麼|如何|怎麼|怎樣|哪|多少|多久|何時|幾|是否|能不能|可不可以|有沒有|要不要|為何|請問|符合|資格|文件|流程|金額/u;

export function isNewTopicText(value: unknown, currentQuery?: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  if (isConditionOnlyText(text)) return false;

  // 指不出主題，或講的就是現在這個主題（「長照要準備什麼文件」），都不是換主題
  const topic = getTopicKey(text);
  if (!topic || topic === getTopicKey(currentQuery)) return false;

  // 完全沒有疑問詞 → 直接說了另一個主題（「孩童補助的政策」）
  if (!isFollowUpQuestion(text)) return true;

  // 有疑問詞時只放行「X 呢」這一種轉移問法
  return (
    TOPIC_SHIFT_PARTICLE_PATTERN.test(text) &&
    !NON_SHIFT_QUESTION_WORDS.test(text.replace(/呢[？?]?$/u, ""))
  );
}

/**
 * 把句尾的語尾助詞與標點拿掉，只留真正要搜的那幾個字。
 *
 * 換主題時 applySummaryNewTopic 是把使用者打的整句話原封不動寫進搜尋框——
 * 實測打「孩童補助呢」，搜尋框就顯示「孩童補助呢」，一個語助詞卡在搜尋條件裡。
 * 沒有疑問詞的「孩童補助吧」「孩童補助喔」也會走到同一條路，狀況一樣。
 *
 * 不只是好不好看：這幾個字會跟著送去後端比對。實測直接查 API，「長照」52 筆、
 * 「長照呢」只剩 28 筆，而且那 28 筆全都在原本的 52 筆裡面——多一個「呢」只會
 * 漏掉政策，不會多撈到任何一筆。
 *
 * 砍句尾不會誤傷正常詞，這是查過站內資料才敢砍的：全站 1337 筆政策的標題、
 * 資格條件與關鍵字裡，呢嗎吧喔啊呀啦囉嘛耶唷 加起來只出現 1 次（某筆資格寫
 * 「符合2.3點喔~」），而且那本身也是語助詞——沒有一個福利詞以這些字結尾。
 *
 * 開頭的「那」刻意不動。句尾助詞一定是廢話，開頭的「那」不一定：高雄市那瑪夏區
 * （原住民區）就以它開頭，砍掉會把「那瑪夏的原住民補助」變成查不到的
 * 「瑪夏的原住民補助」。留著它的代價也很小——實測「長照呢」28 筆、「那長照呢」
 * 27 筆，只差 1 筆。
 */
const TRAILING_PARTICLE_PATTERN = /[呢嗎吧喔啊呀啦囉嘛耶唷\s?？!！。．，,、~～…]+$/u;

/** 砍完只剩代名詞或連接詞（「那我呢」→「那我」），那句話本來就沒有指出主題 */
const FILLER_ONLY_TEXT = /^[那這我你妳他她它們的了還有是要想能會就也都再又和跟]+$/u;

export function stripTrailingParticles(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const stripped = text.replace(TRAILING_PARTICLE_PATTERN, "").trim();
  // 砍完剩不到兩個字，代表整句話幾乎都是語助詞（「呢？」「有嗎」「酒吧」）。
  // 這時回空字串讓呼叫端放棄替換：搜尋框停在舊關鍵字，也好過被清成一片空白。
  // 門檻只到兩個字，是因為站內最常被追問的主題本來就是兩個字——長照、失智、
  // 托育、生育——要求三個字會把「長照呢」這個最典型的寫法一起擋掉。
  if (stripped.length < 2 || FILLER_ONLY_TEXT.test(stripped)) return "";
  return stripped;
}

export function isConditionOnlyText(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return false;

  const explicit = extractExplicitSearchConditions(text);
  const hasCondition = Boolean(
    explicit.area || explicit.recipient || explicit.income || explicit.identities.length
  );
  if (!hasCondition) return false;

  return stripAreaTerms(text).replace(CONDITION_ONLY_RESIDUE, "").length === 0;
}
