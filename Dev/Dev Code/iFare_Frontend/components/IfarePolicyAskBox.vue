<template>
  <!-- 政策沒載到就整區不出現，不要留一個問不出東西的框 -->
  <section class="policy-ask" v-if="policy">
    <div class="policy-ask-head">
      <h2 class="policy-ask-title">想再問這筆政策什麼？</h2>
      <p class="policy-ask-note">
        AI 只會依照這一頁的政策資料回答；資料沒寫到的部分會直接說明未載明，實際規定請以承辦單位公告為準。
      </p>
    </div>

    <ol class="list-unstyled policy-ask-thread" v-if="threadItems.length > 0">
      <li class="policy-ask-turn" v-for="(turn, index) in threadItems" :key="index">
        <p class="policy-ask-question">{{ turn.question }}</p>
        <div class="policy-ask-answer" v-if="turn.answer" v-html="renderAnswer(turn.answer)"></div>
        <p class="policy-ask-answer policy-ask-answer--failed" v-else-if="turn.error">{{ turn.error }}</p>
        <p class="policy-ask-answer policy-ask-answer--pending" v-else-if="turn.isStreaming">
          <span class="policy-ask-dot"></span>
          <span class="policy-ask-dot"></span>
          <span class="policy-ask-dot"></span>
          <span class="sr-only">正在回答</span>
        </p>
      </li>
    </ol>

    <!--
      還沒問過任何東西時給幾顆可以直接點的問句。三題分別對應明細裡的三個欄位：
      應備文件（evidence）、福利內容（welfareInfo）、承辦單位（officeUnitInfo）。
      問過一次就收起來——那時使用者已經知道這個框能做什麼了。
    -->
    <div class="policy-ask-quick" v-if="threadItems.length === 0">
      <span class="policy-ask-quick-label">可以直接點：</span>
      <button
        v-for="question in QUICK_QUESTIONS"
        :key="question"
        type="button"
        class="policy-ask-chip"
        :disabled="isLoading"
        @click="ask(question)"
      >{{ question }}</button>
    </div>

    <form class="policy-ask-form" @submit.prevent="ask(inputText)">
      <label class="sr-only" for="ifare-policy-ask">針對這筆政策提問</label>
      <input
        id="ifare-policy-ask"
        v-model="inputText"
        class="policy-ask-input"
        type="text"
        :maxlength="ASK_MAX_LENGTH"
        :disabled="isLoading"
        placeholder="例如：申請要準備哪些文件？"
        autocomplete="off"
      />
      <button type="submit" class="policy-ask-submit" :disabled="isLoading || !inputText.trim()">
        {{ isLoading ? "回答中" : "送出" }}
      </button>
    </form>

    <p class="policy-ask-error" v-if="errorMessage">{{ errorMessage }}</p>
  </section>
</template>

<script setup lang="ts">
interface AskPolicy {
  id: number;
  title: string;
  area: string;
  qualification: string;
  hasRecipient: boolean;
  hasIncome: boolean;
  hasIndentity: boolean;
}

interface AskTurn {
  question: string;
  answer: string;
  isStreaming: boolean;
  error: string;
}

const props = defineProps<{ policy: AskPolicy | null }>();

const ASK_MAX_LENGTH = 60;
/** 一點就送出的建議問句，對應明細裡一定會有的三個欄位 */
const QUICK_QUESTIONS = ["要準備什麼文件？", "補助金額大概多少？", "要去哪裡申請？"];
const ASK_ERROR_MESSAGE = "AI 回答暫時無法使用，請稍後再試，或直接洽詢下方承辦單位。";
/**
 * 送去伺服器的對話只留最近幾輪。明細頁的問題彼此多半獨立（文件、金額、窗口），
 * 舊的問答留著只會擠掉提示詞裡真正該放的政策明細。
 */
const ASK_HISTORY_TURNS = 3;

const { $llm } = useNuxtApp();
const threadItems = ref<AskTurn[]>([]);
const inputText = ref("");
const isLoading = ref(false);
const errorMessage = ref("");

// 換一筆政策就把對話清掉。這頁換 id 時是同一個元件實例重抓資料（見本頁的 route.query.id watcher），
// 不清的話上一筆的問答會留在新政策底下，看起來像是在講這一筆。
watch(
  () => props.policy?.id,
  () => {
    threadItems.value = [];
    inputText.value = "";
    errorMessage.value = "";
  }
);

function renderAnswer(text: string) {
  return useSanitize(renderMarkdownBlocks(text, renderInlineMarkdownWithoutReferences));
}

async function ask(rawQuestion: string) {
  const question = (rawQuestion || "").trim().slice(0, ASK_MAX_LENGTH);
  const policy = props.policy;
  if (!question || isLoading.value || !policy?.id) return;

  errorMessage.value = "";
  inputText.value = "";
  isLoading.value = true;

  const turn = reactive<AskTurn>({ question, answer: "", isStreaming: true, error: "" });
  threadItems.value.push(turn);

  // 只帶已經答完的幾輪。還在串流或失敗的那一輪不算數，送半截答案過去只會誤導下一輪。
  const history = threadItems.value
    .slice(0, -1)
    .filter((item) => item.answer && !item.error)
    .slice(-ASK_HISTORY_TURNS)
    .flatMap((item) => [
      { role: "user" as const, content: item.question },
      { role: "assistant" as const, content: item.answer },
    ]);

  try {
    const finalText = await $llm.streamSummarizeCases({
      query: policy.title,
      cases: [
        {
          id: policy.id,
          title: policy.title,
          area: policy.area,
          qualification: policy.qualification,
          hasRecipient: policy.hasRecipient,
          hasIncome: policy.hasIncome,
          hasIndentity: policy.hasIndentity,
        },
      ],
      conversation: [...history, { role: "user", content: question }],
      focusPolicy: true,
      onChunk: (_chunk: string, fullText: string) => {
        turn.answer = fullText;
      },
    });

    turn.answer = finalText || turn.answer;
    if (!turn.answer) turn.error = ASK_ERROR_MESSAGE;
  } catch (error) {
    // 沒答出來就把那一輪標成失敗，不要靜靜留一個空泡泡讓使用者以為還在跑
    turn.error = ASK_ERROR_MESSAGE;
    errorMessage.value = ASK_ERROR_MESSAGE;
  } finally {
    turn.isStreaming = false;
    isLoading.value = false;
  }
}
</script>

<style scoped>
/* 色票沿用全站 assets/style/_color.scss：主色 #00ADB2、CTA 橘 #EA5504、內文 #171818 */
.policy-ask {
  border: 1px solid #d1d1d1;
  border-radius: 16px;
  background: #fff;
  padding: 28px 32px;
  margin-top: 24px;
}

.policy-ask-head {
  margin-bottom: 18px;
}

.policy-ask-title {
  color: #171818;
  font-size: 20px;
  font-weight: 500;
  line-height: 32px;
  margin: 0 0 6px;
}

.policy-ask-note {
  color: #8b8b8b;
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
}

.policy-ask-thread {
  margin: 0 0 18px;
}

.policy-ask-turn + .policy-ask-turn {
  margin-top: 20px;
  border-top: 1px solid #f3f3f3;
  padding-top: 20px;
}

.policy-ask-question {
  color: #171818;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.8;
  margin: 0 0 10px;
}

.policy-ask-question::before {
  content: "您問：";
  color: #8b8b8b;
  font-weight: 400;
}

.policy-ask-answer {
  color: #171818;
  font-size: 16px;
  line-height: 2;
  margin: 0;
}

.policy-ask-answer :deep(p) {
  margin: 0 0 10px;
}

.policy-ask-answer :deep(ul),
.policy-ask-answer :deep(ol) {
  margin: 0 0 10px;
  padding-left: 1.25rem;
  /* 這個 ul 巢在外層 ol 裡，瀏覽器預設會退成空心圓點，要寫死回實心 */
  list-style: disc;
}

.policy-ask-answer :deep(li) {
  margin-bottom: 6px;
}

.policy-ask-answer :deep(.summary-section-title) {
  color: #007d81;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.8;
  margin: 16px 0 8px;
}

.policy-ask-answer--failed {
  color: #ea5504;
}

.policy-ask-answer--pending {
  display: flex;
  gap: 6px;
  align-items: center;
  min-height: 32px;
}

.policy-ask-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00adb2;
  animation: policy-ask-blink 1.2s infinite ease-in-out;
}

.policy-ask-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.policy-ask-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes policy-ask-blink {
  0%,
  80%,
  100% {
    opacity: 0.25;
  }
  40% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .policy-ask-dot {
    animation: none;
    opacity: 0.6;
  }
}

.policy-ask-quick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.policy-ask-quick-label {
  color: #8b8b8b;
  font-size: 14px;
}

.policy-ask-chip {
  border: 1px solid #00adb2;
  border-radius: 999px;
  background: #fff;
  color: #007d81;
  font-size: 14px;
  line-height: 1.6;
  padding: 7px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.policy-ask-chip:hover:not(:disabled),
.policy-ask-chip:focus-visible:not(:disabled) {
  background: #00adb2;
  color: #fff;
}

.policy-ask-chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.policy-ask-form {
  display: flex;
  gap: 10px;
}

.policy-ask-input {
  flex: 1 1 auto;
  min-width: 0;
  border: 1px solid #d1d1d1;
  border-radius: 8px;
  padding: 11px 14px;
  font-size: 16px;
  color: #171818;
  background: #fff;
}

.policy-ask-input::placeholder {
  color: #8b8b8b;
}

.policy-ask-input:focus-visible {
  outline: 2px solid #00adb2;
  outline-offset: 1px;
}

.policy-ask-submit {
  flex: 0 0 auto;
  border: 0;
  border-radius: 8px;
  background: #ea5504;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  padding: 11px 28px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.policy-ask-submit:hover:not(:disabled) {
  background: #c84804;
}

.policy-ask-submit:disabled {
  background: #d1d1d1;
  cursor: not-allowed;
}

.policy-ask-error {
  color: #ea5504;
  font-size: 15px;
  margin: 12px 0 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 576px) {
  .policy-ask {
    padding: 20px;
  }

  .policy-ask-form {
    flex-wrap: wrap;
  }

  .policy-ask-submit {
    width: 100%;
  }
}
</style>
