<template>
  <div class="app-body-child" :name="$route.name">
    <div class="section-list">
      <section class="section-top">
        <h1 class="info-title">{{ _welfareItem.title }}</h1>
        <div class="date-group">
          <label class="date-release">{{ _welfareItem.releaseTime }}</label>
          <label class="date-update">{{ _welfareItem.updateTime }}</label>
          <label class="article-num">{{ _welfareItem.id }}</label>
        </div>
      </section>
      <section class="section-body">
        <div class="card-info">
          <button class="btn-icon btn-ic-share" @click="ShareWebUrlToLine">
            <i class="ic-share"></i>
          </button>
          <div class="part-info-list">
            <div class="part part-qualify">
              <div class="title-component">
                <i class="ic-title-pattern"></i>
                <h3 class="comp-title">申請資格</h3>
              </div>
              <div class="info-content info-content--plain" v-html="renderPlainText(_welfareItem.qualification)"></div>
            </div>
            <div class="part part-welfare">
              <div class="title-component">
                <i class="ic-title-pattern"></i>
                <h3 class="comp-title">福利內容</h3>
              </div>
              <div
                class="raw-html info-content"
                v-html="_welfareItem.welfareInfo"
              ></div>
            </div>
            <div class="part part-evidence">
              <div class="title-component">
                <i class="ic-title-pattern"></i>
                <h3 class="comp-title">應備證件資料</h3>
              </div>
              <div class="info-content info-content--plain" v-html="renderPlainText(_welfareItem.evidence)"></div>
            </div>
            <div class="part part-remark" v-if="_welfareItem.remark">
              <div class="title-component">
                <i class="ic-title-pattern"></i>
                <h3 class="comp-title">備註</h3>
              </div>
              <div class="info-content info-content--plain" v-html="renderPlainText(_welfareItem.remark)"></div>
            </div>
            <div class="part part-office">
              <div class="bg-office"></div>
              <div class="title-component">
                <i class="ic-title-pattern"></i>
                <h3 class="comp-title">洽辦單位</h3>
              </div>
              <div class="info-content" :class="{'cursor-pointer': _welfareItem.officeUnitID != 1}" @click="JumpTo(_welfareItem.officeUnitID)">
                <label :class="{'cursor-pointer': _welfareItem.officeUnitID != 1, 'info-label-tel': _welfareItem.welfareTel}">
                  {{ displayOfficeUnitInfo }}
                  <a :href="'tel:'+_welfareItem.welfareTel" class="info-tel" v-if="_welfareItem.welfareTel">{{ _welfareItem.welfareTelStr }}</a>
                </label>
                <a :href="'tel:'+_welfareItem.welfareTel" class="btn-icon btn-go" v-if="_welfareItem.welfareTel">
                  <i class="ic-phone"></i>
                </a>
                <button class="btn-icon btn-go" v-if="_welfareItem.officeUnitID != 1">
                  <i class="ic-arrow-right-orange"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="section-relation">
        <div class="relation-links">
          <h5 class="relation-title">相關福利</h5>
          <ul class="list-unstyled relation-list">
            <li class="relation-item transition-general" v-for="_welfare in iFarePolicyList">
              <NuxtLink
                  :to="{
                    path: '/ifare/info',
                    query: { id: _welfare.id, reload: '' },
                  }"
                >
                <h6 class="link-title">{{ _welfare.title }}</h6>
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
                      query: { id: _welfare.id, reload: '' },
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
const { $WebApiGet } = useNuxtApp();
const route = useRoute();
const $router = useRouter();

function JumpTo(id: any) {
  if (id == 1) return false;
  $router.push({ path: "/ifare/contact", query: { id: id } });
}

interface infoItem {
  id: number;
  title: string;
  qualification: string;
  evidence: string;
  remark: string;
  welfareInfo: string;
  welfareTel: string;
  welfareTelStr: string;
  releaseTime: string;
  updateTime: string;
  officeUnitInfo: string;
  officeUnitID: number;
}

const _welfareItem = reactive<infoItem>({
  id: 0,
  title: "",
  qualification: "",
  evidence: "",
  remark: "",
  welfareInfo: "",
  welfareTel: "",
  welfareTelStr: "",
  releaseTime: "",
  updateTime: "",
  officeUnitInfo: "",
  officeUnitID: 0,
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

async function loadOfficeList() {
  const res: any = await $WebApiGet("/FareOfficeUnit/GetIFareOfficeUnitList");
  const _data = res?.result?.result;
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
  _welfareItem.qualification = "";
  _welfareItem.evidence = "";
  _welfareItem.remark = "";
  _welfareItem.welfareInfo = "";
  _welfareItem.welfareTel = "";
  _welfareItem.welfareTelStr = "";
  _welfareItem.releaseTime = "";
  _welfareItem.updateTime = "";
  _welfareItem.officeUnitInfo = "";
  _welfareItem.officeUnitID = 0;
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
    .trim();

  for (let i = 0; i < 8; i += 1) {
    const next = text
      .replace(/\n([（(]?[一二三四五六七八九十\d]+[）)])\n/g, "\n$1 ")
      .replace(/：\n(及(?:應備文件|額度))/g, "$1")
      .replace(/([^\n]{1,240}[為以])\n([0-9,]+元)\n([。；，、])/g, "$1$2$3")
      .replace(/([^\n]{1,240}(?:每案|每人|每月|每日))\n((?:全年|最高)[^\n]{1,120})/g, "$1$2")
      .replace(/\n([0-9,]+元)\n([。；，、])/g, "\n$1$2")
      .replace(/\n((?:每人|每案|全年|每日|每月|最高)[^\n]{1,80})\n(為限。?)/g, "\n$1$2")
      .replace(/([^\n]{1,240})\n([，、][^\n]{1,120})/g, "$1$2");

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
    [/<p>([^<]{1,240}[，、])<\/p>\s*<p>(每人[^<]{1,80}|每案[^<]{1,80}|全年[^<]{1,80}|每日[^<]{1,80}|每月[^<]{1,80})<\/p>\s*<p>(為限。?)<\/p>/g, "<p>$1$2$3</p>"],
    [/<p>([^<]{1,240})<\/p>\s*<p>([，、][^<]{1,120})<\/p>/g, "<p>$1$2</p>"],
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
  const _data = res?.result?.result;
  if (!_data || requestToken !== detailRequestToken) return;

  _welfareItem.id = _data.id;
  _welfareItem.title = _data.title;
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
  _welfareItem.updateTime = _data.updateTime;
  _welfareItem.officeUnitInfo = _data.officeUnitInfo ?? "";
  _welfareItem.officeUnitID = _data.iFareOfficeUnitID ?? 0;
}

interface iFarePolicyItem {
  id: number;
  title: string;
  qualification: string;
  area: string;
  hasIndentity: boolean;
  hasIncome: boolean;
  hasRecipient: boolean;
}

const iFarePolicyList = reactive<Array<iFarePolicyItem>>([]);

let relationRequestToken = 0;
async function loadRelationList(infoID: number) {
  const requestToken = ++relationRequestToken;
  iFarePolicyList.splice(0, iFarePolicyList.length);
  if (!infoID) return;

  const res: any = await $WebApiGet("/FarePolicy/GetIFarePolicyRelation", {
    farePolicyID: infoID,
  });
  const _data = res?.result?.result;
  if (!Array.isArray(_data) || requestToken !== relationRequestToken) return;

  iFarePolicyList.push(
    ..._data.map((item: any) => ({
      id: item.id,
      title: item.title,
      qualification: `${(item.qualification ?? "").slice(0, 50)}...`,
      area: item.codeDomicile_LabelName,
      hasIndentity: item.codeIdentityList.findIndex((p: any) => p.id == 1) < 0,
      hasIncome: item.codeIncomeList.findIndex((p: any) => p.id == 1) < 0,
      hasRecipient: item.codeRecipientList.findIndex((p: any) => p.id == 1) < 0,
    }))
  );
}

loadOfficeList();

watch(
  () => Number(route.query.id || 0),
  async (infoID) => {
    await Promise.all([loadPolicyDetail(infoID), loadRelationList(infoID)]);
  },
  { immediate: true }
);

const _url = useRequestURL();
async function ShareWebUrlToLine() {
  const SHARETOLINE = "https://social-plugins.line.me/lineit/share";
  const urlShare = `${SHARETOLINE}?url=${encodeURIComponent(_url.href)}`;

  await navigateTo(urlShare, {
    external: true,
  });
}
</script>

<style scoped>
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
</style>
