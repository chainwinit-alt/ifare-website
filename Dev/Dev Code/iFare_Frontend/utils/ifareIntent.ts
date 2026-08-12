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
