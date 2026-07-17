import type { LlmSummaryCaseItem } from "./types";

interface FarePolicyDetailApiResponse {
  result?: {
    result?: {
      id?: number;
      title?: string;
      qualification?: string | null;
      welfareInfo?: string | null;
      evidence?: string | null;
      officeUnitInfo?: string | null;
      officeUnitTel?: string | null;
      competentAuthority?: string | null;
      remark?: string | null;
    } | null;
  } | null;
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDetailText(value?: string | null) {
  if (!value) return "";
  return stripHtml(value);
}

function buildSourceSummary(detail: NonNullable<FarePolicyDetailApiResponse["result"]>["result"]) {
  if (!detail) return "";

  const parts = [
    detail.title ? `案例名稱：${detail.title}` : "",
    detail.qualification ? `適用條件：${normalizeDetailText(detail.qualification)}` : "",
    detail.welfareInfo ? `福利內容：${normalizeDetailText(detail.welfareInfo)}` : "",
    detail.evidence ? `申請證明：${normalizeDetailText(detail.evidence)}` : "",
    detail.officeUnitInfo ? `承辦單位資訊：${normalizeDetailText(detail.officeUnitInfo)}` : "",
    detail.officeUnitTel ? `聯絡電話：${normalizeDetailText(detail.officeUnitTel)}` : "",
    detail.competentAuthority ? `主管機關：${normalizeDetailText(detail.competentAuthority)}` : "",
    detail.remark ? `備註：${normalizeDetailText(detail.remark)}` : "",
  ].filter(Boolean);

  return parts.join("\n");
}

export async function enrichSummaryCases(
  cases: LlmSummaryCaseItem[],
  frontendApiServerBase: string,
  take = 6
) {
  const targetCases = cases.slice(0, take);
  if (!targetCases.length) return cases;

  const normalizedBase = frontendApiServerBase.replace(/\/$/, "");

  const enriched = await Promise.all(
    targetCases.map(async (item) => {
      try {
        const response = await $fetch<FarePolicyDetailApiResponse>(
          `${normalizedBase}/FarePolicy/GetIFarePolicyDetail`,
          {
            query: {
              farePolicyID: item.id,
            },
          }
        );

        const detail = response?.result?.result;
        if (!detail) return item;

        return {
          ...item,
          qualification: normalizeDetailText(detail.qualification) || item.qualification,
          welfareInfo: normalizeDetailText(detail.welfareInfo),
          evidence: normalizeDetailText(detail.evidence),
          officeUnitInfo: normalizeDetailText(detail.officeUnitInfo),
          officeUnitTel: normalizeDetailText(detail.officeUnitTel),
          competentAuthority: normalizeDetailText(detail.competentAuthority),
          remark: normalizeDetailText(detail.remark),
          sourceSummary: buildSourceSummary(detail),
        };
      } catch (error) {
        console.warn("[LLM][enrich]", { id: item.id, error });
        return item;
      }
    })
  );

  const enrichedById = new Map(enriched.map((item) => [item.id, item]));
  return cases.map((item) => enrichedById.get(item.id) || item);
}
