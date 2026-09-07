<template>
  <div class="app-body-child" :name="$route.name">
    <div class="part-loading" v-if="isLoading" role="status" aria-live="polite">
      <div class="loading-hint">
        <span class="loading-spinner" aria-hidden="true"></span>
        <span>政策資料載入中...</span>
      </div>
      <span class="skeleton-line skeleton-line-title"></span>
      <span class="skeleton-line"></span>
      <span class="skeleton-line"></span>
      <span class="skeleton-line skeleton-line-info"></span>
    </div>

    <div class="part-empty part-error" v-else-if="hasError" role="alert">
      <p>{{ errorMessage }}</p>
      <button class="btn-retry transition-general" type="button" @click="retryLoad">重新載入</button>
    </div>

    <div class="section-list" v-else-if="hasPolicy">
      <section class="section-top">
        <h1 class="info-title">{{ _welfareItem.title }}</h1>
        <div class="date-group">
          <label class="date-release">{{ formatDisplayDate(_welfareItem.releaseTime) }}</label>
          <label class="date-update">{{ formatDisplayDate(_welfareItem.updateTime) }}</label>
          <label class="article-num">{{ _welfareItem.id }}</label>
        </div>
      </section>
      <section class="section-body">
        <div class="card-info">
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
                <!-- 洽辦單位是「中央」佔位項（UNRESTRICTED_CODE_ID）時沒有可看的詳情頁，藏起跳轉鈕 -->
                <button
                  class="btn-icon btn-go"
                  type="button"
                  v-if="_welfareItem.officeUnitID != UNRESTRICTED_CODE_ID"
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
      <!--
        看完明細還是有想問的（要帶什麼文件、金額多少、去哪辦），以前只能回上一頁重查。
        這裡直接就著這一筆問，答案只從這一頁的政策資料來。
      -->
      <IfarePolicyAskBox :policy="askPolicy" />

      <!-- 相關福利載不到時整區收起，不要留一個空標題讓使用者以為這筆政策沒有相關福利 -->
      <section class="section-relation" v-if="iFarePolicyList.length > 0">
        <div class="relation-links">
          <h2 class="relation-title">相關福利</h2>
          <ul class="list-unstyled relation-list">
            <li class="relation-item transition-general" v-for="_welfare in iFarePolicyList" :key="_welfare.id">
              <NuxtLink
                  :to="{
                    path: '/ifare/info',
                    // 不帶 reload：它會讓 route.global.ts 用 replace 吃掉上一筆歷史紀錄。
                    // 換 id 的重抓由本頁 watcher 負責，不需要這個參數。
                    query: { id: _welfare.id },
                  }"
                >
                <h3 class="link-title">{{ _welfare.title }}</h3>
                <div class="relation-item-bottom">
                  <ul class="list-unstyled filter-list">
                    <li name="area">{{ _welfare.area }}</li>
                    <li name="qualify">
                      <span :class="{remark: _welfare.hasRecipient}">{{_welfare.hasRecipient ? '有' : '無'}}</span>年齡限制、
                      <span :class="{remark: _welfare.hasIncome}">{{ _welfare.hasIncome ? '有' : '無' }}</span>經濟限制、
                      <span :class="{remark: _welfare.hasIndentity}">{{ _welfare.hasIndentity ? '有' : '無' }}</span>特殊身分
                    </li>
                  </ul>
                  <span
                    class="ic-arrow-right link-url transition-general"
                    aria-hidden="true"
                  ></span>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <div class="part-empty" v-else>
      <p>查無這筆政策，可能已經下架，或是網址中的編號有誤。</p>
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

// 載入失敗的預設說法 — 分不出原因時就用這句，總比讓使用者對著空白頁猜好
const DETAIL_ERROR_MESSAGE = "政策資料載入失敗，請稍後再試。";

// id 1 是後端「不限／中央」的佔位項（洽辦單位為中央、限制代碼為不限），不是可點的實體資料。
// 此約定由後端維護：本檔用它決定洽辦單位能不能跳詳情、以及某筆限制算不算「有特定條件」。
// 後端若日後改變佔位項的 id，下面幾處判斷要一起調整。
const UNRESTRICTED_CODE_ID = 1;

const { $WebApiGet, $WebApiGetDetailed } = useNuxtApp();
const { getApiResultValue } = useApiResult();
const { getApiErrorMessage } = useApiErrorMessage();
const { formatDisplayDate } = useDateFormatter();
const route = useRoute();
const $router = useRouter();

// 這頁原本只憑 _welfareItem 有沒有內容決定畫面，於是「還在載入」「連線失敗」
// 「查無政策」三種情況全都長成同一片空白，使用者無從判斷該重試還是換一筆看。
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref(DETAIL_ERROR_MESSAGE);
// 後端確實回了一筆政策才算數。不直接看 _welfareItem.id，是為了避免資料缺 id 時被誤判成查無
const hasPolicy = ref(false);
const currentPolicyId = computed(() => Number(route.query.id || 0));

/**
 * 轉傳預覽與搜尋結果用的中繼資料，必須在伺服器算繪時就備好。
 *
 * LINE 與 Facebook 的爬蟲不執行 JavaScript——實測用它們的 User-Agent 抓這一頁，
 * 拿回來的是骨架，政策標題出現 0 次。所以標籤光寫在元件裡沒有用：底下那個
 * watch(immediate) 是裸露的 async 副作用，Nuxt 在 SSR 階段不會等它。
 * useAsyncData 會被 await，資料才進得了伺服器吐出去的 HTML。
 *
 * 這裡刻意只取三個欄位、與底下的 loadPolicyDetail 分開跑：
 * 那支函式同時管載入狀態、錯誤分類、相關福利與競態控制，
 * 為了 meta 去動它風險太高。明細 API 實測 12–16ms，多打一次可以接受，
 * 而且 useAsyncData 的結果會隨 payload 帶到前端，hydration 時不會再打一次。
 */
// key 用固定字串：這個 Nuxt 版本的 useAsyncData 不接受函式 key（會丟
// "key must be a string"）。換 id 時靠下方的 watch 重取，效果一樣。
const { data: policyMeta } = await useAsyncData(
  "ifare-policy-meta",
  async () => {
    const infoID = currentPolicyId.value;
    if (!infoID) return null;

    const { data } = await $WebApiGetDetailed("/FarePolicy/GetIFarePolicyDetail", {
      farePolicyID: infoID,
    });
    const detail = getApiResultValue<any>(data);
    if (!detail) return null;

    return {
      title: String(detail.title || "").trim(),
      qualification: String(detail.qualification || "").trim(),
      area: String(detail.codeDomicile_LabelName || "").trim(),
    };
  },
  { watch: [currentPolicyId] }
);

const SITE_NAME = "i-Fare 福利好幫手";
const SITE_DESCRIPTION = "長穩社福慈善基金會 i-Fare，整合全臺社會福利政策，用一句話描述您的處境就能找到適合的補助。";
const runtimeConfigForMeta = useRuntimeConfig();
const metaSiteUrl = String(runtimeConfigForMeta.public.siteUrl || "").replace(/\/+$/u, "");

/** 說明文字取申請資格前 100 字。該欄位是純文字，不像 welfareInfo 需要解碼與去標籤 */
const metaDescription = computed(() => {
  const raw = String(policyMeta.value?.qualification || "").replace(/\s+/gu, " ").trim();
  if (!raw) return SITE_DESCRIPTION;
  return raw.length > 100 ? `${raw.slice(0, 100)}…` : raw;
});

/**
 * 分頁標題（給搜尋引擎）：政策全名（已含縣市）在前，用途在後，站名收尾。
 * 這是照台灣人的搜尋習慣排的——「縣市 + 對象 + 補助」，而搜尋結果頁夠寬，顯示得下。
 */
const metaTitle = computed(() => {
  const title = String(policyMeta.value?.title || "").trim();
  return title ? `${title}｜申請資格與補助內容 - ${SITE_NAME}` : `福利政策查詢 - ${SITE_NAME}`;
});

/**
 * 轉傳卡片標題（給 LINE／Facebook）：只留政策全名。
 *
 * 跟上面刻意分開。轉傳卡片大約只顯示 30–40 字，把「申請資格與補助內容 - i-Fare 福利好幫手」
 * 也塞進去的話，實際渲染出來會斷成兩行還被截掉，反而讓政策名稱看不完整。
 * 站名交給 og:site_name 那一行去顯示就好。
 */
const shareTitle = computed(() => {
  const title = String(policyMeta.value?.title || "").trim();
  return title || `福利政策查詢 - ${SITE_NAME}`;
});

const metaUrl = computed(() =>
  currentPolicyId.value && metaSiteUrl
    ? `${metaSiteUrl}/ifare/info?id=${currentPolicyId.value}`
    : metaSiteUrl
);

// 未設定對外站址時，不輸出 og:url 與 canonical；分享圖片由 app.vue 統一提供。
const shareUrlMeta = computed(() =>
  metaUrl.value ? [{ property: "og:url", content: metaUrl.value }] : []
);

useHead(() => ({
  title: metaTitle.value,
  meta: [
    { name: "description", content: metaDescription.value },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: shareTitle.value },
    { property: "og:description", content: metaDescription.value },
    ...shareUrlMeta.value,
    { property: "og:locale", content: "zh_TW" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: shareTitle.value },
    { name: "twitter:description", content: metaDescription.value },
  ],
  link: metaUrl.value ? [{ rel: "canonical", href: metaUrl.value }] : [],
}));

function toDetailErrorMessage(error: any) {
  const message = getApiErrorMessage(error, DETAIL_ERROR_MESSAGE);
  // getApiErrorMessage 分不出類別時會原封不動回傳底層訊息（例如 "Failed to fetch"），
  // 那是給開發者看的，不該端到使用者面前
  return message === error?.message ? DETAIL_ERROR_MESSAGE : message;
}

function JumpTo(id: any) {
  // 中央／不限佔位項沒有對應的洽辦單位頁，直接擋掉跳轉
  if (id == UNRESTRICTED_CODE_ID) return false;
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

// #33 「不限」佔位項（UNRESTRICTED_CODE_ID）不是限制，要先排除掉再判斷有沒有設條件。
// 只看陣列長度的話，只掛著佔位項的政策會被當成「有限制」，判斷方式與同檔 hasSpecificCode
// 及列表頁不一致，只是這裡拿到的是 id 陣列。
function hasRestrictionIds(ids: number[]) {
  return ids.some((id) => Number(id) !== UNRESTRICTED_CODE_ID);
}

// 問答元件要的政策形狀。has* 三項明細 API 沒有直接給，用限制代碼推——
// 有列到「不限」以外的代碼就代表這筆設了該項限制，跟列表頁的判斷一致。
const askPolicy = computed(() => {
  if (!hasPolicy.value || !_welfareItem.id) return null;
  return {
    id: _welfareItem.id,
    title: _welfareItem.title,
    area: _welfareItem.area,
    qualification: _welfareItem.qualification,
    hasRecipient: hasRestrictionIds(_welfareItem.codeRecipientIDs),
    hasIncome: hasRestrictionIds(_welfareItem.codeIncomeIDs),
    hasIndentity: hasRestrictionIds(_welfareItem.codeIdentityIDs),
  };
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
  const requestToken = ++detailRequestToken;
  isLoading.value = true;
  hasError.value = false;
  errorMessage.value = DETAIL_ERROR_MESSAGE;
  hasPolicy.value = false;
  resetWelfareItem();

  try {
    // 網址沒帶 id 不是連線問題，讓它落到「查無政策」，才不會給一個按了也沒用的重試鈕
    if (!infoID) return;

    // 用 Detailed 版本才拿得到 error：$WebApiGet 會把連線錯誤吞成 null，
    // 於是「後端連不上」和「這筆政策不存在」回到頁面時完全同形，只能一起留白
    const { data, error } = await $WebApiGetDetailed("/FarePolicy/GetIFarePolicyDetail", {
      farePolicyID: infoID,
    });

    // 在相關福利之間連點時舊請求可能後到，不能讓它蓋掉新請求的結果
    if (requestToken !== detailRequestToken) return;

    if (error) {
      hasError.value = true;
      errorMessage.value = toDetailErrorMessage(error);
      return;
    }

    const _data = getApiResultValue<any>(data);
    // 連得上但沒有這筆資料 — 屬於查無政策，跟連線失敗要講不一樣的話
    if (!_data) return;

    hasPolicy.value = true;
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
  } catch (e) {
    // 解析回應時炸掉也算載入失敗 — 至少講清楚並讓使用者能重試，別卡在轉不完的載入中
    console.warn("[ifare/info] load detail failed:", e);
    if (requestToken !== detailRequestToken) return;
    hasError.value = true;
    hasPolicy.value = false;
    errorMessage.value = DETAIL_ERROR_MESSAGE;
  } finally {
    // 只有最新的那次請求有資格收掉載入狀態，否則舊請求會提前把畫面放行
    if (requestToken === detailRequestToken) isLoading.value = false;
  }
}

function getPolicyId(item: any) {
  const id = Number(
    item?.id ??
      item?.farePolicyID ??
      item?.farePolicyId ??
      item?.farePolicy_ID ??
      item?.iFarePolicyID ??
      item?.iFarePolicyId ??
      0
  );

  return Number.isFinite(id) && id > 0 ? id : 0;
}

function getCodeList(value: any) {
  return Array.isArray(value) ? value : [];
}

function hasSpecificCode(value: any) {
  // 清單裡若含「不限」佔位項（UNRESTRICTED_CODE_ID）就代表這項沒設限制；找不到它才算有特定條件
  return getCodeList(value).findIndex((p: any) => Number(p?.id) === UNRESTRICTED_CODE_ID) < 0;
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

let relationRequestToken = 0;
async function loadRelationList(infoID: number) {
  const requestToken = ++relationRequestToken;
  iFarePolicyList.splice(0, iFarePolicyList.length);
  if (!infoID) return;

  // 相關福利只是加值資訊，載不到就安靜收起這一區即可，不該讓整頁政策內容跟著陪葬
  try {
    const res: any = await $WebApiGet("/FarePolicy/GetIFarePolicyRelation", {
      farePolicyID: infoID,
    });
    const _data = getApiResultValue<any>(res);
    if (!Array.isArray(_data) || requestToken !== relationRequestToken) return;

    const nextItems = _data
      .map((item: any) => ({
        id: getPolicyId(item),
        title: item.title,
        qualification: `${(item.qualification ?? "").slice(0, QUALIFICATION_PREVIEW_LENGTH)}...`,
        area: item.codeDomicile_LabelName ?? "",
        hasIndentity: hasSpecificCode(item.codeIdentityList),
        hasIncome: hasSpecificCode(item.codeIncomeList),
        hasRecipient: hasSpecificCode(item.codeRecipientList),
        codeDomicileID: item.codeDomicile_ID ?? 0,
        codePolicyID: item.codePolicy_ID ?? 0,
        codeIdentityIDs: getCodeList(item.codeIdentityList).map((p: any) => Number(p.id)),
        codeIncomeIDs: getCodeList(item.codeIncomeList).map((p: any) => Number(p.id)),
        codeRecipientIDs: getCodeList(item.codeRecipientList).map((p: any) => Number(p.id)),
      }))
      .filter((item: iFarePolicyItem) => item.id > 0 && item.title);

    iFarePolicyList.push(...nextItems);
  } catch (e) {
    console.warn("[ifare/info] load relation failed:", e);
  }
}

function retryLoad() {
  // 相關福利多半跟主資料一起斷線，重試時一併補回來，使用者才不用再按第二次
  const infoID = currentPolicyId.value;
  loadPolicyDetail(infoID);
  loadRelationList(infoID);
}

// #19 洽辦單位清單只是 officeUnitInfo 缺值時的備援文字，沒有 SEO 需求；
// 留在頂層等於伺服器白打一次（SSR 不會等它，結果直接丟掉），瀏覽器再打第二次。
onMounted(() => {
  loadOfficeList();
});

watch(
  () => [currentPolicyId.value, String(route.query.reload ?? "")] as const,
  async ([infoID]) => {
    // #19 這是裸露的 async 副作用，SSR 階段不會被 await——伺服器那一輪的結果進不了
    // 吐出去的 HTML，只是白打一次後端。轉傳／SEO 需要的欄位由上方的 useAsyncData 負責，
    // 那支才是會被 await 的正解，這裡只在瀏覽器跑就好。
    if (!import.meta.client) return;
    await Promise.all([loadPolicyDetail(infoID), loadRelationList(infoID)]);
  },
  { immediate: true }
);

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
