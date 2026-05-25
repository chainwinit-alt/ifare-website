export interface SearchOverviewStat {
  key: string;
  label: string;
  value: string;
  delta: string;
  tone: "default" | "success" | "warning" | "danger";
}

export interface SearchTrendPoint {
  label: string;
  value: number;
}

export interface SearchQueueItem {
  id: string;
  query: string;
  status: "pending" | "reviewing" | "resolved";
  searches7d: number;
  resultCount: number;
  suggestion: string;
  owner: string;
}

export interface SearchTermItem {
  id: number;
  displayTerm: string;
  normalizedTerm: string;
  termType: string;
  sourceKind: string;
  status: "active" | "inactive";
  manualBoost: number;
  baseWeight: number;
  hotScore7d: number;
  searchCount30d: number;
  lastUpdated: string;
  aliasCount: number;
  note: string;
}

export interface SearchAliasItem {
  id: number;
  termId: number;
  alias: string;
  normalizedAlias: string;
  targetTerm: string;
  targetType: string;
  matchMode: string;
  status: "active" | "inactive";
  source: string;
  updatedBy: string;
  lastUpdated: string;
  note: string;
}
