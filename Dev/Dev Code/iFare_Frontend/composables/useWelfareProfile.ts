/**
 * 目前狀態：尚未接線（截至 2026-08-26）
 * 全站 pages / components / layouts / app.vue / error.vue 全域搜尋皆無呼叫端，
 * 這支 composable 目前不會被執行，localStorage 裡也不會有 ifare:welfare-profile:v1 這筆資料。
 *
 * 它原本要做什麼：把使用者上次的福利查詢條件（政策別、身分別、地區、所得、
 * 身分標籤、關鍵字、人生事件）存進 localStorage，下次回訪時自動回填，省得重填一遍。
 * 寫入時一併記 savedAt，讀取時超過 90 天就視為過期並主動清掉，
 * 避免拿很久以前的條件誤導使用者；JSON 解析失敗也一律清除，
 * 不讓壞掉的舊格式資料一直卡在瀏覽器裡。讀寫都會經過 normalizeProfile 補齊預設值，
 * 呼叫端不必自己處理 undefined。
 *
 * 保留原因：使用者決定保留。這是規劃中尚未接上的功能，不是廢棄程式碼，
 * 日後 i-Fare 搜尋要做「記住我的查詢條件」時可直接沿用，請勿因為「查無呼叫端」就刪掉。
 */
export interface WelfareProfile {
  policy?: string;
  recipient?: string;
  area?: string;
  income?: string;
  identities?: string[];
  query?: string;
  lifeEvent?: string;
}

interface StoredWelfareProfile {
  savedAt: number;
  profile: WelfareProfile;
}

const STORAGE_KEY = 'ifare:welfare-profile:v1';
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

function normalizeProfile(profile: WelfareProfile): WelfareProfile {
  return {
    policy: profile.policy || '',
    recipient: profile.recipient || '',
    area: profile.area || '',
    income: profile.income || '',
    identities: Array.isArray(profile.identities) ? profile.identities.filter(Boolean) : [],
    query: profile.query || '',
    lifeEvent: profile.lifeEvent || '',
  };
}

export function useWelfareProfile() {
  const loadWelfareProfile = (): WelfareProfile | null => {
    if (typeof window === 'undefined') return null;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as StoredWelfareProfile;
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return normalizeProfile(parsed.profile ?? {});
    } catch (error) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  };

  const saveWelfareProfile = (profile: WelfareProfile) => {
    if (typeof window === 'undefined') return;

    const payload: StoredWelfareProfile = {
      savedAt: Date.now(),
      profile: normalizeProfile(profile),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const clearWelfareProfile = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return {
    loadWelfareProfile,
    saveWelfareProfile,
    clearWelfareProfile,
  };
}
