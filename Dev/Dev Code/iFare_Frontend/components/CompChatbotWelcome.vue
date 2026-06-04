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
          <svg viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#EA5504" />
            <path d="M11 14h10v6c0 .55-.45 1-1 1h-3l-2 2-2-2h-1c-.55 0-1-.45-1-1v-6Z" fill="#fff" />
            <circle cx="13.5" cy="17" r="1" fill="#EA5504" />
            <circle cx="16" cy="17" r="1" fill="#EA5504" />
            <circle cx="18.5" cy="17" r="1" fill="#EA5504" />
          </svg>
        </div>
        <div class="header-info">
          <h3 id="chatbot-title" class="header-name">i-Fare 智慧小幫手</h3>
          <span class="header-status">{{ chatbotStatusText }}</span>
        </div>
        <button
          type="button"
          class="header-action"
          aria-label="清除對話"
          title="清除對話"
          data-island="清除對話"
          data-island-style="button"
          data-mascot-tip="這裡會清掉目前對話，重新開始聊天。"
          @click="resetConversation"
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
          aria-label="關閉智慧小幫手"
          title="關閉智慧小幫手"
          data-island="關閉小幫手"
          data-island-style="button"
          data-mascot-tip="這裡會關閉智慧小幫手視窗。"
          @click="handleClose"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <section class="chatbot-mode-switch" aria-label="小幫手測試模式">
        <span class="mode-label">測試模式</span>
        <div class="mode-options">
          <button
            v-for="option in chatbotModeOptions"
            :key="option.value"
            type="button"
            :class="['mode-option', { 'is-active': selectedChatbotMode === option.value }]"
            :aria-pressed="selectedChatbotMode === option.value"
            :title="option.description"
            :disabled="isBotTyping"
            :data-mascot-tip="`這裡會切換成${option.label}模式。${option.description}`"
            @click="setChatbotMode(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </section>

      <div ref="bodyRef" class="chatbot-body">
        <template v-if="messages.length === 0">
          <section class="welcome-block">
            <p class="welcome-kicker">i-Fare 智慧小幫手</p>
            <h4 class="welcome-title">{{ welcomeTitle }}</h4>
            <p class="welcome-copy">
              {{ welcomeCopy }}
            </p>
          </section>

          <section class="quick-actions" role="group" aria-label="快捷操作">
            <button
              v-for="action in quickActions"
              :key="action.key"
              type="button"
              class="quick-action-btn"
              :data-island="action.label"
              data-island-style="card"
              :data-mascot-tip="`點這個我會直接幫你送出「${action.label}」這個問題。`"
              @click="runQuickAction(action.prompt)"
            >
              <span class="qa-icon" aria-hidden="true" v-html="action.icon" />
              <span class="qa-label">{{ action.label }}</span>
            </button>
          </section>

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
                :data-mascot-tip="`點這個我會直接用「${chip}」幫你發問。`"
                @click="runQuickAction(chip)"
              >
                {{ chip }}
              </button>
            </div>
          </section>

          <section class="contact-card">
            <div class="contact-card-top">
              <h5>需要真人協助？</h5>
              <p>如果你的問題牽涉個案判斷或申請細節，建議直接聯絡基金會。</p>
            </div>
            <div class="contact-card-actions">
              <a
                href="tel:0227978383"
                class="contact-pill"
                data-island="撥打基金會電話"
                data-island-style="button"
              >
                撥打電話
              </a>
              <a
                href="https://lin.ee/eHw9VpL"
                target="_blank"
                rel="noopener noreferrer"
                class="contact-pill"
                data-island="LINE 真人客服"
                data-island-style="button"
              >
                LINE 客服
              </a>
              <NuxtLink
                to="/collaborator"
                class="contact-pill is-outline"
                data-island="公益夥伴"
                data-island-style="link"
              >
                公益夥伴
              </NuxtLink>
            </div>
          </section>
        </template>

        <template v-else>
          <div class="messages-list" role="log" aria-live="polite" aria-label="聊天紀錄">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="['message', `message-${message.role}`, { 'is-error': message.isError }]"
            >
              <div class="message-bubble" v-html="message.contentHtml" />
            </div>

            <div v-if="isBotTyping" class="message message-bot">
              <div class="message-bubble typing-bubble" aria-label="小幫手回覆中">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

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
        </template>
      </div>

      <form class="chatbot-input" @submit.prevent="handleSubmit">
        <input
          ref="inputRef"
          v-model="inputText"
          type="text"
          class="input-message"
          placeholder="例如：我想找福利政策、聯絡方式或捐款資訊"
          aria-label="輸入訊息"
          autocomplete="off"
          maxlength="200"
          data-island="輸入問題"
          data-island-style="field"
          data-mascot-tip="這裡可以直接輸入你的問題，我會根據內容幫你找答案。"
        />
        <button
          type="submit"
          class="btn-send"
          :disabled="!canSend"
          :aria-label="isBotTyping ? '小幫手回覆中' : '送出問題'"
          data-island="送出問題"
          data-island-style="button"
          :data-mascot-tip="isBotTyping ? '我正在整理回覆，先等我一下。' : '點這裡會送出你剛剛輸入的問題。'"
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
type ChatRole = 'user' | 'bot';
type ChatbotRunMode = 'script' | 'ai' | 'hybrid';
type ChatbotApiMode = Exclude<ChatbotRunMode, 'script'>;
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
}

interface ChatbotApiResponse {
  configured: boolean;
  mode?: ChatbotRunMode;
  model?: string;
  source?: string;
  errorCode?: string;
  retryable?: boolean;
  reply: string;
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

interface SearchIntent {
  key: string;
  keywords: RegExp;
  reply: string;
  actions: FollowUpAction[];
}

// Default mode for the UI switch below.
// - 'script': pure script, only local rules, no API call.
// - 'ai': pure AI, call API directly and skip local scripted replies.
// - 'hybrid': script first, then API fallback.
const CHATBOT_DEFAULT_MODE = 'hybrid' as ChatbotRunMode;
const CHATBOT_MODE_STORAGE_KEY = 'ifare-chatbot-mode';

const chatbotModeOptions: Array<{ value: ChatbotRunMode; label: string; description: string }> = [
  { value: 'script', label: '純腳本', description: '只用固定規則回答，不呼叫 API' },
  { value: 'ai', label: '純 AI', description: '直接呼叫 API，不先吃固定問答' },
  { value: 'hybrid', label: '混合版', description: '固定規則優先，沒命中再呼叫 API' },
];

function resultSearchTo(query: string) {
  return `/ifare/result?query=${encodeURIComponent(query)}`;
}

const searchIntents: SearchIntent[] = [
  {
    key: 'elder',
    keywords: /老人|長者|高齡|銀髮|長照|照顧|失能|失智/,
    reply:
      '如果是老人相關需求，可以先從「老人福利」、「長照照顧」、「照顧者支持」這幾個方向找。建議先看搜尋結果，再依地區、身分與收入條件縮小範圍。',
    actions: [
      { label: '搜尋老人福利', type: 'route', to: resultSearchTo('老人'), variant: 'button' },
      { label: '搜尋長照照顧', type: 'route', to: resultSearchTo('長照'), variant: 'button' },
      { label: '搜尋照顧補助', type: 'route', to: resultSearchTo('照顧'), variant: 'link' },
      { label: '完整福利篩選', type: 'route', to: '/ifare', variant: 'link' },
    ],
  },
  {
    key: 'birth',
    keywords: /生育|懷孕|孕婦|產檢|新生兒|嬰幼兒|育兒|托育|保母/,
    reply:
      '如果是生育或育兒補助，可以先分成「生育補助」、「育兒津貼」、「托育服務」三類查。若你有戶籍地或孩子年齡，進結果頁後再補篩會更準。',
    actions: [
      { label: '搜尋生育補助', type: 'route', to: resultSearchTo('生育補助'), variant: 'button' },
      { label: '搜尋育兒津貼', type: 'route', to: resultSearchTo('育兒津貼'), variant: 'button' },
      { label: '搜尋托育服務', type: 'route', to: resultSearchTo('托育'), variant: 'link' },
      { label: '完整福利篩選', type: 'route', to: '/ifare', variant: 'link' },
    ],
  },
  {
    key: 'disability',
    keywords: /身障|身心障礙|障礙|輔具|復健|無障礙/,
    reply:
      '如果是身心障礙相關需求，可以先查「身心障礙福利」、「輔具補助」、「照顧服務」。這類福利通常會再看障礙證明、收入與戶籍地。',
    actions: [
      { label: '搜尋身障福利', type: 'route', to: resultSearchTo('身心障礙'), variant: 'button' },
      { label: '搜尋輔具補助', type: 'route', to: resultSearchTo('輔具'), variant: 'button' },
      { label: '搜尋照顧服務', type: 'route', to: resultSearchTo('照顧服務'), variant: 'link' },
      { label: '完整福利篩選', type: 'route', to: '/ifare', variant: 'link' },
    ],
  },
  {
    key: 'income',
    keywords: /低收入|中低收入|弱勢|急難|生活補助|生活扶助|經濟困難|救助/,
    reply:
      '如果是經濟壓力或急難需求，可以先查「生活補助」、「急難救助」、「低收入戶」。這類通常會看收入、家庭狀況與戶籍地。',
    actions: [
      { label: '搜尋生活補助', type: 'route', to: resultSearchTo('生活補助'), variant: 'button' },
      { label: '搜尋急難救助', type: 'route', to: resultSearchTo('急難救助'), variant: 'button' },
      { label: '搜尋低收入戶', type: 'route', to: resultSearchTo('低收入'), variant: 'link' },
      { label: '完整福利篩選', type: 'route', to: '/ifare', variant: 'link' },
    ],
  },
  {
    key: 'student',
    keywords: /學生|就學|學費|教育|助學|獎助學金|兒童|青少年|少年/,
    reply:
      '如果是兒少或就學需求，可以先查「就學補助」、「兒少福利」、「獎助學金」。如果有年齡或學籍條件，進結果頁後再縮小範圍。',
    actions: [
      { label: '搜尋就學補助', type: 'route', to: resultSearchTo('就學補助'), variant: 'button' },
      { label: '搜尋兒少福利', type: 'route', to: resultSearchTo('兒少'), variant: 'button' },
      { label: '搜尋獎助學金', type: 'route', to: resultSearchTo('獎助學金'), variant: 'link' },
      { label: '完整福利篩選', type: 'route', to: '/ifare', variant: 'link' },
    ],
  },
];

const quickActions: QuickAction[] = [
  {
    key: 'policy',
    label: '找福利政策',
    prompt: '我想找適合我的福利政策',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  },
  {
    key: 'faq',
    label: '常見問題',
    prompt: '有哪些常見問題可以先看？',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
  },
  {
    key: 'contact',
    label: '聯絡真人客服',
    prompt: '我要怎麼聯絡基金會或真人客服？',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  },
  {
    key: 'partner',
    label: '公益夥伴',
    prompt: '我要找公益夥伴或合作單位',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M14 15a4 4 0 0 1 4 4v2"/></svg>',
  },
];

const suggestionChips = [
  '有哪些常見問題？',
  '老人福利',
  '生育補助',
  '我要找福利政策',
  '如何聯絡基金會？',
];

const SCRIPT_MODE_FALLBACK_REPLY =
  '目前是純腳本測試模式，我只能依照固定關鍵字回覆。請改用更明確的對象或情境，例如：老人福利、生育補助、身心障礙、低收入、就學補助、公益夥伴、聯絡方式。';

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
const activeModeOption = computed(
  () => chatbotModeOptions.find((option) => option.value === selectedChatbotMode.value) || chatbotModeOptions[2],
);
const chatbotStatusText = computed(() =>
  isBotTyping.value ? '回覆中...' : `目前使用：${activeModeOption.value.label}`,
);
const welcomeTitle = computed(() => {
  const titles: Record<ChatbotRunMode, string> = {
    script: '目前測試純腳本：只用固定規則快速導覽。',
    ai: '目前測試純 AI：直接交給 AI 回覆與整理。',
    hybrid: '目前測試混合版：先用固定 FAQ，再交給 AI 補充整理。',
  };

  return titles[selectedChatbotMode.value];
});
const welcomeCopy = computed(() => {
  const copies: Record<ChatbotRunMode, string> = {
    script: '適合確認固定問答、關鍵字命中與站內入口按鈕是否清楚。',
    ai: '適合確認 API 回覆是否自然、人性化，以及是否能處理開放式問題。',
    hybrid: '適合測試正式方向：常見問題省成本，複雜問題再交給 AI。',
  };

  return copies[selectedChatbotMode.value];
});

const actionGroups = computed<FollowUpGroup[]>(() => {
  const groups: FollowUpGroup[] = [];

  if (lastErrorRetryable.value && lastPrompt.value) {
    groups.push({
      title: '失敗後建議操作',
      actions: [
        { label: '重試剛剛的問題', type: 'message', prompt: lastPrompt.value, variant: 'button' },
        { label: '前往 i-Fare', type: 'route', to: '/ifare', variant: 'link' },
        {
          label: 'LINE 真人客服',
          type: 'link',
          href: 'https://lin.ee/eHw9VpL',
          target: '_blank',
          variant: 'button',
        },
      ],
    });
  }

  const keywordActions = selectedChatbotMode.value === 'ai' ? [] : buildKeywordActions(lastPrompt.value);
  if (keywordActions.length > 0) {
    groups.push({
      title: '站內導覽',
      actions: keywordActions,
    });
  }

  return groups;
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

function pushMessage(role: ChatRole, text: string, options?: { html?: boolean; isError?: boolean; stripHtml?: boolean }) {
  messages.value.push({
    id: nextId(),
    role,
    content: text,
    contentHtml: options?.html ? formatTrustedHtml(text) : formatPlainText(text, { stripHtml: options?.stripHtml }),
    isError: options?.isError,
  });
}

async function scrollToBottom() {
  await nextTick();
  if (bodyRef.value) {
    bodyRef.value.scrollTop = bodyRef.value.scrollHeight;
  }
}

function normalizePrompt(prompt: string) {
  return prompt.trim().slice(0, 200);
}

function isChatbotRunMode(value: unknown): value is ChatbotRunMode {
  return value === 'script' || value === 'ai' || value === 'hybrid';
}

function persistChatbotMode(mode: ChatbotRunMode) {
  if (!import.meta.client) return;

  try {
    localStorage.setItem(CHATBOT_MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('[chatbot] failed to persist mode', error);
  }
}

function setChatbotMode(mode: ChatbotRunMode) {
  if (isBotTyping.value || selectedChatbotMode.value === mode) return;
  selectedChatbotMode.value = mode;
  persistChatbotMode(mode);
  resetConversation({ focus: false });
}

function matchSearchIntent(prompt: string) {
  const text = prompt.toLowerCase();
  return searchIntents.find((intent) => intent.keywords.test(text));
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

function buildKeywordActions(prompt: string): FollowUpAction[] {
  const text = prompt.toLowerCase();
  const actions: FollowUpAction[] = [];
  const matchedIntent = matchSearchIntent(prompt);

  if (matchedIntent) {
    actions.push(...matchedIntent.actions);
  }

  if (/福利|政策|補助|資格|申請|ifare/.test(text)) {
    actions.push(
      { label: '前往 i-Fare', type: 'route', to: '/ifare', variant: 'button' },
      { label: '再問一次申請資格', type: 'message', prompt: '請幫我整理申請福利時要先看哪些資格條件', variant: 'link' },
    );
  }

  if (/公益|夥伴|合作/.test(text)) {
    actions.push({ label: '公益夥伴頁', type: 'route', to: '/collaborator', variant: 'button' });
  }

  if (/新聞|最新|活動/.test(text)) {
    actions.push({ label: '最新消息', type: 'route', to: '/news', variant: 'link' });
  }

  if (/文章|資源|懶人包/.test(text)) {
    actions.push({ label: '福利專欄', type: 'route', to: '/articles', variant: 'link' });
  }

  if (/捐款|支持|donate|donation/.test(text)) {
    actions.push(
      { label: '前往關於我們', type: 'route', to: '/about', variant: 'link' },
      {
        label: 'LINE 真人客服',
        type: 'link',
        href: 'https://lin.ee/eHw9VpL',
        target: '_blank',
        variant: 'button',
      },
    );
  }

  if (/聯絡|客服|電話|line|email/.test(text)) {
    actions.push(
      {
        label: '撥打電話',
        type: 'link',
        href: 'tel:0227978383',
        variant: 'button',
      },
      {
        label: '寄送 Email',
        type: 'link',
        href: 'mailto:ifaretw@gmail.com',
        variant: 'link',
      },
    );
  }

  return uniqueActions(actions).slice(0, 4);
}

function getBroadWelfareGuidanceReply() {
  return [
    '福利政策範圍很大，建議先從這 4 類開始選：',
    '1. 老人 / 長照',
    '2. 生育 / 育兒',
    '3. 身心障礙',
    '4. 低收入 / 急難 / 就學補助',
    '如果你告訴我「對象」或「情境」，我可以直接幫你縮小到更精準的搜尋方向。',
    '站內入口：/ifare',
  ].join('\n');
}

function getLocalKnowledgeReply(prompt: string) {
  const text = prompt.toLowerCase();
  const matchedIntent = matchSearchIntent(prompt);

  if (matchedIntent) {
    return matchedIntent.reply;
  }

  if (/福利|補助|資格|申請|ifare/.test(text)) {
    return getBroadWelfareGuidanceReply();
  }

  if (/公益|夥伴|合作/.test(text)) {
    return '目前站上有公益夥伴整理頁，包含服務項目與合作資訊，你可以直接查看公益夥伴頁。';
  }

  if (/捐款|支持|donate|donation/.test(text)) {
    return '如果你想支持基金會，建議先查看關於我們了解服務方向，若需要捐款方式與合作資訊，也可以直接聯絡基金會。';
  }

  if (/聯絡|客服|電話|line|email/.test(text)) {
    return '你可以用以下方式聯絡基金會：電話 02-2797-8383、Email ifaretw@gmail.com，或加入 LINE 客服。';
  }

  if (/新聞|最新|活動/.test(text)) {
    return '如果你想看基金會最新公告與活動，建議直接前往最新消息頁。';
  }

  if (/文章|資源|懶人包/.test(text)) {
    return '站上有政策文章與圖文整理，建議直接到福利專欄查看。';
  }

  return '';
}

async function requestBotReply(prompt: string) {
  const sessionId = chatSessionId.value;
  lastPrompt.value = prompt;
  lastErrorCode.value = '';
  lastErrorRetryable.value = false;

  const mode = selectedChatbotMode.value;
  if (mode === 'script') {
    await requestScriptModeReply(prompt, sessionId);
    return;
  }

  if (mode === 'ai') {
    await requestAiModeReply(prompt, sessionId);
    return;
  }

  await requestHybridModeReply(prompt, sessionId);
}

async function requestScriptModeReply(prompt: string, sessionId: number) {
  const localReply = getLocalKnowledgeReply(prompt) || SCRIPT_MODE_FALLBACK_REPLY;
  if (sessionId !== chatSessionId.value) return;
  pushMessage('bot', localReply);
  await scrollToBottom();
}

async function requestAiModeReply(prompt: string, sessionId: number) {
  await requestApiReply(prompt, sessionId, 'ai');
}

async function requestHybridModeReply(prompt: string, sessionId: number) {
  const localReply = getLocalKnowledgeReply(prompt);
  if (localReply) {
    if (sessionId !== chatSessionId.value) return;
    pushMessage('bot', localReply);
    await scrollToBottom();
    return;
  }

  await requestApiReply(prompt, sessionId, 'hybrid');
}

async function requestApiReply(prompt: string, sessionId: number, mode: ChatbotApiMode) {
  isBotTyping.value = true;
  await scrollToBottom();

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
    });

    if (sessionId !== chatSessionId.value) return;
    pushMessage('bot', response.reply, { stripHtml: true });

    if (response.errorCode) {
      lastErrorCode.value = response.errorCode;
      lastErrorRetryable.value = Boolean(response.retryable);
      messages.value[messages.value.length - 1].isError = true;
    }
  } catch (error) {
    console.error('[chatbot] request failed', error);
    if (sessionId !== chatSessionId.value) return;
    lastErrorCode.value = 'network_error';
    lastErrorRetryable.value = true;
    pushMessage(
      'bot',
      '目前無法連到智慧小幫手服務，建議你先重試一次，或直接前往 i-Fare、公益夥伴與聯絡資訊頁面。',
      { isError: true },
    );
  } finally {
    if (sessionId === chatSessionId.value) {
      isBotTyping.value = false;
      await scrollToBottom();
    }
  }
}

async function sendPrompt(rawPrompt: string) {
  const prompt = normalizePrompt(rawPrompt);
  if (!prompt || isBotTyping.value) return;

  pushMessage('user', prompt);
  inputText.value = '';
  await scrollToBottom();
  await requestBotReply(prompt);
}

async function handleSubmit() {
  await sendPrompt(inputText.value);
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

onMounted(() => {
  if (!import.meta.client) return;

  try {
    const storedMode = localStorage.getItem(CHATBOT_MODE_STORAGE_KEY);
    if (isChatbotRunMode(storedMode)) {
      selectedChatbotMode.value = storedMode;
    }
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
  bottom: calc(96px + env(safe-area-inset-bottom));
  z-index: 1002;
  display: flex;
  flex-direction: column;
  width: min(390px, calc(100vw - 32px));
  max-height: min(720px, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 132px));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.76)),
    linear-gradient(135deg, rgba(255, 244, 232, 0.72), rgba(255, 255, 255, 0.4));
  box-shadow:
    0 30px 80px rgba(23, 24, 24, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
  backdrop-filter: blur(30px);
  overflow: hidden;
}

.chatbot-header {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(23, 24, 24, 0.06);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.18));
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  overflow: hidden;
}

.header-info {
  min-width: 0;
}

.header-name {
  margin: 0;
  color: #171818;
  font-size: 15px;
  font-weight: 800;
}

.header-status {
  color: rgba(23, 24, 24, 0.6);
  font-size: 12px;
  font-weight: 600;
}

.header-action,
.header-close {
  width: 36px;
  height: 36px;
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
  padding: 18px 18px 12px;
}

.welcome-block {
  padding: 2px 0 18px;
}

.welcome-kicker {
  margin: 0 0 8px;
  color: #ea5504;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.welcome-title {
  margin: 0 0 10px;
  color: #171818;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
}

.welcome-copy {
  margin: 0;
  color: rgba(23, 24, 24, 0.72);
  font-size: 14px;
  line-height: 1.75;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.quick-action-btn {
  display: grid;
  gap: 12px;
  padding: 16px 14px;
  border: 0;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 248, 243, 0.9)),
    linear-gradient(135deg, rgba(243, 110, 33, 0.1), rgba(255, 255, 255, 0));
  box-shadow: 0 12px 28px rgba(23, 24, 24, 0.08);
  text-align: left;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 34px rgba(23, 24, 24, 0.12);
  }
}

.qa-icon {
  width: 22px;
  height: 22px;
  color: #ea5504;
}

.qa-label {
  color: #171818;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
}

.suggestion-section {
  margin-bottom: 18px;
}

.suggestion-label,
.follow-up-title {
  display: inline-block;
  margin-bottom: 10px;
  color: rgba(23, 24, 24, 0.62);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.suggestion-chips,
.follow-up-actions,
.contact-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip-suggestion,
.follow-up-action,
.contact-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 20px rgba(23, 24, 24, 0.08);
  color: #171818;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background: #ffffff;
  }
}

.contact-card {
  padding: 16px;
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(23, 24, 24, 0.94), rgba(39, 39, 39, 0.88));
  color: #ffffff;
}

.contact-card-top h5 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 800;
}

.contact-card-top p {
  margin: 0 0 14px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 13px;
  line-height: 1.7;
}

.contact-pill {
  background: #ffffff;
  color: #171818;

  &.is-outline {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.18);
  }
}

.messages-list {
  display: grid;
  gap: 12px;
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

.message-bubble {
  max-width: min(100%, 288px);
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(23, 24, 24, 0.08);
  color: #171818;
  font-size: 14px;
  line-height: 1.75;
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
  gap: 16px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(23, 24, 24, 0.08);
}

.follow-up-group {
  display: grid;
}

.chatbot-input {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 14px 18px 18px;
  border-top: 1px solid rgba(23, 24, 24, 0.06);
  background: rgba(255, 255, 255, 0.54);
}

.input-message {
  min-width: 0;
  height: 48px;
  padding: 0 16px;
  border: 1px solid rgba(23, 24, 24, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  color: #171818;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-visible {
    outline: none;
    border-color: rgba(234, 85, 4, 0.3);
    box-shadow: 0 0 0 4px rgba(234, 85, 4, 0.12);
  }
}

.btn-send {
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 18px;
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
    right: 12px;
    bottom: calc(84px + env(safe-area-inset-bottom));
    width: calc(100vw - 24px);
    max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 104px);
    border-radius: 24px;
  }

  .welcome-title {
    font-size: 21px;
  }

  .quick-actions {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
