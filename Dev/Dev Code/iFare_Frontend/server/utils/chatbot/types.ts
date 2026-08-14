// 芒寶答案卡 — 共用型別
//
// 設計原則：回覆文字一律由基金會事先寫好（答案卡），機器只負責「選哪一張卡」，
// 不負責「生成文字」。這是語氣能 100% 固定的唯一架構保證。

export type SiteLinkKey =
  | 'home'
  | 'about'
  | 'news'
  | 'articles'
  | 'collaborator'
  | 'ifare';

export type ChatbotInternalLink = {
  label: string;
  path: string;
};

export type ChatbotCard = {
  /** 卡片代號，LLM 選卡時回傳的就是這個值 */
  id: string;
  /** 後台顯示用的標題 */
  title: string;
  /** 可能的問法，用於關鍵字比對；越長越具體的詞得分越高 */
  keywords: string[];
  /** 芒寶的回答。這句話由人撰寫、固定不變，不經過任何生成式改寫 */
  answer: string;
  /** 附帶的站內連結（最多 2 個） */
  linkKeys: SiteLinkKey[];
  /**
   * 權重。語意較廣、容易誤命中的「兜底型」卡片可調低（例如 0.85），
   * 避免壓過更具體的卡片。預設 1。
   */
  priority?: number;
  /** 是否啟用。後台可關閉單張卡而不必刪除 */
  enabled?: boolean;
  /** 排序值，供後台維護介面使用 */
  sort?: number;
};

export type CardMatch = {
  card: ChatbotCard;
  score: number;
  /** 命中的關鍵字，供除錯與後台觀察實際比對狀況 */
  hits: string[];
};

/** 回覆的來源，用於觀測各層攔截率 */
export type ChatbotReplySource =
  | 'card' // Layer 1：關鍵字比對直接命中
  | 'card_llm' // Layer 2：LLM 選卡
  | 'groq' // Layer 3：LLM 生成
  | 'gemini' // Layer 3：LLM 生成
  | 'script_fallback'; // Layer 4：罐頭兜底
