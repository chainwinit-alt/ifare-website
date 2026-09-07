import { matchPolicyCategory } from "./ifareIntent";

/**
 * 條件符合度：這筆政策跟使用者「說出口的條件」有多對得上。
 *
 * 這支是摘要卡的推薦與下方結果清單共用的排序依據。兩邊各算一套的話會各說各話——
 * 實測搜「長照」再選新北市，卡片推薦的第 2、3 筆在下方清單裡排到第 9、第 8 名，
 * 而清單第 5 名是【全國】原住民醫療或社會福利資源使用交通費補助，使用者從沒說過
 * 自己是原住民。同一份結果讀起來像兩個系統在講不同的話。
 *
 * 評分看兩件事：
 * - 使用者已經說了的條件，政策明確列出那個值 → 真的對得上，加分。
 * - 使用者沒說的條件，政策卻另外要求（要某年齡、某經濟身分、某特殊身分）→ 多半用不上，扣分。
 * 地區則是在地優先、全國次之——全國性政策設籍當地同樣能申請，只是沒那麼貼身。
 */

// 「不限地區」是戶籍地下拉「不篩選」那一項的名字（原本叫「全國」，跟資料上代表
// 中央政策的「全國」撞名）。兩個都要當成「使用者沒有指定地區」。
const UNSET_CONDITION_VALUES = ["", "未指定", "全部", "全選", "不限", "不限地區", "全國"];

/** 政策資料裡代表中央政策的地區名 */
const NATIONWIDE_AREA_LABEL = "全國";

export function isUnsetPolicyCondition(value?: string) {
  return UNSET_CONDITION_VALUES.includes(String(value ?? "").trim());
}

function normalizeText(value: string) {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{Script=Han}a-z0-9]/giu, "");
}

/** 政策標記的某一項條件裡，有沒有使用者選的那個值（「全選」是沒有限制，不算符合） */
export function policyDeclares(names: string[] | undefined, wanted?: string) {
  const target = normalizeText(wanted || "");
  if (!target) return false;
  return (names || [])
    .filter((name) => name !== "全選")
    .some((name) => {
      const normalized = normalizeText(name);
      return normalized === target || normalized.includes(target) || target.includes(normalized);
    });
}

/** 排序需要知道的政策條件標記 */
export type PolicyConditionFacts = {
  area?: string;
  policyCategory?: string;
  recipientNames?: string[];
  incomeNames?: string[];
  identityNames?: string[];
  hasRecipient?: boolean;
  hasIncome?: boolean;
  hasIndentity?: boolean;
};

/** 使用者目前說出口的條件（篩選器上真的套了的，加上關鍵字） */
export type PolicyConditionContext = {
  policy?: string;
  recipient?: string;
  area?: string;
  income?: string;
  identity?: string;
  query?: string;
};

export function scorePolicyConditionFit(
  item: PolicyConditionFacts,
  context?: PolicyConditionContext
) {
  if (!context) return 0;

  let score = 0;
  const area = String(context.area || "").trim();
  if (!isUnsetPolicyCondition(area)) {
    const itemArea = normalizeText(item.area || "");
    if (itemArea && itemArea === normalizeText(area)) score += 6;
    else if (String(item.area || "").trim() === NATIONWIDE_AREA_LABEL) score += 3;
  }

  if (!isUnsetPolicyCondition(context.recipient)) {
    if (policyDeclares(item.recipientNames, context.recipient)) score += 5;
  } else if (item.hasRecipient) {
    score -= 3;
  }

  if (!isUnsetPolicyCondition(context.income)) {
    if (policyDeclares(item.incomeNames, context.income)) score += 5;
  } else if (item.hasIncome) {
    score -= 3;
  }

  if (!isUnsetPolicyCondition(context.identity)) {
    if (policyDeclares(item.identityNames, context.identity)) score += 5;
  } else if (item.hasIndentity) {
    // 沒宣告身分卻要求身分：扣得比年齡、經濟重一些。實測【全國】原住民醫療或社會
    // 福利資源使用交通費補助會排在新北市自己的失能老人日間照顧前面，就是這一項。
    score -= 6;
  }

  // 類別對得上就加分。使用者沒選「受助者情況」時，用關鍵字推出來的類別當參考——
  // 搜「長照」推得出「長期照顧」，而【全國】照顧服務就業獎勵屬「勞工福利」（那是
  // 給照服員的就業獎勵，不是給被照顧者的服務），資料本身就分得出來。
  // 只加分不扣分：老人收容安置補助屬「老人福利」、身障臨短照屬「身心障礙福利」，
  // 它們同樣是長照範疇，罰下去反而會把該推的推掉。
  const wantedCategory = !isUnsetPolicyCondition(context.policy)
    ? String(context.policy || "")
    : matchPolicyCategory(context.query);
  if (
    wantedCategory &&
    item.policyCategory &&
    normalizeText(item.policyCategory) === normalizeText(wantedCategory)
  ) {
    score += 4;
  }

  return score;
}

/**
 * 「主題太窄、跟這次查詢無關」的守衛。
 *
 * 有些政策專屬於一個很窄的主題（假牙、托育），關鍵字分數卻可能因為共用詞
 * 而衝很高。實測搜「跌倒」選桃園市，【桃園市】65歲以上長者裝置活動假牙補助計畫
 * 因為資格欄位裡有「輔具」而被當成相關的在地政策推到第三名；搜「失業補助」選高雄市，
 * 【高雄市】弱勢兒童及少年生活扶助被推到第一名。兩者跟使用者要找的事都無關。
 *
 * 規則：使用者自己沒提到那個窄主題，就不推該主題專屬的政策。
 * 摘要卡（referenceCases）與結果清單排序共用這一份，兩邊才不會排出不同結果。
 */
const OVER_SPECIFIC_TOPIC_GUARDS: Array<{ allowedBy: RegExp; blockedInPolicy: RegExp }> = [
  { allowedBy: /牙|假牙|口腔|牙科|齒/u, blockedInPolicy: /牙|假牙|口腔|牙科|齒/u },
  {
    allowedBy: /托育|幼兒|兒童|青少年|兒少|育兒|生育|早療/u,
    blockedInPolicy: /托育|幼兒|兒童|青少年|兒少|育兒|生育|早療/u,
  },
];

/** 判斷用的政策全文：標題、地區、資格與明細欄位串起來 */
export function buildPolicyIntentText(fields: Array<string | undefined | null>) {
  return fields.filter(Boolean).join(" ");
}

export function isOverSpecificPolicyForIntent(policyText: string, intentText: string) {
  const intent = normalizeText(intentText || "");
  const policy = normalizeText(policyText || "");

  return OVER_SPECIFIC_TOPIC_GUARDS.some(
    (guard) => !guard.allowedBy.test(intent) && guard.blockedInPolicy.test(policy)
  );
}
