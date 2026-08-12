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
