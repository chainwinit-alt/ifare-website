export interface WelfareComparePolicy {
  id: number;
  title: string;
  area?: string;
  qualification?: string;
  evidence?: string;
  welfareInfo?: string;
  officeUnitInfo?: string;
  welfareTel?: string;
  discontinuedTime?: string;
  hasIndentity?: boolean;
  hasIncome?: boolean;
  hasRecipient?: boolean;
  updatedAt: string;
}

const STORAGE_KEY = "ifare:welfare-compare:v1";
const MAX_COMPARE_ITEMS = 8;

const compareItems = ref<WelfareComparePolicy[]>([]);
let hydrated = false;

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.error("[IFare][WelfareCompare][storage]", error);
    return null;
  }
}

function normalizePolicy(policy: Partial<WelfareComparePolicy>): WelfareComparePolicy | null {
  const id = Number(policy.id);
  if (!id || !policy.title) return null;

  return {
    id,
    title: String(policy.title),
    area: policy.area ?? "",
    qualification: policy.qualification ?? "",
    evidence: policy.evidence ?? "",
    welfareInfo: policy.welfareInfo ?? "",
    officeUnitInfo: policy.officeUnitInfo ?? "",
    welfareTel: policy.welfareTel ?? "",
    discontinuedTime: policy.discontinuedTime ?? "",
    hasIndentity: Boolean(policy.hasIndentity),
    hasIncome: Boolean(policy.hasIncome),
    hasRecipient: Boolean(policy.hasRecipient),
    updatedAt: policy.updatedAt ?? new Date().toISOString(),
  };
}

function hydrateCompareItems() {
  if (hydrated) return;
  hydrated = true;

  const storage = getStorage();
  if (!storage) return;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    compareItems.value = parsed
      .map((item) => normalizePolicy(item))
      .filter((item): item is WelfareComparePolicy => Boolean(item))
      .slice(0, MAX_COMPARE_ITEMS);
  } catch (error) {
    console.error("[IFare][WelfareCompare][hydrate]", error);
  }
}

function persistCompareItems() {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(compareItems.value));
  } catch (error) {
    console.error("[IFare][WelfareCompare][persist]", error);
  }
}

export function useWelfareCompare() {
  hydrateCompareItems();

  const items = computed(() => compareItems.value);
  const count = computed(() => compareItems.value.length);

  function isSaved(id: number | string) {
    const targetId = Number(id);
    return compareItems.value.some((item) => item.id === targetId);
  }

  function addPolicy(policy: Partial<WelfareComparePolicy>) {
    const normalized = normalizePolicy({ ...policy, updatedAt: new Date().toISOString() });
    if (!normalized) return false;

    const index = compareItems.value.findIndex((item) => item.id === normalized.id);
    if (index >= 0) {
      compareItems.value.splice(index, 1, {
        ...compareItems.value[index],
        ...normalized,
      });
      persistCompareItems();
      return true;
    }

    compareItems.value.unshift(normalized);
    if (compareItems.value.length > MAX_COMPARE_ITEMS) {
      compareItems.value.splice(MAX_COMPARE_ITEMS);
    }

    persistCompareItems();
    return true;
  }

  function removePolicy(id: number | string) {
    const targetId = Number(id);
    const index = compareItems.value.findIndex((item) => item.id === targetId);
    if (index < 0) return false;

    compareItems.value.splice(index, 1);
    persistCompareItems();
    return true;
  }

  function togglePolicy(policy: Partial<WelfareComparePolicy>) {
    if (policy.id && isSaved(policy.id)) {
      return removePolicy(policy.id);
    }

    return addPolicy(policy);
  }

  function clearPolicies() {
    compareItems.value.splice(0);
    persistCompareItems();
  }

  return {
    items,
    count,
    maxItems: MAX_COMPARE_ITEMS,
    isSaved,
    addPolicy,
    removePolicy,
    togglePolicy,
    clearPolicies,
  };
}
