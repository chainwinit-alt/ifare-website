<template>
  <section class="ifare-summary-card" :data-provider="selectedProvider">
    <div class="summary-head">
      <div class="summary-head-copy">
        <span class="summary-kicker">AI 快速摘要</span>
        <h3 class="summary-title">關鍵字狀況判斷</h3>
        <!--
          這一份摘要是誰寫的。伺服器會依序試 Groq、Gemini 的多個模型（見 freeTier.ts），
          實際跑到哪一個要看金鑰與當下的額度，不寫出來就只有 console 看得到。
        -->
        <p v-if="summaryModelLabel" class="summary-model">{{ summaryModelLabel }}</p>
      </div>

      <div class="summary-tools">
        <!-- 供應商切換是開發時用的，維持關閉 -->
        <!-- <div class="provider-switch">
          <button
            v-for="option in providerOptions"
            :key="option.value"
            type="button"
            class="provider-pill"
            :class="{ active: selectedProvider === option.value }"
            @click="setProvider(option.value)"
          >
            {{ option.label }}
          </button>
        </div> -->
        <!--
          摘要存在 sessionStorage（30 分鐘），重新整理只會撈回同一份，不會重跑。
          想換一份就按這顆：清掉快取重新產生，之前的問答也一起收掉——
          摘要都換了，那些問答已經不對應現在這一份。
        -->
        <!-- 沒查到站內政策時按這顆也只會重跑一份空摘要，該按的是結果區的重試 -->
        <button
          class="summary-retry"
          type="button"
          :disabled="isSummaryBusy || searchFailed"
          @click="regenerateSummary"
        >
          {{ isSummaryBusy ? "判斷中" : "重新摘要" }}
        </button>
      </div>
    </div>

    <!-- 目前生效的限縮條件。上方搜尋區看摘要時已捲出畫面，這裡再列一次並可一鍵移除 -->
    <div v-if="activeFilters.length" class="summary-active-filters">
      <span class="summary-active-filters-label">目前條件</span>
      <button
        v-for="chip in activeFilters"
        :key="chip.field"
        type="button"
        class="summary-active-chip"
        :aria-label="`移除${chip.label}條件：${chip.value}`"
        @click="emit('clearFilter', chip.field)"
      >
        <span class="summary-active-chip-key">{{ chip.label }}</span>
        <span class="summary-active-chip-value">{{ chip.value }}</span>
        <span class="summary-active-chip-x" aria-hidden="true">×</span>
      </button>
    </div>

    <!-- 選了縣市時，說明結果裡有多少是全國性政策（那些縣市民同樣能申請） -->
    <p v-if="resultBreakdown" class="summary-result-breakdown">{{ resultBreakdown }}</p>
    <div class="summary-body">
      <div v-if="shouldShowSummaryLoading" class="summary-loading">
        <span class="summary-spinner" aria-hidden="true"></span>
        <p class="summary-loading-text">{{ summaryLoadingText }}</p>
      </div>

      <!--
        搜尋沒查成功時只講連線狀況，一個字的政策內容都不寫。
        照常產生摘要的話，空的 cases 會讓伺服器走「站內查無政策 → 一般知識總覽」，
        使用者看到的會是一篇跟本站資料無關、卻長得像官方結論的科普。
      -->
      <div v-else-if="searchFailed" class="summary-empty">
        <p class="summary-text">搜尋暫時無法完成，這次沒有取得站內政策資料，因此不產生 AI 摘要。請按下方的重試再查一次。</p>
      </div>

      <template v-else>
        <div
          v-if="summaryHtml"
          class="summary-markdown"
          v-html="summaryHtml"
          @click="handleSummaryLinkClick"
        ></div>
        <div v-else class="summary-empty">
          <p class="summary-text">{{ fallbackText }}</p>
        </div>
      </template>

      <div v-if="isSummaryBusy" class="summary-cursor">▍</div>
      <p v-if="streamError" class="summary-error">{{ streamError }}</p>
    </div>

    <!-- 條件收太緊時，直接告訴使用者放寬哪一項會有多少筆（筆數是真的查回來的） -->
    <div v-if="relaxSuggestions.length" class="summary-relax">
      <p class="summary-relax-label" id="ifare-summary-relax-label">
        符合的政策很少，放寬其中一項會多出不少：
      </p>
      <div class="summary-relax-list" role="group" aria-labelledby="ifare-summary-relax-label">
        <button
          v-for="item in relaxSuggestions"
          :key="item.field"
          type="button"
          class="summary-relax-chip"
          @click="emit('clearFilter', item.field)"
        >
          <span>拿掉「{{ item.label }}：{{ item.value }}」</span>
          <strong>{{ item.count }} 筆</strong>
        </button>
      </div>
    </div>

    <!--
      推薦鎖定範圍：完全不知道從哪查起的人，打進來的是一段話而不是條件。
      這裡照「還沒問到的條件」一次列最多三種不同類型讓他勾，勾完按一次套用。
      刻意做成選配：不勾也照樣看得到現在這批結果，勾了只是把範圍收得更準。
    -->
    <div
      v-if="showConditionPicker"
      class="summary-narrow"
      :class="{ 'has-pending': pickedConditionList.length > 0 }"
    >
      <p class="summary-narrow-label" id="ifare-summary-narrow-label">
        想更精準？勾選想鎖定的條件（不勾也可以）
      </p>
      <div class="summary-narrow-list" role="group" aria-labelledby="ifare-summary-narrow-label">
        <template v-for="item in conditionSuggestions" :key="item.field">
          <!-- 推得出唯一值（類別、年齡、經濟條件、身分）：直接給一個勾選框 -->
          <label
            v-if="item.mode === 'check'"
            class="summary-narrow-check"
            :class="{ 'is-picked': isConditionPicked(item.field, item.options[0].val) }"
          >
            <input
              type="checkbox"
              :checked="isConditionPicked(item.field, item.options[0].val)"
              @change="toggleCondition(item.field, item.options[0].val)"
            />
            <span class="summary-narrow-kind">{{ item.label }}</span>
            <span class="summary-narrow-value">{{ item.options[0].name }}</span>
            <strong
              v-if="conditionCountOf(item.field, item.options[0].val) !== null"
              class="summary-narrow-count"
            >{{ conditionCountOf(item.field, item.options[0].val) }} 筆</strong>
          </label>
          <!--
            戶籍地：住哪裡只有使用者自己知道，而且 22 個縣市列成按鈕太長。
            列滿在下拉裡，找不到自己縣市的人才不會誤以為本站沒有他那邊的資料。
          -->
          <div v-else-if="item.mode === 'select'" class="summary-narrow-pick">
            <span class="summary-narrow-kind">{{ item.label }}</span>
            <label class="sr-only" :for="`ifare-narrow-${item.field}`">選擇{{ item.label }}</label>
            <select
              :id="`ifare-narrow-${item.field}`"
              class="summary-narrow-select"
              :value="pickedConditions[item.field] || ''"
              @change="onSelectCondition(item.field, $event)"
            >
              <option value="">請選擇{{ item.label }}</option>
              <option v-for="option in item.options" :key="option.val" :value="option.val">
                {{ option.name }}
              </option>
            </select>
            <strong
              v-if="pickedConditions[item.field]
                && conditionCountOf(item.field, pickedConditions[item.field]) !== null"
              class="summary-narrow-count"
            >{{ conditionCountOf(item.field, pickedConditions[item.field]) }} 筆</strong>
          </div>
          <!--
            推不出唯一值的（年齡、經濟條件、特殊身分）：把可選的列出來讓使用者自己點。
          -->
          <div v-else class="summary-narrow-pick">
            <span class="summary-narrow-kind">{{ item.label }}</span>
            <div class="summary-narrow-pick-list">
              <button
                v-for="option in item.options"
                :key="option.val"
                type="button"
                class="summary-narrow-option"
                :class="{ active: isConditionPicked(item.field, option.val) }"
                :aria-pressed="isConditionPicked(item.field, option.val)"
                @click="toggleCondition(item.field, option.val)"
              >
                <span
                  v-if="isConditionPicked(item.field, option.val)"
                  class="summary-narrow-tick"
                  aria-hidden="true"
                >✓</span>
                <span>{{ option.name }}</span>
                <strong v-if="conditionCountOf(item.field, option.val) !== null"
                >{{ conditionCountOf(item.field, option.val) }} 筆</strong>
              </button>
            </div>
          </div>
        </template>
      </div>
      <div class="summary-narrow-actions">
        <button
          type="button"
          class="summary-narrow-apply"
          :disabled="!pickedConditionList.length"
          @click="applyPickedConditions"
        >{{ applyConditionsLabel }}</button>
        <!--
          勾了卻沒按套用時，畫面上的摘要與政策卡都還是原本那一批——選取樣式
          看起來很像已經生效，不講的話會以為是篩選壞掉了。這一句只在有勾、
          還沒套用時出現，講的就是當下唯一該做的動作。
        -->
        <span v-if="pickedConditionList.length" class="summary-narrow-pending" role="status">
          這些條件還沒生效，按下按鈕才會重新搜尋
        </span>
        <span v-else-if="conditionNote" class="summary-narrow-note">{{ conditionNote }}</span>
      </div>
    </div>

    <div v-if="canContinueConversation" class="summary-conversation">
      <!--
        對話由上往下長：您說的在上、AI 的回答緊接在下面。
        只有「問問題」的回答會留在這裡；補條件的回合改的是上方那份摘要，
        不會同時在下面再講一次，免得一張卡出現兩份互相打架的內容。
      -->
      <div v-if="threadItems.length || isFollowUpLoading" class="summary-message-list" aria-live="polite">
        <template v-for="(item, index) in threadItems" :key="`thread-${index}`">
          <div v-if="item.role === 'user'" class="summary-message is-user">
            <span class="summary-message-label">您說</span>
            <p>{{ item.content }}</p>
          </div>
          <div v-else class="summary-answer">
            <span class="summary-answer-label">AI 回覆</span>
            <div
              class="summary-markdown"
              v-html="renderThreadAnswer(item.content)"
              @click="handleSummaryLinkClick"
            ></div>
            <!-- 回答說「改成台北市就看得到」時，直接給一顆按鈕，不用自己回上面改篩選 -->
            <div v-if="item.action" class="summary-answer-action">
              <button
                type="button"
                class="summary-policy-chip"
                @click="emit('selectQuickOption', { field: item.action.field, val: item.action.val })"
              >
                改看{{ item.action.label }}：{{ item.action.value }}
                <strong>{{ item.action.count }} 筆</strong>
              </button>
            </div>
          </div>
        </template>
        <p v-if="isFollowUpLoading" class="summary-message-pending">{{ followUpPendingText }}</p>
      </div>

      <form class="summary-followup-form" @submit.prevent="submitFollowUp">
        <label class="summary-followup-label" for="ifare-summary-followup">回覆或提問</label>
        <div class="summary-followup-controls">
          <input
            id="ifare-summary-followup"
            v-model="followUpInput"
            type="text"
            maxlength="120"
            autocomplete="off"
            placeholder="回覆上面的問題，或直接問我（例如：要準備什麼文件？）"
            :disabled="isFollowUpLoading"
          />
          <button type="submit" :disabled="!canSubmitFollowUp">
            {{ isFollowUpLoading ? "整理中" : "送出" }}
          </button>
        </div>
        <p v-if="followUpError" class="summary-followup-error">
          {{ followUpError }}
          <!-- 失敗時您那句話還留在對話串上，重試不用自己再打一次 -->
          <button
            v-if="failedFollowUpText"
            type="button"
            class="summary-followup-retry"
            @click="retryFollowUp"
          >重試</button>
        </p>
      </form>
    </div>

    <div v-if="actualReferenceCases.length" class="summary-references">
      <div class="reference-head">
        <span class="reference-label">最相符的 3 筆政策</span>
      </div>
      <div class="reference-card-list">
        <NuxtLink
          v-for="item in recommendedCases"
          :key="item.id"
          class="reference-card-link"
          :to="buildCaseLink(item.id)"
        >
          <article class="top-case-card reference-case-card">
            <div class="top-case-rank">0{{ item.referenceNo }}</div>
            <div class="top-case-copy">
              <h4 class="top-case-title">{{ item.title }}</h4>
              <!-- 為什麼是這三筆：對上了哪些條件、還剩哪些門檻 -->
              <p class="top-case-reasons">
                <span v-for="reason in item.reasons" :key="reason">{{ reason }}</span>
              </p>
              <div class="top-case-bottom">
                <p v-if="item.showArea" class="top-case-area">{{ item.area }}</p>
                <div class="top-case-flags">
                  <span :class="{ active: item.hasRecipient }">受補助對象</span>
                  <span :class="{ active: item.hasIncome }">收入資格</span>
                  <span :class="{ active: item.hasIndentity }">身分類別</span>
                </div>
              </div>
            </div>
          </article>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  buildFallbackIntentSummary,
  buildRelevanceQuery,
  extractExplicitSearchConditions,
  isFollowUpQuestion,
  isNewTopicText,
  matchPolicyCategory,
  normalizeFallbackIntentTopic,
} from "~/utils/ifareIntent";
import {
  isUnsetPolicyCondition as isUnsetCondition,
  policyDeclares,
  scorePolicyConditionFit,
} from "~/utils/ifarePolicyFit";
import { IFARE_SUMMARY_CACHE_PREFIX } from "~/utils/ifareSummaryCache";

type SummaryCaseItem = {
  id: number;
  title: string;
  area: string;
  qualification: string;
  hasRecipient: boolean;
  hasIncome: boolean;
  hasIndentity: boolean;
  welfareInfo?: string;
  evidence?: string;
  officeUnitInfo?: string;
  officeUnitTel?: string;
  competentAuthority?: string;
  remark?: string;
  sourceSummary?: string;
  /** 這筆政策實際標記的條件（後端代碼表的名稱），「全選」代表沒有限制 */
  policyCategory?: string;
  recipientNames?: string[];
  incomeNames?: string[];
  identityNames?: string[];
};

type ProviderName = "groq";

type RankedSummaryCaseItem = SummaryCaseItem & {
  similarityScore: number;
  rank: number;
  scorePercent: number;
};

type ReferencedCaseItem = RankedSummaryCaseItem & {
  referenceNo: number;
  originalReferenceNo: number;
};

type SummarySearchContext = {
  policy?: string;
  recipient?: string;
  area?: string;
  income?: string;
  identity?: string;
  query?: string;
};

type SummaryConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

/** 追問問到目前條件以外的範圍時，頁面查回來的「換過去會有幾筆」 */
type SummaryScopeShift = {
  field: string;
  label: string;
  value: string;
  val: string;
  count: number;
};

type SummaryConversationSearchResult = {
  query: string;
  cases: SummaryCaseItem[];
};

type SummaryConversationSearch = (payload: {
  query: string;
  conversation: SummaryConversationMessage[];
}) => Promise<SummaryConversationSearchResult>;

/** count 是「目前結果裡有幾筆標記這個值」，用來挑出最值得推薦的那一個 */
type SummaryQuickOption = { name: string; val: string; count?: number };

/** 推薦區的一列：一種條件類型，加上要讓使用者選的值 */
type SummaryConditionSuggestion = {
  field: string;
  label: string;
  /**
   * check ── 使用者親口說了那個值，直接給勾選框
   * pick  ── 推不出來，把可選的列出來讓他點（年齡、經濟條件、特殊身分）
   * select ── 選項太多、而且答案只有他知道（戶籍地），給完整下拉選單
   */
  mode: "check" | "pick" | "select";
  options: SummaryQuickOption[];
};

// 推薦列的類型名稱。跟結果頁「目前條件」用同一套字，
// 勾完之後在卡片頂端看到的就是同一個詞，不會像兩個功能。
const CONDITION_FIELD_LABELS: Record<string, string> = {
  policy: "類別",
  area: "地區",
  recipient: "年齡",
  income: "經濟條件",
  identity: "特殊身分",
};

/**
 * 選項很多的條件（類別 12 項、地區 22 項）一列最多列幾個。
 *
 * 年齡（4 項）、經濟條件（3 項）、特殊身分（5 項）都是短的封閉集合，一律全部列出。
 * 截成三項的話，使用者要找的那一項剛好不在，這一列對他就等於不存在——
 * 「家裡有人跌倒」問的是誰跌倒，只給「成人」一個選項是答非所問。
 */
const CONDITION_PICK_LIMIT = 4;
const CONDITION_WIDE_FIELDS = new Set(["policy", "area"]);

type SummaryActiveFilter = { field: string; label: string; value: string };
type SummaryRelaxSuggestion = SummaryActiveFilter & { count: number };

const emit = defineEmits<{
  summaryComplete: [payload: { summary: string; provider: ProviderName }];
  selectQuickOption: [payload: { field: string; val: string }];
  applyConditions: [payload: Array<{ field: string; val: string }>];
  /** 追問框裡打的是另一個主題，不是補條件：換掉關鍵字重新搜尋 */
  newTopicSearch: [topic: string];
  clearFilter: [field: string];
}>();

const props = withDefaults(
  defineProps<{
    query?: string;
    cases: SummaryCaseItem[];
    provider?: ProviderName;
    resultsLoading?: boolean;
    searchContext?: SummarySearchContext;
    summaryTriggerKey?: number;
    summaryCacheKey?: string;
    summaryResetKey?: number;
    conversationSearch?: SummaryConversationSearch;
    /** 追問提到別的範圍時，去查那個範圍在本站有幾筆（查不到或沒提到就回 null） */
    conversationScopeProbe?: (userText: string) => Promise<SummaryScopeShift | null>;
    /** 各條件可選的快捷選項，key 是 policy / area / recipient / income / identity */
    quickOptions?: Record<string, SummaryQuickOption[]>;
    /**
     * 戶籍地的完整選項（22 個縣市）。
     *
     * 不從 quickOptions 取，是因為那一份只留「目前結果裡真的有在地政策」的縣市——
     * 台東縣沒有在地長照政策就不會出現，設籍台東的人會以為本站沒有他那邊的資料，
     * 但實際上他照樣能申請所有全國性政策。戶籍地要列滿，不能挑。
     */
    areaOptions?: SummaryQuickOption[];
    /** 推薦區每一項「套用之後會剩幾筆」，回傳 key 是 `${field}:${val}`；查不到就不給那一項 */
    conditionProbe?: (
      items: Array<{ field: string; val: string }>
    ) => Promise<Record<string, number>>;
    /**
     * 探測筆數的基準：跟 conditionProbe 用同一個關鍵字變體查回來的總筆數。
     *
     * 不能拿畫面上的總筆數來比——那是好幾個關鍵字變體聯集出來的，跟探測不同源。
     * 兩者混著比會把「其實縮不動」的條件當成有效（例如 46 < 123 看起來有縮，
     * 但那 46 是另一個基準底下的數字）。
     */
    probeBaselineCount?: number;
    /** 目前生效的限縮條件，顯示在摘要卡頂端 */
    activeFilters?: SummaryActiveFilter[];
    /** 選了縣市時的結果組成說明（在地幾筆、全國性幾筆） */
    resultBreakdown?: string;
    /** 條件收太緊時的「放寬哪一項會有幾筆」建議 */
    relaxSuggestions?: SummaryRelaxSuggestion[];
    /**
     * 這次搜尋是請求失敗，不是站內真的沒有政策（由結果頁判斷，見 result.vue）。
     *
     * true 時整張卡不產生摘要。cases 空掉的原因有兩種，但送進伺服器長得一模一樣：
     * 伺服器會判定站內查無政策而改走一般知識總覽，於是連線失敗被包裝成一整篇
     * 看起來很權威的科普——實測擋掉 GetIFarePolicyList 搜「長照」就會拿到長照科普，
     * 但站內其實有 52 筆。那條路是誤導的來源，這裡直接不讓它走到。
     */
    searchFailed?: boolean;
  }>(),
  {
    query: "",
    quickOptions: () => ({}),
    areaOptions: () => [],
    probeBaselineCount: 0,
    activeFilters: () => [],
    resultBreakdown: "",
    relaxSuggestions: () => [],
    searchFailed: false,
    provider: "groq",
    resultsLoading: false,
    searchContext: () => ({}),
    summaryTriggerKey: 0,
    summaryCacheKey: "",
    summaryResetKey: 0,
  }
);

const { $llm } = useNuxtApp();
const router = useRouter();
const selectedProvider = ref<ProviderName>("groq");
const isLoading = ref(false);
const streamError = ref("");
const summaryText = ref("");
const activeController = shallowRef<AbortController | null>(null);
const conversationMessages = ref<SummaryConversationMessage[]>([]);
const followUpInput = ref("");
const followUpDraft = ref("");
const followUpError = ref("");
// 送出失敗時保留那句話，讓使用者按一下就能重送，不用自己再打一次
const failedFollowUpText = ref("");
const isFollowUpLoading = ref(false);
const followUpController = shallowRef<AbortController | null>(null);
const conversationSearchQuery = ref("");
// 這一份摘要實際是哪一個供應商、哪一個模型產生的（由伺服器的 meta 事件帶回來）
const summaryProvider = ref("");
const summaryModel = ref("");
let requestId = 0;
let followUpRequestId = 0;

/**
 * 摘要出處的說明文字。
 *
 * 供應商全部失敗時伺服器會回 provider=fallback、model=script，那是本地腳本拼出來的
 * 句子，不是模型寫的——這種時候要講清楚，不然使用者會以為 AI 就是這樣回答的。
 */
const summaryModelLabel = computed(() => {
  const provider = summaryProvider.value;
  const model = summaryModel.value;
  if (!provider && !model) return "";
  if (provider === "fallback" || provider === "unavailable" || model === "script") {
    return "本地判斷（AI 模型暫時無法使用）";
  }
  if (!model) return `模型：${provider}`;
  return `模型：${provider} · ${model}`;
});

const hasKeyword = computed(() => Boolean(normalizeSummaryKeyword(props.query)));
const isSummaryBusy = computed(() => props.resultsLoading || isLoading.value);
const shouldShowSummaryLoading = computed(() => {
  // 搜尋沒查成功就不會再有摘要進來，轉圈圈只會讓人一直等
  if (props.searchFailed) return false;
  // 補條件的那一輪會重新搜尋，政策卡當場換成新的一批，但摘要要等 LLM 回來才更新。
  // 中間那幾秒若讓舊摘要留在畫面上，它的 [參考 N] 會指到新的卡片——實測補「高雄」時
  // 文字還在講嘉義縣、新竹縣、雲林縣，下面三張卡卻已經是高雄市，等於指鹿為馬。
  // 問問題的那一輪不動上方摘要，維持顯示。
  if (isFollowUpLoading.value && !isAnswerTurn.value) return true;
  return props.resultsLoading || (isLoading.value && !summaryText.value.trim());
});
const summaryLoadingText = computed(() => {
  if (isFollowUpLoading.value && !isAnswerTurn.value) {
    return "正在依照您的補充重新整理摘要...";
  }

  if (props.resultsLoading) {
    return "AI摘要判斷中...";
  }

  return "AI 正在整理判斷結果...";
});
const canContinueConversation = computed(
  () => hasKeyword.value && !isSummaryBusy.value && Boolean(summaryDisplayText.value.trim())
);
const canSubmitFollowUp = computed(
  () => Boolean(followUpInput.value.trim()) && !isFollowUpLoading.value
);
// 追問可以是「補充條件」也可以是「問問題」，兩件事等待中要講的話不一樣：
// 補條件是重寫摘要，問問題是去翻政策明細找答案。
const isAnswerTurn = ref(false);
const followUpPendingText = computed(() =>
  isAnswerTurn.value ? "正在翻找政策內容，為您回答…" : "正在依照您的補充重新整理摘要…"
);
// 伺服器算出的「這輪還值得請使用者補哪幾項條件」，依縮小範圍最有效的順序排。
// 判斷邏輯不在前端重算，否則兩邊會各自算出不同答案，就會出現
// 「摘要結尾問戶籍地、下面卻推薦類別」那種不一致。
const guidanceFields = ref<string[]>([]);
// 使用者勾了哪些條件（field → val）。按下套用之前不會動到任何篩選。
const pickedConditions = ref<Record<string, string>>({});
// 每一項「套用之後會剩幾筆」，key 是 `${field}:${val}`。查不到的就不放進來。
const conditionCounts = ref<Record<string, number>>({});
// 筆數查完了沒（查失敗也算查完）。沒查完就先不顯示整區，避免列出來又抽掉。
const conditionCountsReady = ref(false);
let conditionProbeId = 0;

/**
 * 使用者自己打的原句，不做任何改寫。
 *
 * 不能用 buildIntentSource()：那份是排序用的，已經把縣市名拿掉、還補了站內同義詞，
 * 拿去判斷「他有沒有親口說出這個條件」會判錯。
 */
function buildLiteralUserText() {
  return [
    normalizeSummaryKeyword(props.query),
    normalizeSummaryKeyword(props.searchContext?.query),
    ...conversationMessages.value
      .filter((message) => message.role === "user")
      .map((message) => message.content),
  ]
    .filter(Boolean)
    .join(" ");
}

/** 使用者親口說出來的條件（字面抽取，絕不推測） */
const literalConditions = computed(() => extractExplicitSearchConditions(buildLiteralUserText()));
/** 使用者自己的用字有沒有指向某一類福利（「失業補助」→ 勞工福利） */
const hintedPolicyCategory = computed(() => matchPolicyCategory(buildLiteralUserText()));

/** 這一項條件，使用者自己講過的值是什麼；沒講過回空字串 */
function spokenValueFor(field: string) {
  const literal = literalConditions.value;
  if (field === "policy") return hintedPolicyCategory.value;
  if (field === "area") return literal.area;
  if (field === "recipient") return literal.recipient;
  if (field === "income") return literal.income;
  if (field === "identity") return literal.identities[0] || "";
  return "";
}

/**
 * 使用者講的那個值對到站上的哪一個選項。
 *
 * 字面抽出來的詞跟選項名稱不一定一字不差（「兒童」要對到「兒童＆青少年」），
 * 但放寬成包含式就會出事：「中低收入戶」含有「低收入戶」，說低收的人會被
 * 配到中低收，那是完全不同的資格。改成只認前綴——「兒童＆青少年」開頭是
 * 「兒童」所以配得上，「中低收入戶」開頭不是「低收入戶」所以配不上。
 */
function findSpokenOption(options: SummaryQuickOption[], spoken: string) {
  if (!spoken) return undefined;
  const exact = options.find((option) => option.name.trim() === spoken);
  if (exact) return exact;
  return options.find((option) => {
    const name = option.name.trim();
    return name.startsWith(spoken) || spoken.startsWith(name);
  });
}

/**
 * 摘要引用的那三筆政策各屬於哪一類（去重，保留卡片上的先後順序）。
 *
 * 來源就是送去產生摘要的那一份 cases（見 loadSummary 的 cases: referenceCases）。
 * 摘要結尾「例如長期照顧、老人福利」舉的例子也是從同一份數出來的，
 * 見 server/utils/llm/shared.ts 的 buildPolicyGuidanceQuestion()。
 *
 * 「全選」是後端代碼表裡「沒有限制」的那一項，跟伺服器那邊一樣要排除：
 * 拿它當推薦條件等於篩了跟沒篩一樣。
 */
const citedPolicyCategories = computed(() => [
  ...new Set(
    referenceCases.value
      .map((item) => String(item.policyCategory || "").trim())
      .filter((name) => name && !["全選", "全部"].includes(name))
  ),
]);

/**
 * 「類別」這一列：摘要引用那三筆政策的類別排前面，其餘才照筆數補位。
 *
 * 這一列原本純粹照「目前結果裡哪個類別筆數最多」排，跟摘要結尾那句問句不同源，
 * 於是問句舉的例子跟下面列出來的選項對不起來，使用者只能挑一個看得到的。
 * 實測搜「家裡有人跌倒」＋桃園市＋老人共 28 筆，第 1 名是【桃園市】中低收入老人
 * 住屋修繕補助——跌倒最需要的就是這一筆；照著建議再勾「長期照顧」之後只剩 3 筆，
 * 而且住屋修繕不見了：它歸在「老人福利」，不是「長期照顧」。照建議走反而把最該看的
 * 那筆篩掉，所以這一列必須跟問句舉的例子同一份來源。
 *
 * 同一句話搜「家裡有人跌倒」不套條件共 320 筆，照筆數排的前四名是身心障礙福利 272、
 * 老人福利 26、社會救助 7、兒少福利 4——引用的三筆有兩筆是長期照顧（站內只有 4 筆），
 * 問句也照著舉了長期照顧，這一列卻連列都沒列出來，使用者只能從看得到的裡面挑。
 *
 * 引用最多三筆、CONDITION_PICK_LIMIT 是 4，照筆數排的那一份至少還留得下一個名額。
 */
function prioritizeCitedPolicyOptions(options: SummaryQuickOption[]) {
  const cited = citedPolicyCategories.value;
  if (!cited.length) return options;

  const rankOf = (option: SummaryQuickOption) => {
    const index = cited.indexOf(option.name.trim());
    return index < 0 ? cited.length : index;
  };
  // 只調順序不砍選項：某個類別沒被引用不代表它不能選，只是輪不到它排前面
  return [...options].sort((a, b) => rankOf(a) - rankOf(b));
}

/**
 * 推薦鎖定範圍的候選條件（還沒依查回來的筆數篩過）。
 *
 * 值一律從目前這批結果裡真的存在的選項來（見結果頁的 summaryQuickOptions），
 * 不讓模型自由發想——推一個站內根本篩不出東西的條件，比不推更糟。
 *
 * 這一份刻意不看 conditionCounts：筆數是照這份清單去查的，兩邊互相依賴的話
 * 會變成「查回筆數 → 清單變了 → 再查一次」的無窮迴圈。篩選在下面那個 computed。
 */
const conditionCandidates = computed<SummaryConditionSuggestion[]>(() => {
  const suggestions: SummaryConditionSuggestion[] = [];

  for (const field of guidanceFields.value) {
    const label = CONDITION_FIELD_LABELS[field];
    if (!label) continue;

    // 戶籍地：22 個縣市全部列進下拉選單。
    // 曾經只列「目前結果裡在地政策最多的前四名」，於是搜「長照」時列出桃園、金門、
    // 新北、南投，其他縣市的人只能推論「我這邊沒有資料」——那是錯的，任何縣市套用後
    // 至少都拿得到全國性政策。而且住哪裡只有他自己知道，本來就不是能推薦的事。
    if (field === "area") {
      const areaOptions = props.areaOptions.filter((option) => option.val && option.name);
      if (areaOptions.length) suggestions.push({ field, label, mode: "select", options: areaOptions });
      continue;
    }

    const byCount = [...(props.quickOptions[field] || [])]
      .filter((option) => option.val && option.name)
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    if (!byCount.length) continue;

    // 類別這一列改跟摘要引用的三筆政策同源（見 prioritizeCitedPolicyOptions），
    // 其餘幾列維持照筆數排——它們的值不是從政策分類來的，沒有這個對應關係。
    const options = field === "policy" ? prioritizeCitedPolicyOptions(byCount) : byCount;

    // 直接給一個勾選框的唯一理由，是使用者自己講出了那個值。
    //
    // 曾經改用「結果裡哪個值最多」來挑，那是把政策庫的分布當成使用者的處境：
    // 「家裡有人跌倒」查回來成人的政策最多，就推薦「年齡：成人」——但誰跌倒
    // 這件事只有他知道，站上的筆數答不出來。推不出來就把選項列出來讓他自己選。
    const matched = findSpokenOption(options, spokenValueFor(field));
    const ordered = matched
      ? [matched, ...options.filter((option) => option.val !== matched.val)]
      : options;

    suggestions.push({
      field,
      label,
      mode: matched ? "check" : "pick",
      options: CONDITION_WIDE_FIELDS.has(field)
        ? ordered.slice(0, CONDITION_PICK_LIMIT)
        : ordered,
    });
  }

  return suggestions;
});

/**
 * 這一項條件套下去，範圍真的會變小嗎。
 *
 * 只看查回來的真實筆數。後端的篩選會一併帶回「沒有這項限制」的政策，所以光看
 * 目前結果裡有幾筆標記它是不夠的——實測「高雄市＋成人＋失業」的 16 筆裡只有幾筆
 * 標了經濟弱勢，套下去卻還是 16 筆。推薦一個按了沒反應的條件，比不推更傷。
 *
 * 還沒查到筆數時一律回 true：那時候整區本來就還沒顯示（見 showConditionPicker），
 * 查失敗時則是照樣列出來、只是不寫數字。
 */
function narrowsResults(field: string, val: string) {
  const count = conditionCounts.value[`${field}:${val}`];
  if (typeof count !== "number") return true;
  const baseline = props.probeBaselineCount;
  return count > 0 && (baseline > 0 ? count < baseline : true);
}

/** 真的要畫出來的那幾列：縮不動的值拿掉，整列都沒剩就不顯示這一列 */
const conditionSuggestions = computed<SummaryConditionSuggestion[]>(() =>
  conditionCandidates.value
    .map((item) => {
      // 戶籍地是選單不是推薦：住哪裡不能為了「縮小結果」而改，所以不做縮不縮得動的篩選
      if (item.mode === "select") return item;

      const kept = item.options.filter((option) => narrowsResults(item.field, option.val));
      // 使用者講出來的那個值套下去縮不動的話，就別再單獨推薦它，
      // 改成把這一項其餘可選的值列出來——整列消失等於少給一次機會。
      if (item.mode === "check" && kept[0]?.val === item.options[0]?.val) {
        return { ...item, options: kept.slice(0, 1) };
      }
      // 類別這一列不重排：它的順序是摘要結尾那句問句舉例的順序（見
      // prioritizeCitedPolicyOptions）。實測搜「家裡有人跌倒」，問句寫「例如長期照顧、
      // 老人福利」，這一列就照著讀成長期照顧、老人福利、身心障礙福利、社會救助——
      // 改照筆數排會變成 72、42、31、4 筆，長期照顧掉到最後一個，跟上一句對不起來。
      // 數字看起來沒有由大到小是這一列的代價，但那句問句才是使用者正在讀的東西。
      if (item.field === "policy") return { ...item, mode: "pick" as const, options: kept };

      // 其餘幾列依查回來的真實筆數重排。原本的順序是照「目前結果裡標了幾筆」排的，
      // 跟畫面上寫的數字不是同一個東西，並排看起來就像亂序。
      const sorted = [...kept].sort(
        (a, b) =>
          (conditionCountOf(item.field, b.val) ?? b.count ?? 0) -
          (conditionCountOf(item.field, a.val) ?? a.count ?? 0)
      );
      return { ...item, mode: "pick" as const, options: sorted };
    })
    .filter((item) => item.options.length > 0)
);

// 候選條件有沒有變。用字串比而不是比陣列參考，
// 才不會每次重算 computed 都重查一次筆數。
const conditionSignature = computed(() =>
  conditionCandidates.value
    .map((item) => `${item.field}=${item.options.map((option) => option.val).join("|")}`)
    .join(",")
);

// 追問回覆會直接更新摘要，所以推薦區在對話開始之後仍然該留著——
// 它問的是還沒回答的條件，跟輸入框是同一條路的兩種走法。
const showConditionPicker = computed(
  () => conditionSuggestions.value.length > 0
    // 筆數查回來之前不顯示：先畫出來再抽掉縮不動的那幾列，看起來像畫面自己在跳。
    // 探測是在摘要開始生成時就發動的，等於有整段 LLM 的時間可用，實務上不會等到。
    && conditionCountsReady.value
    && !props.searchFailed
    && !isSummaryBusy.value
    && !isFollowUpLoading.value
    && Boolean(summaryDisplayText.value.trim())
);

// 筆數那句只在真的查到數字時才寫——探測失敗時畫面上一個數字都沒有，
// 這時候還寫「筆數是實際查回來的」等於在講一件畫面上看不到的事。
const conditionNote = computed(() =>
  Object.keys(conditionCounts.value).length > 0 ? "筆數是實際查回來的，不是估算" : ""
);

const pickedConditionList = computed(() =>
  Object.entries(pickedConditions.value)
    .filter(([, val]) => Boolean(val))
    .map(([field, val]) => ({ field, val }))
);

const applyConditionsLabel = computed(() =>
  pickedConditionList.value.length
    ? `套用 ${pickedConditionList.value.length} 項條件並重新搜尋`
    : "套用勾選的條件"
);

function isConditionPicked(field: string, val: string) {
  return pickedConditions.value[field] === val;
}

/** 同一列只鎖一個值：再點一次就取消。整區都沒勾也是合法狀態，這是選配不是必填 */
function toggleCondition(field: string, val: string) {
  const next = { ...pickedConditions.value };
  if (next[field] === val) delete next[field];
  else next[field] = val;
  pickedConditions.value = next;
}

/** 下拉選單選了值。跟勾選一樣只是記下來，按套用才會生效 */
function onSelectCondition(field: string, event: Event) {
  const val = (event.target as HTMLSelectElement).value;
  const next = { ...pickedConditions.value };
  if (val) next[field] = val;
  else delete next[field];
  pickedConditions.value = next;

  if (val && conditionCountOf(field, val) === null) void probeSingleCondition(field, val);
}

/** 單獨查一個值會剩幾筆。戶籍地選單不預先全查，選到誰才查誰 */
async function probeSingleCondition(field: string, val: string) {
  const probe = props.conditionProbe;
  if (!probe) return;

  const currentProbeId = conditionProbeId;
  try {
    const counts = await probe([{ field, val }]);
    // 中途換了一輪搜尋就丟掉，別把上一輪的數字併進新的清單
    if (currentProbeId !== conditionProbeId) return;
    conditionCounts.value = { ...conditionCounts.value, ...(counts || {}) };
  } catch {
    // 查不到就不顯示數字，寧可不寫也不要寫一個錯的
  }
}

/** 查回來的筆數；還沒查到或那一項查失敗就回 null，畫面上那格不寫數字 */
function conditionCountOf(field: string, val: string) {
  const count = conditionCounts.value[`${field}:${val}`];
  return typeof count === "number" ? count : null;
}

/** 勾好的條件一次全部套上去，只重新搜尋一次 */
function applyPickedConditions() {
  const picked = pickedConditionList.value;
  if (!picked.length) return;
  pickedConditions.value = {};
  emit("applyConditions", picked);
}

/**
 * 幫推薦區的每一項查「套用之後會剩幾筆」。
 *
 * 清單先畫出來，數字晚幾百毫秒再補上——為了一個數字讓整區空在那裡並不划算。
 * 查失敗的那一項就不顯示數字，寧可不寫也不要寫一個錯的。
 */
async function refreshConditionCounts() {
  const probe = props.conditionProbe;
  const items = conditionCandidates.value
    // 戶籍地選單有 22 個縣市，不可能一次全查；改成使用者選到哪一個才查那一個
    .filter((item) => item.mode !== "select")
    .flatMap((item) => item.options.map((option) => ({ field: item.field, val: option.val })));
  conditionCounts.value = {};
  if (!probe || !items.length) {
    // 沒有要查的（例如這一輪只剩戶籍地選單）就直接顯示，
    // 別卡在等一個不會來的結果，那會讓整區永遠不出現。
    conditionCountsReady.value = conditionCandidates.value.length > 0;
    return;
  }

  const currentProbeId = ++conditionProbeId;
  conditionCountsReady.value = false;
  try {
    const counts = await probe(items);
    if (currentProbeId !== conditionProbeId) return;
    conditionCounts.value = counts || {};
  } catch {
    if (currentProbeId !== conditionProbeId) return;
    conditionCounts.value = {};
  } finally {
    if (currentProbeId === conditionProbeId) conditionCountsReady.value = true;
  }
}
// 卡片下半部的對話串。問問題的回合會把「您說」與「AI 回覆」依序往下接，
// 補條件的回合則是改上方那份摘要，只留下這次說的那句話。
type SummaryThreadItem = {
  role: "user" | "assistant";
  content: string;
  /** 回答裡提到「改成台北市就看得到」時，附一顆直接切過去的按鈕 */
  action?: SummaryScopeShift;
};
const threadItems = ref<SummaryThreadItem[]>([]);
// v40：引導階梯新增「政策類別」這一階、追問回合改成主題明確時給推薦，
// 舊快取的結尾問句與模式都不一樣，必須整批失效。
// v42：摘要提示詞新增「全國性政策設籍該縣市同樣適用」的說明規則
// v43：福利內容欄位改成先解 percent-encoding 再送進模型，摘要內容會不一樣
// v44：引導條件由單一 guidanceField 改成一次三項的 guidanceFields，舊快取存的形狀不同
// v45：多存摘要的模型出處，舊快取沒有這兩個欄位，讀回來會少一行字
// v46：「哪一類福利」的問句改成照實際查到的類別舉例，舊快取裡是寫死的那組例子
const SUMMARY_CACHE_VERSION = "v46-dynamic-policy-question";
const SUMMARY_CACHE_KEY_PREFIX = IFARE_SUMMARY_CACHE_PREFIX;
const SUMMARY_CACHE_TTL_MS = 30 * 60 * 1000;

const providerOptions: Array<{ value: ProviderName; label: string }> = [
  { value: "groq", label: "Groq" },
];

const referenceTokenPattern = /\[參考\s*(\d+)\]/g;
// 模型偶爾把引用寫成 [參考 1, 參考 2, 參考 3]（每個編號都再寫一次「參考」）。
// 舊樣式只收數字與逗號，遇到這種寫法整串會以原文顯示在畫面上，所以改成
// 先抓出整段引用，再從裡面把編號撈出來。
// 中間不准出現換行或另一個 [：否則遇到落單的左括號會從那裡一路吃到下一個
// [參考 N]，把中間整個段落標題與列點吞掉。
const groupedReferenceTokenPattern = /\[[^\[\]\n]*參考[^\[\]\n]*\]/g;

function normalizeText(value: string) {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{Script=Han}a-z0-9]/giu, "");
}

function splitQueryTokens(query: string) {
  const tokens = new Set<string>();
  // 先照空白與頓號切開，再逐段正規化。normalizeText 會把空白吃掉，整串一起處理時
  // 「長照 長期照顧」會被當成一個六字詞，切出「照長」「期照」這種跨詞邊界的假詞。
  const segments = String(query || "")
    .split(/[\s、,，]+/)
    .flatMap((part) => normalizeText(part).match(/[\p{Script=Han}]+|[a-z0-9]+/giu) ?? []);

  for (const segment of segments) {
    if (/^[\p{Script=Han}]+$/u.test(segment)) {
      if (segment.length <= 2) {
        tokens.add(segment);
        continue;
      }

      for (let i = 0; i < segment.length - 1; i++) {
        tokens.add(segment.slice(i, i + 2));
      }
      tokens.add(segment);
      continue;
    }

    tokens.add(segment);
  }

  return Array.from(tokens);
}

/**
 * localArea：使用者選定的縣市名（沒選特定縣市時傳空字串）。
 *
 * 只用在「相關性完全同分」時的排序依據。實測「長照＋高雄市＋老人」11 筆裡有 10 筆
 * 同分，這時誰排前面純粹看後端回傳順序，結果在地政策全被擠到後面。同分時優先在地
 * 才符合「我選了高雄市」的期待；分數有差距時（例如台北市的長照在地政策根本沒提到
 * 長照）仍然由相關性決定，不會把不相關的東西推上來。
 */
// 條件符合度、「這一項算不算沒指定」、「政策有沒有標這個值」三支都搬到
// utils/ifarePolicyFit.ts，跟下方結果清單的排序共用同一份實作——各算一套的話，
// 卡片推薦的第 2、3 筆會出現在清單的第 8、9 名，同一份結果讀起來像兩個系統。

function rankCases(
  query: string,
  cases: SummaryCaseItem[],
  localArea = "",
  context?: SummarySearchContext
): RankedSummaryCaseItem[] {
  const tokens = splitQueryTokens(query);
  const normalizedQuery = normalizeText(query);
  const localAreaText = normalizeText(localArea);

  const ranked = cases
    .map((item) => {
      const titleText = item.title || "";
      const areaText = item.area || "";
      const qualificationText = item.qualification || "";
      const title = normalizeText(titleText);
      const area = normalizeText(areaText);
      const qualification = normalizeText(qualificationText);
      const welfareInfo = normalizeText(item.welfareInfo || "");
      const evidence = normalizeText(item.evidence || "");
      const sourceSummary = normalizeText(item.sourceSummary || "");
      const remark = normalizeText(item.remark || "");
      const authority = normalizeText(item.competentAuthority || item.officeUnitInfo || "");
      const combined = `${title}${area}${qualification}${welfareInfo}${evidence}${sourceSummary}${remark}${authority}`;
      const fieldWeights = [
        [title, 16],
        [area, 5],
        [qualification, 10],
        [sourceSummary, 18],
        [welfareInfo, 14],
        [evidence, 12],
        [remark, 10],
        [authority, 8],
      ] as const;

      let score = 0;
      let matchedTokenCount = 0;

      if (tokens.length) {
        for (const token of tokens) {
          let tokenMatched = false;
          for (const [field, weight] of fieldWeights) {
            if (!field) continue;
            if (field.includes(token)) {
              score += weight;
              tokenMatched = true;
            }
          }

          if (tokenMatched) matchedTokenCount += 1;
        }

        if (normalizedQuery && combined.includes(normalizedQuery)) {
          score += 24;
        }

        score += matchedTokenCount * 4;
        // 這三張卡是「精選前三名」而不是搜尋排序（下方清單有自己的排序），所以
        // 「合不合用」要跟「主題對不對」等量齊觀。權重 0.6 時條件符合度形同無效：
        // 關鍵字分數動輒 40 以上，±3 的差距排不動任何東西——實測選了台北市卻推薦
        // 原住民限定政策，台北市自己的服務排在第 8 名之後。
        score += scorePolicyConditionFit(item, context);

        if (isOverSpecificCaseForIntent(item, query)) {
          score -= 80;
        }
      } else {
        // 純篩選搜尋沒有關鍵字可比，條件符合度就是唯一的排序依據
        score = scorePolicyConditionFit(item, context) * 4;
      }

      return {
        ...item,
        similarityScore: Math.round(score * 10) / 10,
        isLocalArea: Boolean(localAreaText) && area === localAreaText,
        rank: 0,
        scorePercent: 0,
      };
    })
    .sort((a, b) => {
      const scoreDiff = b.similarityScore - a.similarityScore;
      if (Math.abs(scoreDiff) > Number.EPSILON) return scoreDiff;
      // 相關性同分才比在地，所以不會壓過相關性
      return (b.isLocalArea ? 1 : 0) - (a.isLocalArea ? 1 : 0);
    });

  const maxScore = ranked[0]?.similarityScore || 0;

  return ranked.map((item, index) => ({
    ...item,
    rank: index + 1,
    scorePercent: maxScore > 0 ? Math.max(12, Math.round((item.similarityScore / maxScore) * 100)) : 0,
  }));
}

function normalizeSummaryKeyword(value?: string) {
  const keyword = String(value ?? "").trim();
  if (!keyword || /^(?:未指定|undefined|null)$/iu.test(keyword)) return "";
  return keyword;
}

function cleanContextValue(value?: string) {
  const text = (value || "").trim();
  if (!text || text === "未指定") return "";
  return text;
}

function isDefaultContextValue(value: string, defaults: string[]) {
  return defaults.includes(value.trim());
}

function hasContextValue(value: string | undefined, defaults: string[] = []) {
  const text = cleanContextValue(value);
  return Boolean(text && !isDefaultContextValue(text, defaults));
}

function buildProvidedContextText() {
  const context = props.searchContext || {};
  const parts: string[] = [];

  if (hasContextValue(context.policy, ["全部"])) {
    parts.push(`受助者情況「${cleanContextValue(context.policy)}」`);
  }
  if (hasContextValue(context.recipient, ["全部"])) {
    parts.push(`年齡區間「${cleanContextValue(context.recipient)}」`);
  }
  if (hasContextValue(context.area, ["全國", "全部", "不限地區"])) {
    parts.push(`戶籍地「${cleanContextValue(context.area)}」`);
  }
  if (hasContextValue(context.income, ["全部"])) {
    parts.push(`經濟條件「${cleanContextValue(context.income)}」`);
  }
  if (hasContextValue(context.identity, ["全部"])) {
    parts.push(`特殊身分「${cleanContextValue(context.identity)}」`);
  }

  return parts.join("、");
}

function buildMissingContextText() {
  const context = props.searchContext || {};
  const missing: string[] = [];

  if (!hasContextValue(context.policy, ["全部"])) missing.push("受助者情況");
  if (!hasContextValue(context.recipient, ["全部"])) missing.push("年齡區間");
  if (!hasContextValue(context.area, ["全國", "全部", "不限地區"])) missing.push("戶籍地");
  if (!hasContextValue(context.income, ["全部"])) missing.push("經濟條件");
  if (!hasContextValue(context.identity, ["全部"])) missing.push("特殊身分");

  return missing.join("、");
}

function joinNaturalList(values: string[]) {
  if (values.length <= 1) return values[0] || "";
  return `${values.slice(0, -1).join("、")}及${values[values.length - 1]}`;
}

function normalizeIdentityContext(value?: string) {
  const parts = cleanContextValue(value)
    .split(/[、,，/]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const specificParts = parts.filter((item) => !["無", "不限", "全部"].includes(item));

  if (specificParts.length) return specificParts.join("、");
  if (parts.includes("無")) return "無特殊身分";
  return parts.join("、");
}

function buildCompactContextText() {
  const context = props.searchContext || {};
  const values: string[] = [];

  if (hasContextValue(context.policy, ["全部"])) values.push(cleanContextValue(context.policy));
  if (hasContextValue(context.recipient, ["全部"])) values.push(cleanContextValue(context.recipient));
  if (hasContextValue(context.area, ["全國", "全部", "不限地區"])) values.push(cleanContextValue(context.area));
  if (hasContextValue(context.income, ["全部"])) values.push(cleanContextValue(context.income));
  if (hasContextValue(context.identity, ["全部"])) {
    const identity = normalizeIdentityContext(context.identity);
    if (identity) values.push(identity);
  }

  return joinNaturalList([...new Set(values)]);
}

function buildRankQuery() {
  const conversationQuery = normalizeSummaryKeyword(conversationSearchQuery.value);
  const keyword = normalizeSummaryKeyword(props.searchContext?.query);
  const query = normalizeSummaryKeyword(props.query);
  // 地區是獨立的篩選條件；留在排序關鍵字裡會讓每一筆都因為標題的【新北市】而命中，
  // 引用政策就會排出一堆跟主題無關的東西。順便把訪客用語換成站內用詞。
  return buildRelevanceQuery(conversationQuery || keyword || query);
}

const overSpecificSummaryGuards: Array<{ allowedBy: RegExp; blockedInSummary: RegExp }> = [
  {
    allowedBy: /牙|假牙|口腔|牙科|齒/u,
    blockedInSummary: /牙|假牙|口腔|牙科|齒/u,
  },
  {
    allowedBy: /托育|幼兒|兒童|青少年|兒少|育兒|生育|早療/u,
    blockedInSummary: /托育|幼兒|兒童|青少年|兒少|育兒|生育|早療/u,
  },
];

function buildIntentSource() {
  return [
    buildRankQuery(),
    props.searchContext?.query,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildCaseIntentText(item: SummaryCaseItem) {
  return [
    item.title,
    item.area,
    item.qualification,
    item.welfareInfo,
    item.evidence,
    item.sourceSummary,
    item.remark,
    item.competentAuthority,
    item.officeUnitInfo,
  ]
    .filter(Boolean)
    .join(" ");
}

function isOverSpecificCaseForIntent(item: SummaryCaseItem, intent: string) {
  const normalizedIntent = normalizeText(intent || "");
  const normalizedCase = normalizeText(buildCaseIntentText(item));

  return overSpecificSummaryGuards.some((guard) => {
    return !guard.allowedBy.test(normalizedIntent) && guard.blockedInSummary.test(normalizedCase);
  });
}

const rankQuery = computed(() => buildRankQuery());
// 這次搜尋使用者到底有沒有自己打關鍵字。沒有的話 props.query 是頁面用已選條件組出來的
// 描述詞（見 result.vue 的 conditionSummaryQuery），對它做字面比對沒有意義。
const hasTypedKeyword = computed(() =>
  Boolean(normalizeSummaryKeyword(props.searchContext?.query))
);
// 選了特定縣市時才傳；「全國」「未指定」代表沒有在地偏好
const localAreaName = computed(() => {
  const area = String(props.searchContext?.area || "").trim();
  return area === "全國" || area === "不限地區" || area === "未指定" ? "" : area;
});
/**
 * 卡片推薦用的候選。
 *
 * 分數仍由 rankCases 算（下面要靠 similarityScore 濾掉零分、靠它判斷過度specific），
 * 但「順序」回到下方清單的順序——卡片標題寫的是「最相符的 3 筆政策」，它就不該
 * 跟下方清單各排各的。
 *
 * 實測「家裡有人跌倒＋桃園市＋老人＋長期照顧」共 8 筆：卡片第 3 名是
 *【全國】住宿式服務機構使用者補助方案，在清單裡卻排第 6；而清單第 3、第 4 名
 *（【全國】交通接送服務、【桃園市】失能老人接受長期照顧機構服務）在卡片上完全
 * 沒出現。同一份結果讀起來像兩個系統各說各話。
 *
 * 清單那套排序資訊更多（後端 BM25 ＋ 多路查詢的 RRF 融合 ＋ 條件符合度），
 * 卡片這套只看得到標題、地區、資格三個欄位，所以是卡片跟隨清單，不是反過來。
 */
const rankedCases = computed(() => {
  const listOrder = new Map(props.cases.map((item, index) => [item.id, index]));
  return rankCases(rankQuery.value, props.cases, localAreaName.value, props.searchContext)
    .sort((a, b) => (listOrder.get(a.id) ?? 0) - (listOrder.get(b.id) ?? 0));
});
const fallbackText = computed(() => {
  // 連本地備援摘要也不給：那段文字寫的是「站內的情況」，但這次根本沒拿到站內資料。
  // 順帶讓 summaryDisplayText 保持空的，追問輸入框與快捷鈕都不會冒出來——
  // 沒有政策可談的時候，那些入口只會把使用者引到更多空回答。
  if (props.searchFailed) return "";
  if (!hasKeyword.value) return "";

  // 這段是要顯示給使用者看的，必須用他自己打的字。buildRankQuery() 會補上站內用語
  // （長照 → 長照 長期照顧），正規化又把空白吃掉，畫面上就會出現
  // 「您提到的『長照長期照顧』」這種沒人打過的詞。補的詞只服務搜尋與排序。
  const queryText = normalizeSummaryKeyword(conversationSearchQuery.value)
    || normalizeSummaryKeyword(props.searchContext?.query)
    || normalizeSummaryKeyword(props.query);
  return buildFallbackIntentSummary(queryText);
});

const summaryDisplayText = computed(() => {
  if (summaryText.value.trim()) return summaryText.value.trim();
  return fallbackText.value;
});

function escapeHtml(value: string) {
  return (value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** 追問對話的種子訊息要用純文字：把總覽的 Markdown 標記與引用符號拆掉 */
function toPlainSummaryText(value: string) {
  return (value || "")
    .replace(/^(?:#{1,6}\s+)+/gm, "")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[[^\[\]\n]*參考[^\[\]\n]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

/**
 * 摘要內文的「參考 N」是塞在 v-html 裡的原生 <a>，點下去會整頁重新載入。
 * 那會讓離開結果頁時觸發 pagehide，回來時被 consumeReloadNavigation 誤判成
 * 「使用者按了重新整理」，於是條件被整組清空——回得去卻要重打一次。
 * 這裡接管點擊改走 SPA 導覽，維持與政策卡連結一致的行為。
 * 修飾鍵、中鍵、外部連結一律放行給瀏覽器，不搶使用者的開新分頁。
 */
function handleSummaryLinkClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const anchor = (event.target as HTMLElement | null)?.closest?.("a") as HTMLAnchorElement | null;
  const href = anchor?.getAttribute("href") || "";
  if (!href.startsWith("/ifare/info")) return;

  event.preventDefault();
  void router.push(href);
}

function buildCaseLink(id: number) {
  return {
    path: "/ifare/info",
    // 不帶 reload，理由同結果頁：那個參數會讓上一頁回不到搜尋結果
    query: { id: String(id) },
  };
}

function normalizeReferenceNotation(text: string) {
  groupedReferenceTokenPattern.lastIndex = 0;
  return (text || "").replace(groupedReferenceTokenPattern, (token) => {
    const refNumbers = (token.match(/\d+/g) || [])
      .map((item) => Number(item))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (!refNumbers.length) return token;
    return refNumbers.map((value) => `[參考 ${value}]`).join("");
  });
}

function applyInlineMarkdown(text: string) {
  const escaped = escapeHtml(normalizeReferenceNotation(text || ""));

  referenceTokenPattern.lastIndex = 0;
  const withReferences = escaped.replace(referenceTokenPattern, (_token, refNoText) => {
    const referenceNo = Number(refNoText);
    const item = referenceCaseByNo.value.get(referenceNo);
    // 模型標到不存在的編號時整顆引用移除，不留 [參考 N] 原文干擾閱讀
    if (!item) return "";

    const href = `/ifare/info?id=${encodeURIComponent(String(item.id))}`;
    return `<a class="summary-inline-reference" href="${href}" title="${escapeHtml(item.title)}">參考 ${item.referenceNo}</a>`;
  });

  const withLinks = withReferences.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_match, label, url) =>
      `<a class="summary-inline-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
  );

  const withStrong = withLinks.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const withEm = withStrong.replace(/(^|[^*])\*(?!\s)(.+?)(?!\s)\*(?!\*)/g, "$1<em>$2</em>");
  return withEm.replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderMarkdown(text: string) {
  const source = normalizeReferenceNotation((text || "").replace(/\r\n?/g, "\n")).trim();
  if (!source) return "";

  const blocks: string[] = [];
  const lines = source.split("\n");
  let paragraph: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${paragraph.join("<br>")}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) {
      listType = null;
      listItems = [];
      return;
    }

    blocks.push(`<${listType}>${listItems.join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const unordered = line.match(/^[-*+]\s+(.*)$/);
    const ordered = line.match(/^\d+[.)]\s+(.*)$/);

    if (unordered || ordered) {
      flushParagraph();
      const nextType: "ul" | "ol" = unordered ? "ul" : "ol";
      if (listType && listType !== nextType) {
        flushList();
      }
      listType = nextType;
      const match = unordered || ordered;
      const itemText = applyInlineMarkdown(match[1]);
      listItems.push(`<li>${itemText}</li>`);
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      // 模型偶爾會寫成「### ### 站內相符的福利」，多出來的記號要拆掉，
      // 不然標題會連 ### 一起顯示出來。已經存進快取的舊內容也靠這一步救回來。
      const headingText = heading[1].replace(/^(?:#{1,6}\s*)+/u, "");
      blocks.push(`<h4 class="summary-section-title">${applyInlineMarkdown(headingText)}</h4>`);
      continue;
    }

    flushList();
    paragraph.push(applyInlineMarkdown(line));
  }

  flushParagraph();
  flushList();

  if (!blocks.length) {
    return `<p>${applyInlineMarkdown(source)}</p>`;
  }

  return blocks.join("");
}

/** 這筆政策要求某種特殊身分，而使用者沒宣告任何身分 */
function needsUndeclaredIdentity(item: SummaryCaseItem) {
  return Boolean(item.hasIndentity) && isUnsetCondition(props.searchContext?.identity);
}

const referenceCases = computed<ReferencedCaseItem[]>(() => {
  const usedPolicyKeys = new Set<string>();

  return rankedCases.value
    // 純篩選搜尋的結果集本來就是篩選器選出來的，這時再用字面比對砍掉零分政策，
    // 會讓明明有結果的搜尋送出空的 cases，被伺服器判成站內查無政策而走一般知識總覽。
    .filter((item) => !rankQuery.value || !hasTypedKeyword.value || item.similarityScore > 0)
    .filter((item) => !isOverSpecificCaseForIntent(item, buildIntentSource()))
    .filter((item) => {
      const key = `${normalizeText(item.title)}:${normalizeText(item.area)}`;
      if (usedPolicyKeys.has(key)) return false;
      usedPolicyKeys.add(key);
      return true;
    })
    // 需要「使用者沒宣告的特殊身分」的政策往後排，湊不滿三張才拿它們補。
    //
    // 這件事用扣分壓不住：實測「長照＋台北市」的原住民交通費補助，資格欄位裡
    // 「長照」出現三次，關鍵字分數遠高於其他候選，扣 20 分仍排進前三。但使用者
    // 從沒說過自己是原住民，推薦一筆他八成用不上的政策，比少推一筆更糟。
    // 身分只有五種且很少適用，跟「幾乎每筆都有」的年齡限制性質不同，才適用這條規則；
    // 候選全都有身分門檻時兩組合併後順序不變，不會把卡片變空。
    .sort((a, b) => Number(needsUndeclaredIdentity(a)) - Number(needsUndeclaredIdentity(b)))
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      referenceNo: index + 1,
      originalReferenceNo: item.rank,
    }));
});

const actualReferenceCases = computed(() => {
  if (props.resultsLoading || !hasKeyword.value) return [];
  return referenceCases.value;
});

/**
 * 為什麼推薦這一筆。
 *
 * 只講使用者自己說過的條件對上了什麼，並且如實標出「還有哪些他沒提過的門檻」——
 * 那一項比稱讚更重要，不然點進去才發現要身心障礙手冊，等於白跑一趟。
 */
function buildRecommendReasons(item: SummaryCaseItem) {
  const context = props.searchContext || {};
  const reasons: string[] = [];
  const area = String(context.area || "").trim();

  if (!isUnsetCondition(area)) {
    if (normalizeText(item.area || "") === normalizeText(area)) reasons.push(`${area}在地`);
    else if (String(item.area || "").trim() === "全國") reasons.push("全國適用");
  }

  if (!isUnsetCondition(context.income) && policyDeclares(item.incomeNames, context.income)) {
    reasons.push(`符合${context.income}`);
  }
  if (!isUnsetCondition(context.recipient) && policyDeclares(item.recipientNames, context.recipient)) {
    reasons.push(`符合${context.recipient}`);
  }
  if (!isUnsetCondition(context.identity) && policyDeclares(item.identityNames, context.identity)) {
    reasons.push(`符合${context.identity}`);
  }

  const remaining: string[] = [];
  if (isUnsetCondition(context.identity) && item.hasIndentity) remaining.push("特殊身分");
  if (isUnsetCondition(context.recipient) && item.hasRecipient) remaining.push("年齡");
  if (isUnsetCondition(context.income) && item.hasIncome) remaining.push("經濟條件");
  reasons.push(remaining.length ? `另有${remaining.join("、")}限制` : "無其他條件限制");

  return reasons.slice(0, 3);
}

/**
 * 給版面用的推薦卡：帶上理由，並標記還需不需要單獨列地區。
 * 理由開頭已經是「台東縣在地」時再列一次「台東縣」只是重複。
 */
const recommendedCases = computed(() =>
  referenceCases.value.map((item) => {
    const reasons = buildRecommendReasons(item);
    return {
      ...item,
      reasons,
      showArea: !reasons.some((reason) => reason.endsWith("在地") || reason === "全國適用"),
    };
  })
);

// [參考 N] 的 N 對應送給後端 prompt 的「政策 N」編號，
// 也就是 referenceCases 的排列順序（referenceNo），不是全清單的名次。
const referenceCaseByNo = computed(() => {
  return new Map(referenceCases.value.map((item) => [item.referenceNo, item]));
});

const summaryHtml = computed(() => {
  return useSanitize(renderMarkdown(summaryDisplayText.value));
});

/** 對話串裡的回答走同一套 Markdown 渲染，[參考 N] 一樣會變成政策連結 */
function renderThreadAnswer(text: string) {
  return useSanitize(renderMarkdown(text));
}

function buildSummaryCacheKey() {
  return `${SUMMARY_CACHE_KEY_PREFIX}${JSON.stringify({
    version: SUMMARY_CACHE_VERSION,
    provider: selectedProvider.value,
    searchKey: props.summaryCacheKey || normalizeSummaryKeyword(props.query),
  })}`;
}

/** 從 sessionStorage 讀回來的東西不能直接信，形狀不對就整批丟掉 */
function sanitizeCachedThread(value: unknown): SummaryThreadItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: any) =>
      item
      && (item.role === "user" || item.role === "assistant")
      && typeof item.content === "string"
      && item.content
    )
    .slice(-8)
    .map((item: any) => ({
      role: item.role,
      content: item.content,
      ...(item.action && typeof item.action.field === "string" && typeof item.action.val === "string"
        ? { action: item.action as SummaryScopeShift }
        : {}),
    }));
}

/** 只收認得的條件名稱，避免舊快取或改壞的內容讓推薦區列出對不上的東西 */
function sanitizeGuidanceFields(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item in CONDITION_FIELD_LABELS)
    .slice(0, CONDITION_PICK_LIMIT);
}

function sanitizeCachedConversation(value: unknown): SummaryConversationMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: any) =>
      item
      && (item.role === "user" || item.role === "assistant")
      && typeof item.content === "string"
      && item.content
    )
    .slice(-8)
    .map((item: any) => ({ role: item.role, content: item.content }));
}

function readSummaryCache() {
  if (!process.client) return null;

  const raw = sessionStorage.getItem(buildSummaryCacheKey());
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      savedAt?: number;
      summary?: string;
      provider?: string;
      model?: string;
      guidanceFields?: unknown;
      thread?: unknown;
      conversation?: unknown;
    };

    if (!parsed?.savedAt || Date.now() - parsed.savedAt > SUMMARY_CACHE_TTL_MS) {
      sessionStorage.removeItem(buildSummaryCacheKey());
      return null;
    }

    if (typeof parsed.summary !== "string" || !parsed.summary) return null;
    // guidanceFields 也要一起存：走快取時不會有 meta 事件，沒存的話推薦區就消失了
    return {
      summary: parsed.summary,
      // 模型出處也要一起存：走快取時不會有 meta 事件，沒存的話那一行就消失了
      provider: String(parsed.provider || ""),
      model: String(parsed.model || ""),
      guidanceFields: sanitizeGuidanceFields(parsed.guidanceFields),
      thread: sanitizeCachedThread(parsed.thread),
      conversation: sanitizeCachedConversation(parsed.conversation),
    };
  } catch {
    sessionStorage.removeItem(buildSummaryCacheKey());
    return null;
  }
}

/**
 * 摘要與那一輪的問答一起存。
 *
 * 快取 key 是依篩選條件算的，所以換條件就是另一筆，不會互相汙染；
 * sessionStorage 又是單一分頁的，也不會影響到別人。這樣重新整理才不會
 * 把使用者問過的東西整批弄丟——那是最容易讓人以為「頁面壞了」的地方。
 */
function writeSummaryCache(summary: string) {
  if (!process.client || !summary) return;

  sessionStorage.setItem(
    buildSummaryCacheKey(),
    JSON.stringify({
      savedAt: Date.now(),
      summary,
      provider: summaryProvider.value,
      model: summaryModel.value,
      guidanceFields: guidanceFields.value,
      thread: threadItems.value,
      conversation: conversationMessages.value,
    })
  );
}

function clearSummaryCache() {
  if (!process.client) return;
  sessionStorage.removeItem(buildSummaryCacheKey());
}

function restoreCachedSummary() {
  const cached = readSummaryCache();
  if (!cached) return false;

  summaryText.value = cached.summary;
  summaryProvider.value = cached.provider;
  summaryModel.value = cached.model;
  guidanceFields.value = cached.guidanceFields;
  threadItems.value = cached.thread;
  conversationMessages.value = cached.conversation;
  streamError.value = "";
  isLoading.value = false;
  return true;
}

/** 使用者主動要一份新的摘要：清快取重跑，舊的問答一起收掉 */
function regenerateSummary() {
  if (isSummaryBusy.value) return;
  clearSummaryCache();
  resetFollowUpConversation();
  void loadSummary(true);
}

function emitSummaryComplete() {
  emit("summaryComplete", {
    summary: summaryText.value,
    provider: selectedProvider.value,
  });
}

async function loadSummary(forceRefresh = false) {
  // 這次沒查到站內資料就別打模型了。空的 cases 會被伺服器判成站內查無政策而改走
  // 一般知識總覽，寫出來的東西讀起來像「本站就是沒有」的結論——那正是誤導的來源。
  if (props.searchFailed) {
    activeController.value?.abort();
    resetFollowUpConversation();
    isLoading.value = false;
    streamError.value = "";
    summaryText.value = "";
    return;
  }

  if (!hasKeyword.value) {
    activeController.value?.abort();
    resetFollowUpConversation();
    isLoading.value = false;
    streamError.value = "";
    summaryText.value = "";
    return;
  }

  if (!forceRefresh) {
    if (restoreCachedSummary()) {
      emitSummaryComplete();
      return;
    }
  }

  const currentRequestId = ++requestId;
  activeController.value?.abort();
  const controller = new AbortController();
  activeController.value = controller;
  isLoading.value = true;
  streamError.value = "";
  summaryText.value = "";
  summaryProvider.value = "";
  summaryModel.value = "";
  let completedByStream = false;

  try {
    await $llm.streamSummarizeCases({
      // 按了「重新摘要」就連伺服器端那層快取也一起跳過，不然會拿回一模一樣的字
      refresh: forceRefresh,
      query: normalizeSummaryKeyword(props.query),
      context: props.searchContext,
      cases: referenceCases.value,
      // 刻意不送 provider：伺服器現在會採信這個欄位並鎖死那一個供應商，
      // 而這裡的值是寫死的 "groq"。送過去等於在沒有 Groq 金鑰的環境把摘要弄壞。
      // 指定模型是開發時比較模型才用的，走另外的入口（見 freeTier 的 ModelOverride）。
      signal: controller.signal,
      onChunk: (_delta, fullText) => {
        if (currentRequestId !== requestId) return;
        summaryText.value = fullText;
      },
      onMeta: (meta) => {
        if (currentRequestId !== requestId) return;
        if (meta?.guidanceFields !== undefined) {
          guidanceFields.value = sanitizeGuidanceFields(meta.guidanceFields);
        }
        // provider 一開始是佔位的 "auto"，真正跑完才知道是誰接的，那一次才採用
        if (meta?.provider && meta.provider !== "auto") {
          summaryProvider.value = String(meta.provider);
          summaryModel.value = String(meta.model || "");
        }
        console.log("[IFareSummaryCard][llm-meta]", meta);
      },
    });
    completedByStream = true;
  } catch (error: any) {
    if (currentRequestId !== requestId) return;
    console.warn("[IFareSummaryCard][llm]", error);
    streamError.value = "AI 判斷暫時忙碌，已切換成本地判斷。";
    summaryProvider.value = "fallback";
    summaryModel.value = "script";
    if (!summaryText.value.trim()) {
      summaryText.value = fallbackText.value;
    }
  } finally {
    if (currentRequestId !== requestId) return;
    isLoading.value = false;
    activeController.value = null;
    if (!summaryText.value.trim()) {
      summaryText.value = fallbackText.value;
    }
    writeSummaryCache(summaryText.value);
    if (completedByStream) {
      emitSummaryComplete();
    }
  }
}

function resetFollowUpConversation() {
  followUpRequestId += 1;
  followUpController.value?.abort();
  followUpController.value = null;
  conversationMessages.value = [];
  threadItems.value = [];
  followUpInput.value = "";
  followUpDraft.value = "";
  followUpError.value = "";
  failedFollowUpText.value = "";
  conversationSearchQuery.value = "";
  isAnswerTurn.value = false;
  // 新的搜尋會重新算引導問題，先清掉舊的，避免短暫顯示上一輪的推薦條件與筆數
  guidanceFields.value = [];
  pickedConditions.value = {};
  conditionCounts.value = {};
  conditionCountsReady.value = false;
  conditionProbeId += 1;
  isFollowUpLoading.value = false;
}

async function submitFollowUp() {
  const userReply = followUpInput.value.trim().slice(0, 120);
  if (!userReply || isFollowUpLoading.value) return;

  // 打的是另一個主題（「孩童補助的政策」），不是補條件也不是問問題。
  //
  // 走原本那條路會把兩個主題疊在一起——實測搜「跌倒」再打這句，摘要變成
  // 「跌倒導致受傷的孩童」，結果從 54 筆變成 151 筆，而搜尋框還停在「跌倒」。
  // 改成換掉關鍵字重新搜尋，篩選條件（地區、年齡…）保留，因為那些沒有改變。
  // 搜尋框會跟著更新成新主題，使用者看得出剛剛發生了什麼，也改得回去。
  if (isNewTopicText(userReply, props.query)) {
    followUpInput.value = "";
    followUpError.value = "";
    failedFollowUpText.value = "";
    emit("newTopicSearch", userReply);
    return;
  }

  const currentRequestId = ++followUpRequestId;
  followUpController.value?.abort();
  const controller = new AbortController();
  followUpController.value = controller;
  // 第一次追問時，把目前這份摘要當成對話的開頭；之後它已經在紀錄裡，不必再補一次
  if (conversationMessages.value.length === 0) {
    conversationMessages.value.push({
      role: "assistant",
      content: toPlainSummaryText(summaryDisplayText.value),
    });
  }
  conversationMessages.value.push({ role: "user", content: userReply });
  threadItems.value.push({ role: "user", content: userReply });
  isAnswerTurn.value = isFollowUpQuestion(userReply);
  followUpInput.value = "";
  followUpDraft.value = "";
  followUpError.value = "";
  failedFollowUpText.value = "";
  isFollowUpLoading.value = true;

  const conversation: SummaryConversationMessage[] = conversationMessages.value.slice(-8);
  // 回覆要放哪裡由伺服器回報的 mode 決定，不在前端重算一次——
  // 兩邊各算一次就會出現「前端當成回答、後端其實只回了一句引導」的錯位。
  let replyMode = "";
  let scopeShift: SummaryScopeShift | null = null;

  try {
    // 問問題的回合不重新搜尋。您問的是畫面上這幾筆政策，重搜會換掉引用的政策卡，
    // 上方那份摘要的 [參考 N] 就會指到別筆去。補條件才需要重新搜尋。
    // 順帶省下一次意圖解析與數次政策查詢，回答也快得多。
    if (props.conversationSearch && !isAnswerTurn.value) {
      const searchResult = await props.conversationSearch({
        query: normalizeSummaryKeyword(props.query),
        conversation,
      });
      if (currentRequestId !== followUpRequestId) return;
      conversationSearchQuery.value = normalizeSummaryKeyword(searchResult?.query);
      await nextTick();
    }

    // 「台北市也有可以申請嗎」這種問題問的是目前條件以外的範圍。候選政策裡一筆
    // 台北市的都沒有，硬答只會答出「站內資料未載明」——但本站其實有。先把那個
    // 範圍的真實筆數查回來，回答才講得出實話，也才給得出可以直接切過去的按鈕。
    if (isAnswerTurn.value && props.conversationScopeProbe) {
      scopeShift = await props.conversationScopeProbe(userReply);
      if (currentRequestId !== followUpRequestId) return;
    }

    await $llm.streamSummarizeCases({
      query: conversationSearchQuery.value || normalizeSummaryKeyword(props.query),
      context: props.searchContext,
      cases: referenceCases.value,
      conversation,
      scopeHint: scopeShift
        ? {
            field: scopeShift.field,
            label: scopeShift.label,
            value: scopeShift.value,
            count: scopeShift.count,
          }
        : null,
      // 同上：不指定供應商，讓伺服器照設定的候選順序退讓
      signal: controller.signal,
      onChunk: (_delta, fullText) => {
        if (currentRequestId !== followUpRequestId) return;
        followUpDraft.value = fullText;
      },
      onMeta: (meta) => {
        if (currentRequestId !== followUpRequestId) return;
        if (meta?.mode) replyMode = String(meta.mode);
        // answer 回合不動上方摘要，那份摘要結尾的引導問題還在，
        // 對應的推薦條件就不能跟著被清掉。
        if (meta?.mode !== "answer" && meta?.guidanceFields !== undefined) {
          guidanceFields.value = sanitizeGuidanceFields(meta.guidanceFields);
        }
        // 追問可能落到別的模型（前一個額度用完就換下一個），出處要跟著換
        if (meta?.provider && meta.provider !== "auto") {
          summaryProvider.value = String(meta.provider);
          summaryModel.value = String(meta.model || "");
        }
      },
    });

    if (currentRequestId !== followUpRequestId) return;
    const reply = followUpDraft.value.trim();
    if (reply) {
      conversationMessages.value.push({ role: "assistant", content: reply });
      conversationMessages.value = conversationMessages.value.slice(-8);
      if (replyMode === "answer") {
        // 問題的答案接在您那句話下面，由上往下讀才順；上方摘要不動，
        // 因為這一輪沒有改變搜尋條件，那份總覽仍然成立。
        threadItems.value.push({
          role: "assistant",
          content: reply,
          ...(scopeShift ? { action: scopeShift } : {}),
        });
        threadItems.value = threadItems.value.slice(-8);
      } else {
        // 補條件的回覆本身就是「更新後的摘要」：直接取代上面那份。
        // 政策集跟著換了，舊的問答不再對應現在的結果，只留這次說的那句話。
        // 不寫進快取——快取 key 是依篩選條件算的，而追問並不會改篩選條件。
        summaryText.value = reply;
        threadItems.value = threadItems.value.slice(-1);
      }
    } else {
      followUpError.value = "目前暫時無法繼續整理，請稍後再試。";
      failedFollowUpText.value = userReply;
    }
  } catch (error: any) {
    if (currentRequestId !== followUpRequestId || error?.name === "AbortError") return;
    console.warn("[IFareSummaryCard][follow-up]", error);
    followUpError.value = "目前暫時無法繼續整理，請稍後再試。";
    failedFollowUpText.value = userReply;
  } finally {
    if (currentRequestId !== followUpRequestId) return;
    followUpDraft.value = "";
    isFollowUpLoading.value = false;
    followUpController.value = null;
    // 摘要與對話串一起寫回快取，重新整理才接得下去
    writeSummaryCache(summaryText.value);
  }
}

/** 重送上一句沒收到回覆的話。先把那顆孤零零的泡泡收回來，避免對話串出現兩句一樣的 */
function retryFollowUp() {
  const text = failedFollowUpText.value;
  if (!text || isFollowUpLoading.value) return;

  if (threadItems.value[threadItems.value.length - 1]?.role === "user") {
    threadItems.value.pop();
  }
  if (conversationMessages.value[conversationMessages.value.length - 1]?.role === "user") {
    conversationMessages.value.pop();
  }
  followUpError.value = "";
  failedFollowUpText.value = "";
  followUpInput.value = text;
  submitFollowUp();
}

function setProvider(provider: ProviderName) {
  if (selectedProvider.value === provider) return;
  selectedProvider.value = provider;
  loadSummary(true);
}

watch(
  () => [props.summaryTriggerKey],
  () => {
    resetFollowUpConversation();
    if (!hasKeyword.value) {
      activeController.value?.abort();
      summaryText.value = "";
      streamError.value = "";
      isLoading.value = false;
      return;
    }

    loadSummary();
  },
  { flush: "post" }
);

watch(
  () => props.summaryResetKey,
  () => {
    activeController.value?.abort();
    resetFollowUpConversation();
    summaryText.value = "";
    streamError.value = "";
    isLoading.value = true;
  }
);

// 推薦的條件組合一換（新的一輪搜尋、或追問補了條件），舊的筆數與勾選就不再對應，
// 先清掉再重查。清單本身照樣先畫出來，不讓使用者為了一個數字等在那裡。
watch(conditionSignature, (signature) => {
  conditionCounts.value = {};
  conditionCountsReady.value = false;
  pickedConditions.value = {};
  if (signature) void refreshConditionCounts();
});

watch(
  () => props.provider,
  () => {
    selectedProvider.value = "groq";
  }
);

watch(selectedProvider, (nextProvider) => {
  if (process.client) {
    localStorage.setItem("ifare-summary-provider", nextProvider);
  }
});

onMounted(() => {
  if (!process.client) return;
  const savedProvider = localStorage.getItem("ifare-summary-provider") as ProviderName | null;
  if (savedProvider && providerOptions.some((item) => item.value === savedProvider)) {
    selectedProvider.value = savedProvider;
  }
  restoreCachedSummary();
});

onBeforeUnmount(() => {
  activeController.value?.abort();
  followUpController.value?.abort();
});
</script>

<style scoped lang="scss">
.ifare-summary-card {
  margin-bottom: 24px;
  padding: 24px;
  border-radius: 28px;
  border: 1px solid rgba(255, 176, 88, 0.32);
  background:
    radial-gradient(circle at top right, rgba(255, 197, 120, 0.26), transparent 28%),
    linear-gradient(135deg, rgba(255, 249, 240, 0.98), rgba(255, 244, 222, 0.92));
  box-shadow: 0 24px 56px rgba(92, 64, 20, 0.13);
  position: relative;
  overflow: hidden;
}

.ifare-summary-card::after {
  content: "";
  position: absolute;
  inset: auto -10% -20% auto;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 193, 105, 0.22), transparent 68%);
  pointer-events: none;
}

.summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.summary-head {
  align-items: flex-start;
}

.summary-head-copy {
  max-width: 560px;
}

.summary-model {
  margin: 4px 0 0;
  color: #8a7a63;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.summary-kicker {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #b96a06;
}

.summary-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #1f190f;
}

.summary-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.provider-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(96, 67, 26, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  align-self: center;
}

.provider-pill {
  min-width: 72px;
  padding: 9px 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: #73592f;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.provider-pill:hover {
  background: rgba(194, 111, 12, 0.08);
  color: #4d391f;
}

.provider-pill.active {
  background: linear-gradient(135deg, #1f190f, #4d391f);
  border-color: rgba(28, 22, 15, 0.2);
  color: #fff;
  box-shadow: 0 10px 22px rgba(28, 22, 15, 0.14);
}

.provider-pill:active {
  transform: translateY(1px);
}

.summary-retry {
  min-width: 96px;
  padding: 10px 14px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #1c160f, #47321f);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  align-self: center;
}

.summary-retry:disabled {
  cursor: wait;
  opacity: 0.7;
}

.top-case-card {
  display: flex;
  gap: 14px;
  align-items: stretch;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(96, 67, 26, 0.1);
  box-shadow: 0 12px 24px rgba(92, 64, 20, 0.08);
}

.top-case-rank {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #2a2118, #7f5b2f);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.top-case-copy {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.top-case-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.top-case-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  color: #1d160f;
}

.top-case-area {
  margin: 0;
  font-size: 13px;
  color: #8c6b3b;
}

.top-case-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.top-case-flags span {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(239, 229, 214, 0.8);
  color: #92744b;
  font-size: 12px;
}

.top-case-flags span.active {
  background: rgba(194, 111, 12, 0.14);
  color: #ad6500;
}

.summary-body {
  padding: 18px 2px 8px;
}

.summary-loading {
  display: grid;
  justify-items: start;
  gap: 10px;
  min-height: 104px;
}

.summary-spinner {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 3px solid rgba(194, 111, 12, 0.18);
  border-top-color: #b26000;
  animation: spin 0.9s linear infinite;
}

.summary-loading-text {
  margin: 0;
  color: #7b5b2e;
  font-size: 14px;
  font-weight: 700;
}

.summary-markdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-markdown :deep(p),
.summary-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.85;
  color: #2e2619;
}

.summary-markdown :deep(ul),
.summary-markdown :deep(ol) {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 8px;
}

.summary-markdown :deep(li) {
  line-height: 1.8;
  color: #2e2619;
}

.summary-markdown :deep(strong) {
  color: #1d160f;
  font-weight: 800;
}

.summary-markdown :deep(h4.summary-section-title) {
  margin: 10px 0 0;
  padding-top: 4px;
  font-size: 18px;
  line-height: 1.4;
  font-weight: 800;
  color: #1d160f;
}

/* 摘要各區塊依序淡入，模擬搜尋引擎 AI 摘要逐段浮現的效果 */
.summary-markdown :deep(> *) {
  animation: summary-block-in 0.5s ease both;
}

.summary-markdown :deep(> *:nth-child(2)) { animation-delay: 0.1s; }
.summary-markdown :deep(> *:nth-child(3)) { animation-delay: 0.2s; }
.summary-markdown :deep(> *:nth-child(4)) { animation-delay: 0.3s; }
.summary-markdown :deep(> *:nth-child(5)) { animation-delay: 0.4s; }
.summary-markdown :deep(> *:nth-child(6)) { animation-delay: 0.5s; }
.summary-markdown :deep(> *:nth-child(n + 7)) { animation-delay: 0.6s; }

@keyframes summary-block-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .summary-markdown :deep(> *) {
    animation: none;
  }
}

/* [參考 N] 引用膠囊：仿搜尋引擎 AI 摘要的來源標記，點了直接進政策內頁 */
.summary-markdown :deep(.summary-inline-reference) {
  display: inline-block;
  margin: 0 3px;
  padding: 1px 9px;
  border-radius: 999px;
  background: rgba(194, 111, 12, 0.1);
  border: 1px solid rgba(194, 111, 12, 0.24);
  color: #8d4b00;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.6;
  text-decoration: none;
  vertical-align: 1px;
  white-space: nowrap;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.summary-markdown :deep(.summary-inline-reference:hover) {
  background: rgba(194, 111, 12, 0.18);
  border-color: rgba(141, 75, 0, 0.4);
  color: #6d3a00;
}

.summary-markdown :deep(.summary-inline-link) {
  color: #b26000;
  font-weight: 800;
  text-decoration: none;
  border-bottom: 1px solid rgba(178, 96, 0, 0.28);
}

.summary-markdown :deep(.summary-inline-link:hover) {
  color: #8d4b00;
  border-bottom-color: rgba(141, 75, 0, 0.5);
}

.summary-markdown :deep(code) {
  padding: 0.1rem 0.3rem;
  border-radius: 6px;
  background: rgba(194, 111, 12, 0.08);
  color: #8d4b00;
  font-size: 0.95em;
}

.summary-empty {
  padding: 12px 2px 4px;
}

.summary-cursor {
  display: inline-block;
  margin-top: 8px;
  color: #bd720f;
  font-weight: 700;
  animation: blink 1s steps(1) infinite;
}

.summary-error {
  margin: 10px 0 0;
  color: #a54b16;
  font-size: 13px;
}

.summary-conversation {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 16px;
  margin-top: 12px;
  padding-top: 18px;
  border-top: 1px solid rgba(150, 100, 34, 0.14);
}

.summary-message-list {
  display: grid;
  gap: 10px;
}

.summary-message {
  box-sizing: border-box;
  width: fit-content;
  max-width: min(88%, 720px);
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid rgba(96, 67, 26, 0.1);
}

.summary-message.is-user {
  justify-self: end;
  background: #f45a08;
  border-color: #f45a08;
  color: #ffffff;
}

.summary-message.is-assistant {
  justify-self: start;
  background: rgba(255, 255, 255, 0.88);
  color: #2e2619;
}

.summary-message.is-streaming {
  opacity: 0.84;
}

/*
  AI 的回答不做成泡泡：裡面是段落標題、列點與 [參考 N] 連結的完整版面，
  塞進氣泡會擠成一團。改成整欄寬度、左側一道色條標示這是回覆。
*/
.summary-answer {
  justify-self: stretch;
  box-sizing: border-box;
  width: 100%;
  padding: 2px 0 2px 14px;
  border-left: 3px solid rgba(244, 90, 8, 0.4);
}

/* 推薦理由：小字、以「・」串起來，不搶政策名稱的視線 */
.top-case-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: #8a6a3a;
}

.top-case-reasons span + span::before {
  content: "・";
  margin-right: 8px;
  color: #c2a97f;
}

.summary-answer-action {
  margin-top: 12px;
}

.summary-answer-label {
  display: block;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 800;
  color: #a2622a;
}

.summary-answer .summary-markdown :deep(p),
.summary-answer .summary-markdown :deep(li) {
  font-size: 15px;
}

/* 回答是摘要的下一層，段落標題要比上面那份小一階，層級才讀得出來 */
.summary-answer .summary-markdown :deep(h4.summary-section-title) {
  font-size: 16px;
}

.summary-message-label {
  display: block;
  margin-bottom: 3px;
  font-size: 11px;
  font-weight: 800;
  color: inherit;
  opacity: 0.76;
}

.summary-message p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.summary-followup-form {
  display: grid;
  gap: 7px;
}

.summary-message-pending {
  margin: 0;
  color: #8a7a63;
  font-size: 13px;
}

.summary-followup-retry {
  margin-left: 8px;
  padding: 2px 10px;
  border: 1px solid currentColor;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.summary-followup-retry:hover {
  background: rgba(214, 62, 20, 0.08);
}

.summary-followup-label {
  color: #5c431f;
  font-size: 13px;
  font-weight: 800;
}

.summary-active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.summary-active-filters-label {
  color: #8a7a63;
  font-size: 13px;
  font-weight: 800;
}

.summary-active-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(92, 67, 31, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  color: #5c431f;
  font-size: 13px;
  padding: 5px 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.summary-active-chip:hover,
.summary-active-chip:focus-visible {
  background: #fff;
  border-color: rgba(92, 67, 31, 0.55);
}

.summary-active-chip-key {
  color: #8a7a63;
  font-size: 12px;
}

.summary-active-chip-value {
  font-weight: 800;
}

.summary-active-chip-x {
  color: #8a7a63;
  font-size: 15px;
  line-height: 1;
}

.summary-active-chip:hover .summary-active-chip-x {
  color: #b3541e;
}

.summary-result-breakdown {
  margin: -6px 0 14px;
  color: #8a7a63;
  font-size: 13px;
  line-height: 1.7;
}

.summary-relax {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed rgba(92, 67, 31, 0.25);
}

.summary-relax-label {
  color: #5c431f;
  font-size: 13px;
  font-weight: 800;
  margin: 0;
}

.summary-relax-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-relax-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  border: 1px solid rgba(92, 67, 31, 0.3);
  border-radius: 999px;
  background: #fff;
  color: #5c431f;
  font-size: 14px;
  padding: 7px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.summary-relax-chip strong {
  font-weight: 800;
  color: #b3541e;
}

.summary-relax-chip:hover,
.summary-relax-chip:focus-visible {
  background: #5c431f;
  border-color: #5c431f;
  color: #fff;
}

.summary-relax-chip:hover strong,
.summary-relax-chip:focus-visible strong {
  color: #ffd9a8;
}

.summary-narrow {
  display: grid;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed rgba(92, 67, 31, 0.25);
}

.summary-narrow-label {
  color: #5c431f;
  font-size: 13px;
  font-weight: 800;
  margin: 0;
}

/* 勾了還沒套用時整區框起來：這一區的狀態跟畫面上其他地方不一致，要看得出來 */
.summary-narrow.has-pending {
  border: 1px solid #b3541e;
  border-radius: 16px;
  padding: 14px;
}

.summary-narrow-list {
  display: grid;
  gap: 8px;
}

.summary-narrow-check,
.summary-narrow-pick {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  border-radius: 14px;
  padding: 10px 14px;
}

.summary-narrow-check {
  border: 1px solid rgba(92, 67, 31, 0.3);
  background: #fff;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.summary-narrow-check:hover,
.summary-narrow-check:focus-within {
  border-color: #5c431f;
  background: #fffaf2;
}

/* 勾起來要整列看得出來，不然只有左邊一個小方塊在變，很容易以為沒點到 */
.summary-narrow-check.is-picked {
  border-color: #b3541e;
  background: #fff3e6;
  box-shadow: inset 0 0 0 1px #b3541e;
}

.summary-narrow-check input {
  flex: none;
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: #b3541e;
  cursor: pointer;
}

/* 猜不到值的那一列（戶籍地）用虛線，跟「已經幫你挑好一個」的實線勾選框區隔 */
.summary-narrow-pick {
  border: 1px dashed rgba(92, 67, 31, 0.35);
}

.summary-narrow-kind {
  flex: none;
  color: #8a7a63;
  font-size: 12px;
  font-weight: 800;
}

.summary-narrow-value {
  color: #5c431f;
  font-size: 15px;
  font-weight: 800;
}

.summary-narrow-count {
  margin-left: auto;
  color: #b3541e;
  font-size: 13px;
  font-weight: 800;
}

.summary-narrow-pick-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-narrow-select {
  flex: 1 1 180px;
  min-width: 0;
  max-width: 260px;
  border: 1px solid rgba(92, 67, 31, 0.3);
  border-radius: 999px;
  background: #fff;
  color: #5c431f;
  font-size: 14px;
  font-weight: 700;
  padding: 7px 14px;
  cursor: pointer;
}

.summary-narrow-select:hover,
.summary-narrow-select:focus-visible {
  border-color: #5c431f;
}

.summary-narrow-option {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  border: 1px solid rgba(92, 67, 31, 0.3);
  border-radius: 999px;
  background: #fff;
  color: #5c431f;
  font-size: 14px;
  font-weight: 700;
  padding: 6px 14px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.summary-narrow-option strong {
  color: #b3541e;
  font-size: 12px;
  font-weight: 800;
}

.summary-narrow-option:hover,
.summary-narrow-option:focus-visible {
  border-color: #5c431f;
  background: #fffaf2;
}

.summary-narrow-option.active {
  background: #5c431f;
  border-color: #5c431f;
  color: #fff;
}

.summary-narrow-option.active strong {
  color: #ffd9a8;
}

.summary-narrow-tick {
  font-weight: 900;
  line-height: 1;
}

.summary-narrow-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-narrow-apply {
  border: 0;
  border-radius: 999px;
  background: #b3541e;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  padding: 9px 22px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.summary-narrow-apply:hover:not(:disabled),
.summary-narrow-apply:focus-visible:not(:disabled) {
  background: #8f4116;
}

/* 一個都沒勾是合法狀態，按鈕停用但不該看起來像壞掉 */
.summary-narrow-apply:disabled {
  background: rgba(92, 67, 31, 0.25);
  cursor: not-allowed;
}

.summary-narrow-note {
  color: #8a7a63;
  font-size: 12px;
}

/* 有東西被勾起來、卻還沒按套用時的提示。要比一般註記醒目，
   因為那一刻畫面上的摘要與政策卡都還沒變，最容易被誤會成篩選壞掉。 */
.summary-narrow-pending {
  color: #b3541e;
  font-size: 13px;
  font-weight: 800;
}

@media (max-width: 768px) {
  .summary-narrow-count {
    margin-left: 0;
  }
}

.summary-policy-chip {
  border: 1px solid rgba(92, 67, 31, 0.3);
  border-radius: 999px;
  background: #fff;
  color: #5c431f;
  font-size: 14px;
  font-weight: 700;
  padding: 7px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.summary-policy-chip:hover,
.summary-policy-chip:focus-visible {
  background: #5c431f;
  border-color: #5c431f;
  color: #fff;
}

.summary-followup-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: stretch;
}

.summary-followup-controls input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 48px;
  padding: 0 14px;
  border: 1px solid rgba(96, 67, 26, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  color: #2e2619;
  font: inherit;
  outline: none;
}

.summary-followup-controls input:focus {
  border-color: #e9580c;
  box-shadow: 0 0 0 3px rgba(233, 88, 12, 0.12);
}

.summary-followup-controls input::placeholder {
  color: #9b8b75;
}

.summary-followup-controls button {
  min-width: 72px;
  height: 48px;
  padding: 0 16px;
  border: 0;
  border-radius: 6px;
  background: #f45a08;
  color: #ffffff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.summary-followup-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.summary-followup-error {
  margin: 0;
  color: #a54b16;
  font-size: 12px;
}

.summary-references {
  width: 100%;
  box-sizing: border-box;
  margin-top: 18px;
  padding: 10px 12px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(96, 67, 26, 0.1);
  box-shadow: 0 10px 20px rgba(92, 64, 20, 0.04);
}

.reference-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 0 8px;
}

.reference-label,
.reference-count {
  font-size: 12px;
  font-weight: 800;
  color: #8a611f;
  letter-spacing: 0.06em;
}

.reference-card-list {
  display: grid;
  width: 100%;
  box-sizing: border-box;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 16px;
  margin-top: 2px;
  align-items: stretch;
}

.reference-card-link {
  display: block;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  text-decoration: none;
}

.reference-card-link .top-case-card {
  width: 100%;
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.reference-case-card {
  gap: 6px;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(92, 64, 20, 0.06);
}

.reference-case-card .top-case-rank {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 10px;
}

.reference-case-card .top-case-title {
  font-size: 12px;
  line-height: 1.3;
}

.reference-case-card .top-case-area {
  font-size: 11px;
  line-height: 1.3;
}

.reference-case-card .top-case-bottom {
  gap: 3px;
}

.reference-case-card .top-case-flags {
  gap: 3px;
}

.reference-case-card .top-case-flags span {
  padding: 2px 5px;
  font-size: 9px;
  line-height: 1.1;
}

.reference-card-link:hover .top-case-card {
  transform: translateY(-1px);
  border-color: rgba(194, 111, 12, 0.22);
  box-shadow: 0 10px 16px rgba(92, 64, 20, 0.06);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (max-width: 1024px) {
  .reference-card-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .ifare-summary-card {
    padding: 18px 16px;
    border-radius: 22px;
  }

  .summary-head,
  .summary-tools {
    flex-direction: column;
    align-items: flex-start;
  }

  .provider-switch {
    width: 100%;
  }

  .provider-pill {
    flex: 1 1 auto;
  }

  .summary-retry {
    width: 100%;
  }

  .summary-title {
    font-size: 20px;
  }

  .summary-markdown :deep(h4.summary-section-title) {
    font-size: 16px;
  }

  .top-case-card {
    flex-direction: column;
  }

  .top-case-copy {
    height: auto;
  }

  .top-case-bottom {
    margin-top: 0;
  }

  .reference-card-list {
    grid-template-columns: 1fr;
  }

  .summary-message {
    max-width: 94%;
  }

  .summary-followup-controls {
    grid-template-columns: minmax(0, 1fr) 64px;
    gap: 8px;
  }

  .summary-followup-controls button {
    min-width: 64px;
    padding: 0 10px;
  }
}
</style>
