<template>
  <Transition name="chatbot-window" @after-leave="handleAfterLeave">
    <section
      v-if="isOpen"
      class="chatbot-window"
      role="dialog"
      aria-labelledby="chatbot-title"
      aria-modal="false"
    >
      <header class="chatbot-header">
        <div class="header-avatar" aria-hidden="true">
          <img class="header-avatar-img" :src="mascotHead" alt="" />
          <img class="header-avatar-eye header-avatar-eye-left" :src="mascotEyeOpen" alt="" />
          <img class="header-avatar-eye header-avatar-eye-right" :src="mascotEyeOpen" alt="" />
          <img class="header-avatar-mouth" :src="mascotSmileOpen" alt="" />
        </div>
        <div class="header-info">
          <h3 id="chatbot-title" class="header-name">芒寶-網頁導覽員</h3>
          <!-- 不顯示在線狀態，保留標題即可。 -->
          <!-- <span class="header-status">{{ chatbotStatusText }}</span> -->
        </div>
        <button
          type="button"
          class="header-action"
          aria-label="清除對話"
          data-island="清除對話"
          data-island-style="button"
          @click="resetConversation()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="m8 6 1 13h6l1-13" />
          </svg>
        </button>
        <button
          type="button"
          class="header-close"
          aria-label="關閉芒寶-網頁導覽員"
          data-island="關閉芒寶-網頁導覽員"
          data-island-style="button"
          @click="handleClose"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div
        ref="bodyRef"
        class="chatbot-body"
        :class="{ 'is-welcome': messages.length === 0, 'has-messages': messages.length > 0 }"
      >
        <template v-if="messages.length === 0">
          <!-- 對話框名稱只顯示在上方 header，不在內容區重複。 -->
          <section class="mangbao-intro" aria-label="芒寶開場">
            <div class="mangbao-intro-bubble">
              <p>
                嗨，我是芒寶，網站小導覽員來報到！想認識基金會，或想知道頁面與按鈕怎麼用，都可以問我~
              </p>
            </div>
          </section>

          <!--
          <section class="welcome-block">
            <p class="welcome-kicker">芒寶-網頁導覽員</p>
            <h4 class="welcome-title">{{ welcomeTitle }}</h4>
            <p class="welcome-copy">
              {{ welcomeCopy }}
            </p>
          </section>
          -->
          <!-- 先收斂初始提示，讓使用者自行輸入問題。 -->
          <!--
          <section class="suggestion-section">
            <span class="suggestion-label">你也可以直接問</span>
            <div class="suggestion-chips" role="group" aria-label="常見問題">
              <button
                v-for="chip in suggestionChips"
                :key="chip"
                type="button"
                class="chip-suggestion"
                :data-island="chip"
                data-island-style="link"
                @click="runQuickAction(chip)"
              >
                {{ chip }}
              </button>
            </div>
          </section>
          -->

        </template>

        <template v-else>
          <div class="messages-list" role="log" aria-live="polite" aria-label="聊天紀錄">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="['message', `message-${message.role}`, { 'is-error': message.isError }]"
              :data-message-id="message.id"
            >
              <div class="message-content">
                <div class="message-bubble" v-html="message.contentHtml" />
                <div v-if="message.links?.length" class="message-links" aria-label="相關站內連結">
                  <NuxtLink
                    v-for="link in message.links"
                    :key="`${message.id}-${link.path}`"
                    :to="link.path"
                    class="message-link"
                  >
                    {{ link.label }}
                  </NuxtLink>
                </div>
              </div>
            </div>

          <div v-if="isBotTyping" class="message message-bot">
              <div class="message-bubble typing-bubble" aria-label="芒寶-網頁導覽員回覆中">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          <!--
          依需求取消站內導覽 follow-up 按鈕；保留 markup 方便後續恢復。
          <section v-if="actionGroups.length > 0" class="follow-up-panel">
            <div
              v-for="group in actionGroups"
              :key="group.title"
              class="follow-up-group"
            >
              <span class="follow-up-title">{{ group.title }}</span>
              <div class="follow-up-actions">
                <button
                  v-for="action in group.actions.filter((item) => item.type === 'message')"
                  :key="action.label"
                  type="button"
                  class="follow-up-action"
                  :data-island="action.label"
                  :data-island-style="action.variant"
                  @click="runFollowUpAction(action)"
                >
                  {{ action.label }}
                </button>
                <NuxtLink
                  v-for="action in group.actions.filter((item) => item.type === 'route')"
                  :key="action.label"
                  :to="action.to || '/'"
                  class="follow-up-action"
                  :data-island="action.label"
                  :data-island-style="action.variant"
                >
                  {{ action.label }}
                </NuxtLink>
                <a
                  v-for="action in group.actions.filter((item) => item.type === 'link')"
                  :key="action.label"
                  :href="action.href"
                  :target="action.target || undefined"
                  :rel="action.target === '_blank' ? 'noopener noreferrer' : undefined"
                  class="follow-up-action"
                  :data-island="action.label"
                  :data-island-style="action.variant"
                >
                  {{ action.label }}
                </a>
              </div>
            </div>
          </section>
          -->
        </template>

        <section class="quick-actions" role="group" aria-label="腳本選項">
          <button
            v-for="action in quickActions"
            :key="action.key"
            type="button"
            class="quick-action-btn"
            :data-island="action.label"
            data-island-style="card"
            @click="runQuickAction(action.prompt)"
          >
            <span class="qa-label">{{ action.label }}</span>
          </button>
        </section>
      </div>

      <form class="chatbot-input" @submit.prevent="handleSubmit">
        <input
          ref="inputRef"
          v-model="inputText"
          type="text"
          class="input-message"
          placeholder="輸入問題"
          aria-label="輸入訊息"
          autocomplete="off"
          maxlength="200"
          data-island="輸入問題"
          data-island-style="field"
          @keydown.enter.prevent="handleSubmit"
        />
        <button
          type="submit"
          class="btn-send"
          :disabled="!canSend"
          :aria-label="isBotTyping ? '芒寶-網頁導覽員回覆中' : '送出問題'"
          data-island="送出問題"
          data-island-style="button"
          @click.prevent="handleSubmit"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import mascotEyeOpen from '~/IP/eye_open.png';
import mascotHead from '~/IP/Head.png';
import mascotSmileOpen from '~/IP/smile.png';

type ChatRole = 'user' | 'bot';
type ChatbotRunMode = 'script' | 'ai' | 'hybrid';
type ChatbotApiMode = ChatbotRunMode;
type ActionVariant = 'button' | 'link' | 'card';
type FollowUpActionType = 'message' | 'route' | 'link';

interface QuickAction {
  key: string;
  label: string;
  prompt: string;
  icon: string;
}

interface ChatMessage {
  id: number;
  role: ChatRole;
  content: string;
  contentHtml: string;
  isError?: boolean;
  links?: ChatbotInternalLink[];
}

interface ChatbotInternalLink {
  label: string;
  path: string;
}

interface ChatbotApiResponse {
  configured: boolean;
  mode?: ChatbotRunMode;
  model?: string;
  source?: string;
  errorCode?: string;
  retryable?: boolean;
  reply: string;
  links?: ChatbotInternalLink[];
}

interface FollowUpAction {
  label: string;
  type: FollowUpActionType;
  variant: ActionVariant;
  prompt?: string;
  to?: string;
  href?: string;
  target?: '_blank';
}

interface FollowUpGroup {
  title: string;
  actions: FollowUpAction[];
}

// === 聊天模式（script / ai / hybrid）：切換 UI 已移除，以下為刻意保留的殘留邏輯 ===
// 前台原本有一排模式切換鈕讓使用者自選「快速導覽／智能回覆／綜合協助」，該 UI 已從 template 拿掉，
// 所以現在實際執行的模式永遠是 CHATBOT_DEFAULT_MODE（'ai'），三種模式的切換邏輯都不會被觸發。
// 相關殘留：chatbotModeOptions、isChatbotRunMode、persistChatbotMode、setChatbotMode
// 以及 .chatbot-mode-switch 系列樣式。保留是為了日後可能恢復切換功能，請勿刪除。

// Default runtime mode（三種模式都由後端 /api/chatbot 處理）。
// - 'script': 只用答案卡，完全不呼叫 LLM
// - 'ai'    : 答案卡 → LLM 選卡 → LLM 生成
// - 'hybrid': 同 'ai'
const CHATBOT_DEFAULT_MODE = 'ai' as ChatbotRunMode;
// 這個 key 目前只會被「寫入」和「刪除」，永遠讀不到：
// persistChatbotMode() 雖然會寫進 localStorage，但 onMounted 一掛載就無條件 removeItem 並強制回預設值，
// 因此就算真的寫進去了，下次開頁面也一定會被清掉。保留 key 是為了日後恢復切換功能時沿用同一個名稱。
const CHATBOT_MODE_STORAGE_KEY = 'ifare-chatbot-mode';

// 「正在輸入」的最短顯示時間。
// 答案卡命中時後端約 15ms 就回覆了，硬等 3 秒會讓人以為當掉；
// 但完全不等又會讓泡泡瞬間閃過，所以保留一小段。
// LLM 路徑本來就要花 1 秒以上，這個下限通常不會生效。
const CHATBOT_THINKING_DELAY_MS = 1200;
const CHATBOT_CARD_THINKING_DELAY_MS = 450;
/** 由基金會事先撰寫、100% 固定語氣的回覆來源 */
const FIXED_ANSWER_SOURCES = new Set(['card', 'card_llm']);

const REQUEST_FAILED_REPLY =
  '芒寶這邊連線不太順，請稍等一下再問一次，或直接使用上方選單找找看。';

// 模式切換鈕的文案來源。切換 UI 已移除，template 裡沒有任何地方在讀這個陣列，
// 保留是為了日後恢復切換功能時不必重寫文案。
const chatbotModeOptions: Array<{ value: ChatbotRunMode; label: string; description: string }> = [
  { value: 'script', label: '快速導覽', description: '優先提供站內入口與常見問題方向' },
  { value: 'ai', label: '智能回覆', description: '協助整理開放式問題與站內資訊' },
  { value: 'hybrid', label: '綜合協助', description: '常見問題快速引導，進階問題再整理回覆' },
];

// 2026-06-08 UIUX #192 — icon 以 v-html 渲染，務必維持「寫死的可信 SVG 常數」；切勿改成使用者/CMS 可控來源（否則 XSS）
const quickActions: QuickAction[] = [
  {
    key: 'site',
    label: '認識長穩',
    prompt: '介紹認識長穩頁面',
    icon: '',
  },
  {
    key: 'news',
    label: '最新消息',
    prompt: '介紹最新消息頁面',
    icon: '',
  },
  {
    key: 'articles',
    label: '福利專欄',
    prompt: '介紹福利專欄頁面',
    icon: '',
  },
  {
    key: 'partners',
    label: '公益夥伴',
    prompt: '介紹公益夥伴頁面',
    icon: '',
  },
  {
    key: 'ifare',
    label: 'i-Fare平台',
    prompt: '介紹 i-Fare 平台',
    icon: '',
  },
];

const suggestionChips = [
  '有哪些常見問題？',
  '老人福利',
  '生育補助',
  '我要找福利政策',
  '如何聯絡基金會？',
];

const isOpen = defineModel<boolean>('open', { default: false });
const inputText = ref('');
const messages = ref<ChatMessage[]>([]);
const isBotTyping = ref(false);
const bodyRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const lastPrompt = ref('');
const lastErrorCode = ref('');
const lastErrorRetryable = ref(false);
const chatSessionId = ref(0);
const shouldResetAfterClose = ref(false);
const selectedChatbotMode = ref<ChatbotRunMode>(CHATBOT_DEFAULT_MODE);

let messageId = 0;

const canSend = computed(() => inputText.value.trim().length > 0 && !isBotTyping.value);
// 不顯示在線狀態，保留標題即可。
// const chatbotStatusText = computed(() => '');
const welcomeTitle = computed(() => {
  return '';
});
const welcomeCopy = computed(() => {
  return '';
});

const actionGroups = computed<FollowUpGroup[]>(() => {
  // 依需求取消站內導覽與錯誤重試按鈕；保留 computed 方便後續恢復。
  return [];
});

function nextId() {
  messageId += 1;
  return messageId;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stripBotHtml(text: string) {
  return text
    .replace(/<a\b[^>]*>(.*?)<\/a>/gis, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '')
    .trim();
}

function formatPlainText(text: string, options?: { stripHtml?: boolean }) {
  const normalized = options?.stripHtml ? stripBotHtml(text) : text;
  return escapeHtml(normalized).replace(/\n/g, '<br>');
}

function formatTrustedHtml(text: string) {
  return useSanitize(text).replace(/\n/g, '<br>');
}

function pushMessage(
  role: ChatRole,
  text: string,
  options?: {
    html?: boolean;
    isError?: boolean;
    stripHtml?: boolean;
    links?: ChatbotInternalLink[];
  },
) {
  const id = nextId();
  messages.value.push({
    id,
    role,
    content: text,
    contentHtml: options?.html ? formatTrustedHtml(text) : formatPlainText(text, { stripHtml: options?.stripHtml }),
    isError: options?.isError,
    links: options?.links,
  });
  return id;
}

async function scrollToBottom() {
  await nextTick();
  if (bodyRef.value) {
    bodyRef.value.scrollTop = bodyRef.value.scrollHeight;
  }
}

async function scrollToMessage(messageId: number) {
  await nextTick();
  const body = bodyRef.value;
  const target = body?.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
  if (!body || !target) return;

  const bodyRect = body.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  body.scrollTop += targetRect.top - bodyRect.top - 8;
}

async function waitForThinkingDelay(startedAt: number, source?: string) {
  const minimumDelay = source && FIXED_ANSWER_SOURCES.has(source)
    ? CHATBOT_CARD_THINKING_DELAY_MS
    : CHATBOT_THINKING_DELAY_MS;
  const remaining = minimumDelay - (Date.now() - startedAt);
  if (remaining <= 0) return;
  await new Promise((resolve) => window.setTimeout(resolve, remaining));
}

function normalizePrompt(prompt: string) {
  return prompt.trim().slice(0, 200);
}

// 2026-08-12：移除前端的 50 字二次截斷。
// 回覆長度已由後端統一把關（LLM 生成限 65 字；答案卡是人撰寫的完整句子，不裁切）。
// 前端再截一次會把答案卡從句子中間切掉，例如 i-Fare 搜尋說明只會顯示到一半。
function normalizeDisplayedReply(reply: string) {
  return String(reply || '')
    .replace(/^(?:好呀|好啊|好的|沒問題)[！!，,。\s]*/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 原本用來驗證從 localStorage 讀出來的字串是不是合法模式。
// onMounted 已改成「不再讀取、直接清除」，所以這個 type guard 目前沒有任何呼叫端；
// 保留是為了日後恢復切換功能時可以直接接回讀取流程。
function isChatbotRunMode(value: unknown): value is ChatbotRunMode {
  return value === 'script' || value === 'ai' || value === 'hybrid';
}

// 把使用者選的模式寫進 localStorage。
// 切換 UI 移除後，唯一會呼叫它的是 setChatbotMode()，而 setChatbotMode() 自己也沒有呼叫點，
// 等於整條寫入路徑都不會被執行；就算執行了，寫進去的值也會在下次 onMounted 被清掉，永遠讀不回來。
// 保留是為了日後恢復切換功能，請勿刪除。
function persistChatbotMode(mode: ChatbotRunMode) {
  if (!import.meta.client) return;

  try {
    localStorage.setItem(CHATBOT_MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('[chatbot] failed to persist mode', error);
  }
}

// 切換聊天模式並清空對話重新開始。
// 整個 template 已經沒有任何按鈕會呼叫它（模式切換 UI 已移除），目前是不會被觸發的死碼。
// 刻意保留，日後恢復切換功能時可直接接回按鈕的 @click，請勿刪除。
function setChatbotMode(mode: ChatbotRunMode) {
  if (isBotTyping.value || selectedChatbotMode.value === mode) return;
  selectedChatbotMode.value = mode;
  persistChatbotMode(mode);
  resetConversation({ focus: false });
}

function uniqueActions(actions: FollowUpAction[]) {
  const seen = new Set<string>();

  return actions.filter((action) => {
    const key = `${action.type}:${action.to || action.href || action.prompt || action.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function requestBotReply(prompt: string, userMessageId: number, startedAt: number) {
  const sessionId = chatSessionId.value;
  lastPrompt.value = prompt;
  lastErrorCode.value = '';
  lastErrorRetryable.value = false;

  try {
    const mode = selectedChatbotMode.value;
    if (mode === 'script') {
      await requestScriptModeReply(prompt, sessionId, startedAt);
      return;
    }

    if (mode === 'ai') {
      await requestAiModeReply(prompt, sessionId, startedAt);
      return;
    }

    await requestHybridModeReply(prompt, sessionId, startedAt);
  } finally {
    if (sessionId === chatSessionId.value) {
      isBotTyping.value = false;
      await scrollToMessage(userMessageId);
    }
  }
}

// 2026-08-12：三種模式一律走 API。
// 原本 script 模式在前端另存一份 24 條規則，與後端知識庫重複維護；
// 現在後端的 mode='script' 就是「只用答案卡、完全不呼叫 LLM」，語意一致且只有一份資料。
async function requestScriptModeReply(prompt: string, sessionId: number, startedAt: number) {
  await requestApiReply(prompt, sessionId, 'script', startedAt);
}

async function requestAiModeReply(prompt: string, sessionId: number, startedAt: number) {
  await requestApiReply(prompt, sessionId, 'ai', startedAt);
}

async function requestHybridModeReply(prompt: string, sessionId: number, startedAt: number) {
  await requestApiReply(prompt, sessionId, 'hybrid', startedAt);
}

/**
 * 一次問答最多等多久（毫秒）。
 *
 * $fetch 沒有預設逾時：後端或模型那端卡住時這個 await 永遠不會回來，
 * isBotTyping 就一直是 true、輸入框從此送不出下一句，只能關掉分頁重來。
 * 逾時之後走原本的連線失敗路徑，顯示重試訊息後仍可繼續提問。
 */
const CHATBOT_REQUEST_TIMEOUT_MS = 30000;

async function requestApiReply(prompt: string, sessionId: number, mode: ChatbotApiMode, startedAt: number) {
  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), CHATBOT_REQUEST_TIMEOUT_MS);

  try {
    const response = await $fetch<ChatbotApiResponse>('/api/chatbot', {
      method: 'POST',
      body: {
        mode,
        message: prompt,
        history: messages.value.slice(-8).map((message) => ({
          role: message.role === 'bot' ? 'assistant' : 'user',
          content: message.content,
        })),
      },
      signal: controller.signal,
    });

    await waitForThinkingDelay(startedAt, response.source);
    if (sessionId !== chatSessionId.value) return;
    pushMessage('bot', normalizeDisplayedReply(response.reply), {
      stripHtml: true,
      links: response.links,
    });

    if (response.errorCode) {
      lastErrorCode.value = response.errorCode;
      lastErrorRetryable.value = Boolean(response.retryable);
    }

  } catch (error) {
    console.warn('[chatbot] request fallback', error);
    await waitForThinkingDelay(startedAt);
    if (sessionId !== chatSessionId.value) return;
    lastErrorCode.value = '';
    lastErrorRetryable.value = false;
    pushMessage('bot', REQUEST_FAILED_REPLY);
  } finally {
    clearTimeout(timeoutTimer);
  }
}

async function sendPrompt(rawPrompt: string) {
  const prompt = normalizePrompt(rawPrompt);
  if (!prompt || isBotTyping.value) return;

  const userMessageId = pushMessage('user', prompt);
  inputText.value = '';
  if (inputRef.value) {
    inputRef.value.value = '';
  }
  isBotTyping.value = true;
  const startedAt = Date.now();
  await scrollToMessage(userMessageId);
  await requestBotReply(prompt, userMessageId, startedAt);
}

async function handleSubmit() {
  await sendPrompt(inputRef.value?.value || inputText.value);
}

async function runQuickAction(prompt: string) {
  inputText.value = prompt;
  await sendPrompt(prompt);
}

async function runFollowUpAction(action: FollowUpAction) {
  if (action.type !== 'message' || !action.prompt) return;
  await sendPrompt(action.prompt);
}

function resetConversation(options?: { focus?: boolean }) {
  chatSessionId.value += 1;
  messages.value = [];
  inputText.value = '';
  lastPrompt.value = '';
  lastErrorCode.value = '';
  lastErrorRetryable.value = false;
  isBotTyping.value = false;

  if (options?.focus === false) {
    return;
  }

  nextTick(() => {
    inputRef.value?.focus();
  });
}

function handleClose() {
  shouldResetAfterClose.value = true;
  isOpen.value = false;
}

function handleAfterLeave() {
  if (!shouldResetAfterClose.value) return;
  shouldResetAfterClose.value = false;
  resetConversation({ focus: false });
}

// 模式切換 UI 移除後，這裡改成「每次掛載都無條件清掉舊設定並強制回 CHATBOT_DEFAULT_MODE」，
// 為的是不讓早期版本殘留在使用者瀏覽器裡的 'script' / 'hybrid' 造成對話行為與現在不一致。
// 也正因為是無條件清除，persistChatbotMode() 寫進去的值永遠不會被讀回來（寫入等同無效）。
// 日後若要恢復模式切換，這段要改回「讀取 + isChatbotRunMode 驗證」，而不是 removeItem。
onMounted(() => {
  if (!import.meta.client) return;

  try {
    localStorage.removeItem(CHATBOT_MODE_STORAGE_KEY);
    selectedChatbotMode.value = CHATBOT_DEFAULT_MODE;
  } catch (error) {
    console.warn('[chatbot] failed to read mode', error);
  }
});

watch(isOpen, async (open, previousOpen) => {
  if (!open) {
    if (previousOpen) {
      shouldResetAfterClose.value = true;
    }
    return;
  }

  shouldResetAfterClose.value = false;
  await nextTick();
  inputRef.value?.focus();
  await scrollToBottom();
});
</script>

<style scoped lang="scss">
.chatbot-window {
  position: fixed;
  right: 24px;
  bottom: calc(88px + env(safe-area-inset-bottom));
  z-index: 1002;
  display: flex;
  flex-direction: column;
  width: min(380px, calc(100vw - 32px));
  height: min(340px, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 124px));
  max-height: min(340px, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 124px));
  border: 1px solid rgba(234, 85, 4, 0.14);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 252, 249, 0.94)),
    linear-gradient(135deg, rgba(255, 242, 231, 0.9), rgba(239, 251, 249, 0.56));
  box-shadow:
    0 28px 72px rgba(23, 24, 24, 0.16),
    0 0 0 1px rgba(255, 255, 255, 0.68) inset;
  backdrop-filter: blur(24px);
  overflow: hidden;
}

.chatbot-header {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(234, 85, 4, 0.1);
  background:
    linear-gradient(135deg, rgba(255, 247, 241, 0.95), rgba(255, 255, 255, 0.74)),
    linear-gradient(90deg, rgba(234, 85, 4, 0.12), rgba(4, 172, 175, 0.08));
}

.header-avatar {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 45% 35%, rgba(255, 253, 225, 0.98), rgba(255, 218, 107, 0.92) 58%, rgba(255, 163, 54, 0.7));
  box-shadow: 0 10px 22px rgba(234, 85, 4, 0.18);
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.header-avatar-img {
  position: absolute;
  width: 40px;
  height: 40px;
  object-fit: contain;
  transform: translateY(3px) scale(1.1);
  transform-origin: center bottom;
}

.header-avatar-eye,
.header-avatar-mouth {
  position: absolute;
  display: block;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  z-index: 2;
}

.header-avatar-eye {
  top: 15px;
  width: 6px;
  height: 6px;
}

.header-avatar-eye-left {
  left: 12px;
}

.header-avatar-eye-right {
  right: 12px;
}

.header-avatar-mouth {
  left: 50%;
  top: 22px;
  width: 10px;
  height: 10px;
  transform: translateX(-50%);
}

.header-info {
  min-width: 0;
}

.header-name {
  margin: 0;
  color: #171818;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
}

.header-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  color: rgba(23, 24, 24, 0.64);
  font-size: 12px;
  font-weight: 700;
}

.header-status::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #0aa37f;
  box-shadow: 0 0 0 4px rgba(10, 163, 127, 0.12);
}

.header-action,
.header-close {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
  color: #171818;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background: #ffffff;
  }

  &:focus-visible {
    outline: 3px solid rgba(243, 110, 33, 0.22);
    outline-offset: 2px;
  }
}

/*
模式切換鈕的樣式（.chatbot-mode-switch / .mode-label / .mode-options / .mode-option）。
對應的 template markup 已移除，這些 class 目前不會套到任何元素上；
保留是為了日後恢復切換功能時不必重刻樣式。
*/
.chatbot-mode-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px 12px;
  border-bottom: 1px solid rgba(23, 24, 24, 0.06);
  background: rgba(255, 255, 255, 0.42);
}

.mode-label {
  flex: 0 0 auto;
  color: rgba(23, 24, 24, 0.62);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.mode-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  flex: 1 1 auto;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(23, 24, 24, 0.06);
}

.mode-option {
  min-height: 30px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(23, 24, 24, 0.68);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;

  &.is-active {
    background: #171818;
    color: #ffffff;
    box-shadow: 0 8px 18px rgba(23, 24, 24, 0.14);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.56;
  }

  &:focus-visible {
    outline: 3px solid rgba(243, 110, 33, 0.22);
    outline-offset: 2px;
  }
}

.chatbot-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 12px 14px 8px;
}

.chatbot-body.is-welcome {
  display: flex;
  flex-direction: column;
}

.mangbao-intro {
  margin-bottom: 10px;
}

/*
開場訊息不再放第二個芒字頭像，避免和 header 重複。
.mangbao-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 36% 24%, rgba(255, 252, 220, 0.98), rgba(255, 204, 91, 0.95) 54%, rgba(234, 85, 4, 0.9));
  box-shadow: 0 8px 18px rgba(234, 85, 4, 0.16);
  color: #784000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 900;
}
*/

.mangbao-intro-bubble {
  position: relative;
  padding: 10px 12px;
  border: 1px solid rgba(40, 86, 70, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 22px rgba(23, 24, 24, 0.07);
  color: rgba(23, 24, 24, 0.82);
  font-size: 12px;
  line-height: 1.55;
}

/*
開場訊息不再重複顯示「芒寶」名稱，header 已經有完整標題。
.mangbao-intro-name {
  margin: 0 0 3px;
  color: #285646;
  font-size: 12px;
  font-weight: 900;
}
*/

.mangbao-intro-bubble p {
  margin: 0;
}

.welcome-block {
  padding: 0;
}

.welcome-kicker {
  margin: 0 0 6px;
  color: #ea5504;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.welcome-title {
  margin: 0 0 6px;
  color: #171818;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.35;
}

.welcome-copy {
  margin: 0;
  color: rgba(23, 24, 24, 0.72);
  font-size: 13px;
  line-height: 1.5;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  align-items: center;
  margin-bottom: 0;
}

.chatbot-body.is-welcome .quick-actions {
  margin-top: auto;
  padding-top: 8px;
}

.chatbot-body.has-messages .quick-actions {
  margin-top: 6px;
  padding-top: 4px;
}

.quick-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 30px;
  padding: 0 3px;
  border: 1px solid rgba(234, 85, 4, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 18px rgba(23, 24, 24, 0.07);
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(234, 85, 4, 0.24);
    box-shadow: 0 12px 24px rgba(23, 24, 24, 0.1);
  }
}

.qa-icon {
  width: 18px;
  height: 18px;
  color: #ea5504;
}

.qa-label {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: rgba(23, 24, 24, 0.82);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-section {
  margin-bottom: 12px;
}

.suggestion-label,
.follow-up-title {
  display: inline-block;
  margin-bottom: 8px;
  color: rgba(23, 24, 24, 0.62);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.suggestion-chips,
.follow-up-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-suggestion,
.follow-up-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 20px rgba(23, 24, 24, 0.08);
  color: #171818;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background: #ffffff;
  }
}

.messages-list {
  display: grid;
  gap: 10px;
}

.message {
  display: flex;
}

.message-user {
  justify-content: flex-end;
}

.message-bot {
  justify-content: flex-start;
}

.message-content {
  display: grid;
  gap: 7px;
  max-width: min(100%, 278px);
}

.message-user .message-content {
  justify-items: end;
}

.message-bubble {
  max-width: 100%;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(23, 24, 24, 0.08);
  color: #171818;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;

  :deep(a) {
    color: #ea5504;
    font-weight: 700;
  }
}

.message-user .message-bubble {
  background: linear-gradient(135deg, #ea5504, #f36e21);
  color: #ffffff;
}

.message.is-error .message-bubble {
  border: 1px solid rgba(234, 85, 4, 0.18);
  background: linear-gradient(180deg, rgba(255, 247, 241, 0.98), rgba(255, 255, 255, 0.94));
}

.typing-bubble {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.typing-bubble span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(23, 24, 24, 0.38);
  animation: typing-dot 1s infinite ease-in-out;
}

.typing-bubble span:nth-child(2) {
  animation-delay: 0.12s;
}

.typing-bubble span:nth-child(3) {
  animation-delay: 0.24s;
}

.follow-up-panel {
  display: grid;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(23, 24, 24, 0.08);
}

.follow-up-group {
  display: grid;
}

.chatbot-input {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 10px 14px 12px;
  border-top: 1px solid rgba(23, 24, 24, 0.06);
  background: rgba(255, 255, 255, 0.54);
}

.input-message {
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  border: 1px solid rgba(23, 24, 24, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  color: #171818;
  font-size: 13px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-visible {
    outline: none;
    border-color: rgba(234, 85, 4, 0.3);
    box-shadow: 0 0 0 4px rgba(234, 85, 4, 0.12);
  }
}

.btn-send {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #ea5504, #f36e21);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.chatbot-window-enter-active,
.chatbot-window-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.chatbot-window-enter-from,
.chatbot-window-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.98);
}

@keyframes typing-dot {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }

  40% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .chatbot-window {
    left: max(12px, env(safe-area-inset-left));
    right: max(12px, env(safe-area-inset-right));
    bottom: calc(76px + env(safe-area-inset-bottom));
    width: auto;
    height: min(340px, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 96px));
    max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 96px);
    border-radius: 20px;
  }

  .welcome-title {
    font-size: 18px;
  }

  .quick-actions {
    gap: 4px;
  }
}

.message-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 2px;
}

.message-link {
  display: inline;
  padding: 0;
  border: 0;
  background: transparent;
  color: #ea5504;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.message-link:hover,
.message-link:focus-visible {
  color: #b93f00;
  background: transparent;
}

@media (max-width: 350px) {
  .quick-actions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

}
</style>
