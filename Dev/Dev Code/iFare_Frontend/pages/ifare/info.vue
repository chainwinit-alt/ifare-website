<template>
  <div class="app-body-child" :name="$route.name">
    <div class="section-list">
      <section class="section-top">
        <h1 class="info-title">{{ _welfareItem.title }}</h1>
        <div class="date-group">
          <label class="date-release">{{ formatDisplayDate(_welfareItem.releaseTime) }}</label>
          <label class="date-update">{{ formatDisplayDate(_welfareItem.updateTime) }}</label>
          <label class="article-num">{{ _welfareItem.id }}</label>
          <label
            v-if="deadlineInfo"
            class="deadline-badge"
            :class="`deadline-badge--${deadlineInfo.level}`"
          >{{ deadlineInfo.label }}</label>
        </div>
      </section>
      <section class="section-body">
        <div class="card-info">
          <div class="share-bar" role="group" aria-label="分享此福利">
            <button
              class="btn-ic-share btn-share-line"
              type="button"
              @click="shareCurrentUrlToLine"
              aria-label="分享到 LINE"
            >
              <i class="ic-line" aria-hidden="true"></i>
            </button>
            <button
              class="btn-ic-share btn-share-fb"
              type="button"
              @click="shareCurrentUrlToFacebook"
              aria-label="分享到 Facebook"
            >
              <i class="ic-facebook" aria-hidden="true"></i>
            </button>
            <button
              class="btn-ic-share btn-share-email"
              type="button"
              @click="shareCurrentUrlToEmail"
              aria-label="用 Email 分享"
            >
              <span class="share-label">Email</span>
            </button>
            <button
              class="btn-ic-share btn-share-copy"
              :class="{ 'is-copied': copyToastVisible }"
              type="button"
              @click="onCopyUrl"
              :aria-label="copyToastVisible ? '已複製連結' : '複製連結'"
            >
              <span class="share-label">{{ copyToastVisible ? '✓ 已複製' : '複製連結' }}</span>
            </button>
            <button
              class="btn-compare-save"
              :class="{ 'is-saved': isCurrentSaved }"
              type="button"
              :aria-pressed="isCurrentSaved"
              @click="ToggleCurrentCompare"
            >
              {{ isCurrentSaved ? '已收藏比較' : '收藏比較' }}
            </button>
            <NuxtLink v-if="compareCount > 0" class="btn-compare-link" to="/ifare/compare">
              比較 {{ compareCount }}
            </NuxtLink>
          </div>
          <div class="apply-helper" aria-labelledby="apply-helper-title">
            <div class="title-component">
              <i class="ic-title-pattern"></i>
              <h2 id="apply-helper-title" class="comp-title">申請路徑助手</h2>
            </div>
            <div class="apply-helper-grid">
              <div class="apply-helper-card">
                <strong>1. 先看是否符合</strong>
                <span>{{ qualificationSummary }}</span>
              </div>
              <div class="apply-helper-card">
                <strong>2. 準備文件</strong>
                <span>{{ documentChecklist.length > 0 ? `已整理 ${documentChecklist.length} 項可能文件` : '請先查看應備文件說明' }}</span>
              </div>
              <div class="apply-helper-card">
                <strong>3. 確認承辦窗口</strong>
                <span>{{ displayOfficeUnitInfo || '請洽承辦單位確認申請細節' }}</span>
              </div>
              <div class="apply-helper-card">
                <strong>4. 留意期限</strong>
                <span>{{ deadlineInfo?.label || '目前未顯示 30 天內截止提醒' }}</span>
              </div>
            </div>
          </div>
          <div class="part-info-list">
            <div class="part part-qualify">
              <div class="title-component">
                <i class="ic-title-pattern"></i>
                <h2 class="comp-title">申請資格</h2>
              </div>
              <div class="info-content info-content--plain" v-html="useSanitize(renderPlainText(_welfareItem.qualification))"></div>
            </div>
            <div class="part part-welfare">
              <div class="title-component">
                <i class="ic-title-pattern"></i>
                <h2 class="comp-title">福利內容</h2>
              </div>
              <div
                class="raw-html info-content"
                v-html="useSanitize(_welfareItem.welfareInfo)"
              ></div>
            </div>
            <div class="part part-evidence">
              <div class="title-component">
                <i class="ic-title-pattern"></i>
                <h2 class="comp-title">應備證件資料</h2>
              </div>
              <ul v-if="documentChecklist.length > 0" class="document-checklist">
                <li v-for="item in documentChecklist" :key="item.id">
                  <label>
                    <input type="checkbox" />
                    <span>{{ item.text }}</span>
                  </label>
                </li>
              </ul>
              <div class="info-content info-content--plain" v-html="useSanitize(renderPlainText(_welfareItem.evidence))"></div>
            </div>
            <div class="part part-remark" v-if="_welfareItem.remark">
              <div class="title-component">
                <i class="ic-title-pattern"></i>
                <h2 class="comp-title">備註</h2>
              </div>
              <div class="info-content info-content--plain" v-html="useSanitize(renderPlainText(_welfareItem.remark))"></div>
            </div>
            <div class="part part-office">
              <div class="bg-office"></div>
              <div class="title-component">
                <i class="ic-title-pattern"></i>
                <h2 class="comp-title">洽辦單位</h2>
              </div>
              <div class="info-content">
                <span class="info-label" :class="{ 'info-label-tel': _welfareItem.welfareTel }">
                  {{ displayOfficeUnitInfo }}
                  <a :href="'tel:'+_welfareItem.welfareTel" class="info-tel" v-if="_welfareItem.welfareTel">{{ _welfareItem.welfareTelStr }}</a>
                </span>
                <a
                  :href="'tel:'+_welfareItem.welfareTel"
                  class="btn-icon btn-go"
                  v-if="_welfareItem.welfareTel"
                  :aria-label="`撥打電話 ${_welfareItem.welfareTelStr}`"
                >
                  <i class="ic-phone" aria-hidden="true"></i>
                </a>
                <button
                  class="btn-icon btn-go"
                  type="button"
                  v-if="_welfareItem.officeUnitID != 1"
                  @click="JumpTo(_welfareItem.officeUnitID)"
                  aria-label="查看洽辦單位詳情"
                >
                  <i class="ic-arrow-right-orange" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="section-relation">
        <div class="relation-links">
          <h2 class="relation-title">相關福利</h2>
          <ul class="list-unstyled relation-list">
            <li class="relation-item transition-general" v-for="_welfare in iFarePolicyList">
              <NuxtLink
                  :to="{
                    path: '/ifare/info',
                    query: { id: _welfare.id },
                  }"
                >
                <h3 class="link-title">{{ _welfare.title }}</h3>
                <p class="relation-reason">{{ getRelationReason(_welfare) }}</p>
                <div class="relation-item-bottom">
                  <ul class="list-unstyled filter-list">
                    <li name="area">{{ _welfare.area }}</li>
                    <li name="qualify">
                      <span :class="{remark: _welfare.hasRecipient}">{{_welfare.hasRecipient ? '有' : '無'}}</span>年齡限制、
                      <span :class="{remark: _welfare.hasIncome}">{{ _welfare.hasIncome ? '有' : '無' }}</span>經濟限制、
                      <span :class="{remark: _welfare.hasIndentity}">{{ _welfare.hasIndentity ? '有' : '無' }}</span>特殊身分
                    </li>
                  </ul>
                  <NuxtLink
                    :to="{
                      path: '/ifare/info',
                      query: { id: _welfare.id },
                    }"
                    class="ic-arrow-right link-url transition-general"
                  ></NuxtLink>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: "ifare",
  toLinkName: "i-Fare",
  toLink: "/ifare",
});

// 福利政策資格預覽截斷長度（字元數）
const QUALIFICATION_PREVIEW_LENGTH = 50;

const { $WebApiGet } = useNuxtApp();
const { getApiResultValue } = useApiResult();
const { shareCurrentUrlToLine } = useShareToLine();
const { shareCurrentUrlToFacebook, shareCurrentUrlToEmail, copyCurrentUrl } = useShareUrl();
const { formatDisplayDate } = useDateFormatter();
const { getDeadlineInfo } = usePolicyDeadline();
const { parseDocumentChecklist } = useDocumentChecklist();
const {
  count: compareCount,
  isSaved: isCompareSaved,
  addPolicy: addComparePolicy,
  togglePolicy: toggleComparePolicy,
} = useWelfareCompare();
const route = useRoute();
const $router = useRouter();

const copyToastVisible = ref(false);
let copyToastTimer: ReturnType<typeof setTimeout> | null = null;

async function onCopyUrl() {
  const ok = await copyCurrentUrl();
  if (!ok) return;
  if (copyToastTimer) clearTimeout(copyToastTimer);
  copyToastVisible.value = true;
  copyToastTimer = setTimeout(() => {
    copyToastVisible.value = false;
  }, 2000);
}

onBeforeUnmount(() => {
  if (copyToastTimer) clearTimeout(copyToastTimer);
});

function JumpTo(id: any) {
  if (id == 1) return false;
  $router.push({ path: "/ifare/contact", query: { id: id } });
}

interface infoItem {
  id: number;
  title: string;
  area: string;
  qualification: string;
  evidence: string;
  remark: string;
  welfareInfo: string;
  welfareTel: string;
  welfareTelStr: string;
  releaseTime: string;
  discontinuedTime: string;
  updateTime: string;
  officeUnitInfo: string;
  officeUnitID: number;
  codeDomicileID: number;
  codePolicyID: number;
  codeIdentityIDs: number[];
  codeIncomeIDs: number[];
  codeRecipientIDs: number[];
}

const _welfareItem = reactive<infoItem>({
  id: 0,
  title: "",
  area: "",
  qualification: "",
  evidence: "",
  remark: "",
  welfareInfo: "",
  welfareTel: "",
  welfareTelStr: "",
  releaseTime: "",
  discontinuedTime: "",
  updateTime: "",
  officeUnitInfo: "",
  officeUnitID: 0,
  codeDomicileID: 0,
  codePolicyID: 0,
  codeIdentityIDs: [],
  codeIncomeIDs: [],
  codeRecipientIDs: [],
});

// Office Unit
interface OfficeUnitItem {
  id: number;
  title: string;
}

const officeList = reactive<Array<OfficeUnitItem>>([]);
const displayOfficeUnitInfo = computed(
  () =>
    _welfareItem.officeUnitInfo ||
    officeList.find((p) => p.id == _welfareItem.officeUnitID)?.title ||
    ""
);
const deadlineInfo = computed(() => getDeadlineInfo(_welfareItem.discontinuedTime));
const documentChecklist = computed(() => parseDocumentChecklist(_welfareItem.evidence));
const qualificationSummary = computed(() => {
  const text = (_welfareItem.qualification ?? '').replace(/<[^>]+>/g, '').trim();
  if (!text) return '請先查看申請條件說明';
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
});
const isCurrentSaved = computed(() => _welfareItem.id > 0 && isCompareSaved(_welfareItem.id));

function getCurrentComparePolicy() {
  return {
    id: _welfareItem.id,
    title: _welfareItem.title,
    area: _welfareItem.area,
    qualification: _welfareItem.qualification,
    evidence: _welfareItem.evidence,
    welfareInfo: _welfareItem.welfareInfo,
    officeUnitInfo: displayOfficeUnitInfo.value,
    welfareTel: _welfareItem.welfareTelStr,
    discontinuedTime: _welfareItem.discontinuedTime,
    hasIndentity: _welfareItem.codeIdentityIDs.length > 0 && !_welfareItem.codeIdentityIDs.includes(1),
    hasIncome: _welfareItem.codeIncomeIDs.length > 0 && !_welfareItem.codeIncomeIDs.includes(1),
    hasRecipient: _welfareItem.codeRecipientIDs.length > 0 && !_welfareItem.codeRecipientIDs.includes(1),
  };
}

function ToggleCurrentCompare() {
  if (!_welfareItem.id) return;
  toggleComparePolicy(getCurrentComparePolicy());
}

async function loadOfficeList() {
  const res: any = await $WebApiGet("/FareOfficeUnit/GetIFareOfficeUnitList");
  const _data = getApiResultValue<any>(res);
  if (!Array.isArray(_data)) return;

  officeList.splice(
    0,
    officeList.length,
    ..._data.map((item: any) => ({
      id: item.id,
      title: item.title,
    }))
  );
}

function resetWelfareItem() {
  _welfareItem.id = 0;
  _welfareItem.title = "";
  _welfareItem.area = "";
  _welfareItem.qualification = "";
  _welfareItem.evidence = "";
  _welfareItem.remark = "";
  _welfareItem.welfareInfo = "";
  _welfareItem.welfareTel = "";
  _welfareItem.welfareTelStr = "";
  _welfareItem.releaseTime = "";
  _welfareItem.discontinuedTime = "";
  _welfareItem.updateTime = "";
  _welfareItem.officeUnitInfo = "";
  _welfareItem.officeUnitID = 0;
  _welfareItem.codeDomicileID = 0;
  _welfareItem.codePolicyID = 0;
  _welfareItem.codeIdentityIDs = [];
  _welfareItem.codeIncomeIDs = [];
  _welfareItem.codeRecipientIDs = [];
}

function decodeWelfareHtml(value: string) {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch (error) {
    console.error("[IFare][decodeWelfareHtml]", error);
    return value;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderPlainText(value: string) {
  let text = (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/費用用/g, "費用")
    .trim();

  for (let i = 0; i < 8; i += 1) {
    const next = text
      .replace(/\n+([（(]?[一二三四五六七八九十\d]+[）)])\n+/g, "\n$1 ")
      .replace(/：\n+(及(?:應備文件|額度))/g, "$1")
      .replace(/([^\n]{1,240}[為以])\n+([0-9,]+元)\n+([。；，、])/g, "$1$2$3")
      .replace(/([^\n]{1,240}(?:每案|每人|每月|每日))\n+((?:全年|最高)[^\n]{1,120})/g, "$1$2")
      .replace(/([^\n]{1,240}[，、])\n+((?:每人|每案|全年|每日|每月|最高)[^\n]{1,120})/g, "$1$2")
      .replace(/([^\n]{1,240}(?:[0-9,]+元|最高補助[^\n]{0,80}|最高以[^\n]{0,80}|補助金額[^\n]{0,80}|實支實付[^\n]{0,80}))\n+(為限。?|為準。?|為原則。?)/g, "$1$2")
      .replace(/\n+([0-9,]+元)\n+([。；，、])/g, "\n$1$2")
      .replace(/\n+((?:每人|每案|全年|每日|每月|最高)[^\n]{1,80})\n+(為限。?)/g, "\n$1$2")
      .replace(/([^\n]{1,240})\n+([，、][^\n]{1,120})/g, "$1$2")
      .replace(/([^\n。；：！？…]{4,240})\n+((?:補助|依|以|並|且|申請|檢據|核實|實支實付|實報實銷|得|應|可)[^\n]{1,160})/g, "$1$2");

    if (next === text) break;
    text = next;
  }

  if (!text) return "";
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function normalizeWelfareHtml(value: string) {
  let html = decodeWelfareHtml(value)
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "")
    .replace(/<br\s*\/?>/gi, "<br>")
    .replace(/<p>\s*<\/p>/gi, "");

  // The source HTML is often split into many tiny <p> blocks, so we merge the
  // most common broken sentence patterns back into readable paragraphs.
  const mergeRules: Array<[RegExp, string]> = [
    [/<p>([^<]{1,120}：)<\/p>\s*<p>(及[^<]{1,40})<\/p>/g, "<p>$1$2</p>"],
    [/<p>([（(]?[一二三四五六七八九十\d]+[）)])<\/p>\s*<p>([^<]{1,100})<\/p>/g, "<p>$1 $2</p>"],
    [/<p>([^<]{1,240}[，、：:])<\/p>\s*<p>((?:每人|每案|全年|每日|每月|最高|補助|核實|依實際|以實報實銷|檢據實報實銷)[^<]{1,100})<\/p>/g, "<p>$1$2</p>"],
    [/<p>([^<]{1,240}[為以])<\/p>\s*<p>([0-9,]+元)<\/p>\s*<p>([。；，、])<\/p>/g, "<p>$1$2$3</p>"],
    [/<p>([^<]{1,240}(?:[0-9,]+元|最高補助[^<]{0,80}|最高以[^<]{0,80}|補助金額[^<]{0,80}|實支實付[^<]{0,80}))<\/p>\s*<p>(為限。?|為準。?|為原則。?)<\/p>/g, "<p>$1$2</p>"],
    [/<p>([^<]{1,240}(?:每案|每人|每月|每日))<\/p>\s*<p>((?:全年|最高)[^<]{1,120})<\/p>/g, "<p>$1$2</p>"],
    [/<p>([^<]{1,240}[，、])<\/p>\s*<p>((?:每人|每案|全年|每日|每月|最高)[^<]{1,120})<\/p>/g, "<p>$1$2</p>"],
    [/<p>([^<]{1,240}[，、])<\/p>\s*<p>(每人[^<]{1,80}|每案[^<]{1,80}|全年[^<]{1,80}|每日[^<]{1,80}|每月[^<]{1,80})<\/p>\s*<p>(為限。?)<\/p>/g, "<p>$1$2$3</p>"],
    [/<p>([^<]{1,240})<\/p>\s*<p>([，、][^<]{1,120})<\/p>/g, "<p>$1$2</p>"],
    [/<p>([^<。；：！？…]{4,240})<\/p>\s*<p>((?:補助|依|以|並|且|申請|檢據|核實|實支實付|實報實銷|得|應|可)[^<]{1,160})<\/p>/g, "<p>$1$2</p>"],
    [/<p>([^<]{1,240})<\/p>\s*<p>(及應備文件|及額度)<\/p>/g, "<p>$1$2</p>"],
    [/<\/p>\s*<p>([。；，、：])<\/p>/g, "$1</p>"],
    [/<p>([^<]{1,240}(?:附件下載|相關附件))：?<\/p>\s*((?:<li>.*?<\/li>\s*){1,50})(?=<p>|$)/gs, "<p>$1：</p><ul>$2</ul>"],
  ];

  for (let i = 0; i < 10; i += 1) {
    let next = html;
    for (const [pattern, replacement] of mergeRules) {
      next = next.replace(pattern, replacement);
    }

    next = next
      .replace(/<br>\s*<br>/g, "<br>")
      .replace(/<\/ul>\s*<ul>/g, "")
      .replace(/：及/g, "及")
      .replace(/費用用/g, "費用");

    if (next === html) break;
    html = next;
  }

  return html.replaceAll(
    "https://drive.google.com/uc?export=download&",
    "https://drive.google.com/thumbnail?sz=w800&"
  );
}

let detailRequestToken = 0;
async function loadPolicyDetail(infoID: number) {
  if (!infoID) {
    resetWelfareItem();
    return;
  }

  const requestToken = ++detailRequestToken;
  resetWelfareItem();

  const res: any = await $WebApiGet("/FarePolicy/GetIFarePolicyDetail", {
    farePolicyID: infoID,
  });
  const _data = getApiResultValue<any>(res);
  if (!_data || requestToken !== detailRequestToken) return;

  _welfareItem.id = _data.id;
  _welfareItem.title = _data.title;
  _welfareItem.area = _data.codeDomicile_LabelName ?? "";
  _welfareItem.qualification = _data.qualification;
  _welfareItem.evidence = _data.evidence;
  _welfareItem.remark = _data.remark ?? "";
  _welfareItem.welfareInfo = normalizeWelfareHtml(_data.welfareInfo);
  _welfareItem.welfareTel = _data.officeUnitTel
    ? _data.officeUnitTel.indexOf("分機") >= 0
      ? `${_data.officeUnitTel.replace("分機", ",")}%23`
      : _data.officeUnitTel
    : "";
  _welfareItem.welfareTelStr = _data.officeUnitTel ?? "";
  _welfareItem.releaseTime = _data.releaseTime;
  _welfareItem.discontinuedTime = _data.discontinuedTime;
  _welfareItem.updateTime = _data.updateTime;
  _welfareItem.officeUnitInfo = _data.officeUnitInfo ?? "";
  _welfareItem.officeUnitID = _data.iFareOfficeUnitID ?? 0;
  _welfareItem.codeDomicileID = _data.codeDomicile_ID ?? 0;
  _welfareItem.codePolicyID = _data.codePolicy_ID ?? 0;
  _welfareItem.codeIdentityIDs = Array.isArray(_data.codeIdentityList) ? _data.codeIdentityList.map((p: any) => Number(p.id)) : [];
  _welfareItem.codeIncomeIDs = Array.isArray(_data.codeIncomeList) ? _data.codeIncomeList.map((p: any) => Number(p.id)) : [];
  _welfareItem.codeRecipientIDs = Array.isArray(_data.codeRecipientList) ? _data.codeRecipientList.map((p: any) => Number(p.id)) : [];
  if (isCompareSaved(_welfareItem.id)) {
    addComparePolicy(getCurrentComparePolicy());
  }
}

interface iFarePolicyItem {
  id: number;
  title: string;
  qualification: string;
  area: string;
  hasIndentity: boolean;
  hasIncome: boolean;
  hasRecipient: boolean;
  codeDomicileID: number;
  codePolicyID: number;
  codeIdentityIDs: number[];
  codeIncomeIDs: number[];
  codeRecipientIDs: number[];
}

const iFarePolicyList = reactive<Array<iFarePolicyItem>>([]);

function hasAnyIntersection(source: number[], target: number[]) {
  return source.some((id) => id !== 1 && target.includes(id));
}

function getRelationReason(item: iFarePolicyItem) {
  const reasons: string[] = [];
  if (item.codeDomicileID && item.codeDomicileID === _welfareItem.codeDomicileID) reasons.push('同地區');
  if (item.codePolicyID && item.codePolicyID === _welfareItem.codePolicyID) reasons.push('同類型');
  if (hasAnyIntersection(item.codeRecipientIDs, _welfareItem.codeRecipientIDs)) reasons.push('年齡條件相近');
  if (hasAnyIntersection(item.codeIncomeIDs, _welfareItem.codeIncomeIDs)) reasons.push('經濟條件相近');
  if (hasAnyIntersection(item.codeIdentityIDs, _welfareItem.codeIdentityIDs)) reasons.push('身分條件相近');
  return reasons.length > 0 ? `推薦理由：${reasons.slice(0, 3).join('、')}` : '推薦理由：可作為補充方案參考';
}

let relationRequestToken = 0;
async function loadRelationList(infoID: number) {
  const requestToken = ++relationRequestToken;
  iFarePolicyList.splice(0, iFarePolicyList.length);
  if (!infoID) return;

  const res: any = await $WebApiGet("/FarePolicy/GetIFarePolicyRelation", {
    farePolicyID: infoID,
  });
  const _data = getApiResultValue<any>(res);
  if (!Array.isArray(_data) || requestToken !== relationRequestToken) return;

  iFarePolicyList.push(
    ..._data.map((item: any) => ({
      id: item.id,
      title: item.title,
      qualification: `${(item.qualification ?? "").slice(0, QUALIFICATION_PREVIEW_LENGTH)}...`,
      area: item.codeDomicile_LabelName,
      hasIndentity: item.codeIdentityList.findIndex((p: any) => p.id == 1) < 0,
      hasIncome: item.codeIncomeList.findIndex((p: any) => p.id == 1) < 0,
      hasRecipient: item.codeRecipientList.findIndex((p: any) => p.id == 1) < 0,
      codeDomicileID: item.codeDomicile_ID ?? 0,
      codePolicyID: item.codePolicy_ID ?? 0,
      codeIdentityIDs: Array.isArray(item.codeIdentityList) ? item.codeIdentityList.map((p: any) => Number(p.id)) : [],
      codeIncomeIDs: Array.isArray(item.codeIncomeList) ? item.codeIncomeList.map((p: any) => Number(p.id)) : [],
      codeRecipientIDs: Array.isArray(item.codeRecipientList) ? item.codeRecipientList.map((p: any) => Number(p.id)) : [],
    }))
  );
}

loadOfficeList();

watch(
  () => [Number(route.query.id || 0), String(route.query.reload ?? "")] as const,
  async ([infoID]) => {
    await Promise.all([loadPolicyDetail(infoID), loadRelationList(infoID)]);
  },
  { immediate: true }
);

</script>

<style scoped>
.share-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.btn-compare-save,
.btn-compare-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(234, 85, 4, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #c84804;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
}

.btn-compare-save.is-saved {
  border-color: rgba(35, 84, 71, 0.28);
  background: #eef6f4;
  color: #235447;
}

.btn-compare-link {
  border-color: rgba(44, 80, 97, 0.2);
  color: #1f3640;
}

.info-content--plain {
  line-height: 2;
}

.raw-html:deep(p) {
  margin: 0 0 12px;
  line-height: 2;
}

.raw-html:deep(ul) {
  margin: 0 0 12px;
  padding-left: 1.25rem;
}

.raw-html:deep(li) {
  margin-bottom: 6px;
}

.raw-html:deep(a) {
  word-break: break-word;
}

.deadline-badge {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 6px;
  background: #eef6f4;
  color: #235447;
  font-weight: 700;
}

.deadline-badge--soon {
  background: #fff5df;
  color: #8a5700;
}

.deadline-badge--urgent {
  background: #ffe8e2;
  color: #9f2f13;
}

.apply-helper {
  margin: 0 0 24px;
  padding: 20px;
  border: 1px solid rgba(44, 80, 97, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
}

.apply-helper-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.apply-helper-card {
  display: flex;
  min-height: 104px;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 8px;
  background: #f7faf9;
  line-height: 1.55;
}

.apply-helper-card strong {
  color: #1f3640;
}

.apply-helper-card span {
  color: #52616b;
}

.document-checklist {
  display: grid;
  gap: 10px;
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
}

.document-checklist label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f7faf9;
  line-height: 1.6;
}

.document-checklist input {
  margin-top: 6px;
}

.relation-reason {
  margin: 6px 0 0;
  color: #52616b;
  font-size: 0.92rem;
  line-height: 1.5;
}

@media (max-width: 960px) {
  .apply-helper-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .apply-helper-grid {
    grid-template-columns: 1fr;
  }
}
</style>
