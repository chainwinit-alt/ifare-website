<template>
  <!--
    UIUX #137 — 聊天機器人 Welcome 開場畫面
    結構：Header / Welcome Block / Quick Actions / Suggestion Chips / Input Bar
    位置：右下角，浮在 #136 浮動入口按鈕之上
  -->
  <Transition name="chatbot-window">
    <section
      v-if="isOpen"
      class="chatbot-window"
      role="dialog"
      aria-labelledby="chatbot-title"
      aria-modal="false"
    >
      <!-- ① Header -->
      <header class="chatbot-header">
        <div class="header-avatar" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#EA5504" />
            <path d="M11 14h10v6c0 .5-.4 1-1 1h-3l-2 2-2-2h-1c-.5 0-1-.5-1-1v-6z" fill="#fff"/>
            <circle cx="13.5" cy="17" r="1" fill="#EA5504"/>
            <circle cx="16" cy="17" r="1" fill="#EA5504"/>
            <circle cx="18.5" cy="17" r="1" fill="#EA5504"/>
            <path d="M16 9c-1.5 0-2.5 1-2.5 2.5h5C18.5 10 17.5 9 16 9z" fill="#fff"/>
          </svg>
        </div>
        <div class="header-info">
          <h3 id="chatbot-title" class="header-name">長穩小幫手</h3>
          <span class="header-status">線上協助中</span>
        </div>
        <button
          type="button"
          class="header-menu"
          :aria-label="messages.length > 0 ? '返回主選單' : '主選單'"
          :title="messages.length > 0 ? '返回主選單（清空對話）' : '主選單'"
          @click="handleMenu"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          class="header-close"
          aria-label="退出聊天"
          title="退出聊天"
          @click="handleClose"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <!-- ② Body：對話狀態 vs 開場狀態 -->
      <div ref="bodyRef" class="chatbot-body">
        <!-- 開場狀態 (尚無對話) -->
        <template v-if="messages.length === 0">
          <div class="welcome-block">
            <p class="welcome-greeting">哈囉，我是長穩基金會的小幫手 <span class="wave">👋</span></p>
            <p class="welcome-subtitle">我可以幫你找到需要的資訊</p>
          </div>

          <!-- ③ Quick Actions (2x2 grid) -->
          <div class="quick-actions" role="group" aria-label="快速功能">
            <button
              v-for="action in quickActions"
              :key="action.key"
              type="button"
              class="quick-action-btn"
              @click="handleQuickAction(action)"
            >
              <span class="qa-icon" aria-hidden="true" v-html="action.icon"></span>
              <span class="qa-label">{{ action.label }}</span>
            </button>
          </div>

          <!-- ④ Suggestion Chips (橫向 scroll) -->
          <div class="suggestion-section">
            <span class="suggestion-label">熱門問題</span>
            <div class="suggestion-chips" role="group" aria-label="建議問題">
              <button
                v-for="chip in suggestionChips"
                :key="chip"
                type="button"
                class="chip-suggestion"
                @click="handleChip(chip)"
              >{{ chip }}</button>
            </div>
          </div>
        </template>

        <!-- 對話狀態 (已有訊息) -->
        <template v-else>
          <div class="messages-list" role="log" aria-live="polite" aria-label="對話內容">
            <div
              v-for="msg in messages"
              :key="msg.id"
              :class="['message', `message-${msg.role}`]"
            >
              <div class="message-bubble" v-html="msg.contentHtml"></div>
            </div>
            <div v-if="isBotTyping" class="message message-bot">
              <div class="message-bubble typing-dots" aria-label="小幫手輸入中">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ⑤.0 Action Bar — 顯式「退出聊天」入口 (header X 在手機可能被瀏覽器 chrome 擋住) -->
      <div class="chatbot-actions">
        <button type="button" class="chatbot-exit-btn" @click="handleClose" aria-label="退出聊天">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          <span>退出聊天</span>
        </button>
      </div>

      <!-- ⑤ Input Bar (固定底部) -->
      <form class="chatbot-input" @submit.prevent="handleSubmit">
        <input
          v-model="inputText"
          type="text"
          class="input-message"
          placeholder="輸入訊息..."
          aria-label="輸入訊息"
          autocomplete="off"
        />
        <button
          type="submit"
          class="btn-send"
          :disabled="!inputText.trim() || isBotTyping"
          aria-label="送出"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </section>
  </Transition>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'menu'): void;
  (e: 'send', text: string): void;
  (e: 'action', key: string): void;
}>();

interface QuickAction {
  key: string;
  label: string;
  icon: string; // SVG string
  /** Bot 對應 quick action 的回應 */
  reply: string;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  content: string;
  /** 安全 HTML 字串 (允許 <a> / <br>) */
  contentHtml: string;
  ts: number;
}

interface ChatbotApiResponse {
  configured: boolean;
  model?: string;
  errorCode?: string;
  retryable?: boolean;
  reply: string;
}

// Quick Actions — 2x2 Grid（含 bot 回應）
const quickActions: QuickAction[] = [
  {
    key: 'faq',
    label: '常見問題',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    reply: '常見問題您可以直接逛一下這頁的 FAQ 區，或告訴我您想問什麼，例如：「兒少服務有哪些？」「我可以怎麼贊助？」「志工招募」等。',
  },
  {
    key: 'policy',
    label: '找福利政策',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    reply: '我們有完整的福利政策搜尋工具「i-Fare 福利好幫手」，可依戶籍、受助對象、經濟條件等多條件搜尋。<br><a href="/ifare" target="_self">前往 i-Fare →</a>',
  },
  {
    key: 'contact',
    label: '聯絡我們',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    reply: '您可以透過以下方式聯絡我們：<br>📞 電話 (02) 2797-8383<br>✉️ Email ifaretw@gmail.com<br>💬 <a href="https://lin.ee/eHw9VpL" target="_blank" rel="noopener noreferrer">加入 LINE 好友</a><br>服務時間：週一至週五 09:00-18:00（午休 12:00-13:00）',
  },
  {
    key: 'partner',
    label: '公益夥伴',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M14 15a4 4 0 0 1 4 4v2"/></svg>',
    reply: '我們有 19 個公益夥伴團體，涵蓋兒少、老人、婦女、身心障礙、弱勢家庭等領域。<br><a href="/collaborator" target="_self">查看所有公益夥伴 →</a>',
  },
];

const suggestionChips = [
  '我想找福利政策',
  '我可以怎麼贊助？',
  '最新公益活動有哪些？',
  '兒少相關服務',
  '志工招募中嗎？',
];

const inputText = ref('');
const messages = ref<ChatMessage[]>([]);
const isBotTyping = ref(false);
const bodyRef = ref<HTMLElement | null>(null);

let messageIdCounter = 0;
function nextId() {
  messageIdCounter += 1;
  return messageIdCounter;
}

// 簡易 HTML escape (防 XSS — user 訊息一律 escape)
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function scrollToBottom() {
  await nextTick();
  if (bodyRef.value) {
    bodyRef.value.scrollTop = bodyRef.value.scrollHeight;
  }
}

function pushUserMessage(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  messages.value.push({
    id: nextId(),
    role: 'user',
    content: trimmed,
    contentHtml: escapeHtml(trimmed).replace(/\n/g, '<br>'),
    ts: Date.now(),
  });
  scrollToBottom();
}

function pushBotMessage(html: string) {
  messages.value.push({
    id: nextId(),
    role: 'bot',
    content: html.replace(/<[^>]+>/g, ''),  // 內部紀錄純文字
    contentHtml: html,
    ts: Date.now(),
  });
  scrollToBottom();
}

function pushBotText(text: string) {
  pushBotMessage(escapeHtml(text).replace(/\n/g, '<br>'));
}

function getChatHistory() {
  return messages.value.slice(-8).map((msg) => ({
    role: msg.role === 'bot' ? 'assistant' : 'user',
    content: msg.content,
  }));
}

async function scheduleBotReply(userText: string, customReply?: string) {
  isBotTyping.value = true;
  scrollToBottom();

  try {
    if (customReply) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      pushBotMessage(customReply);
      return;
    }

    const res = await $fetch<ChatbotApiResponse>('/api/chatbot', {
      method: 'POST',
      body: {
        message: userText,
        history: getChatHistory(),
      },
    });

    if (res.configured) {
      pushBotText(res.reply);
      return;
    }

    pushBotMessage(generateBotReply(userText));
  } catch (error) {
    console.error('[chatbot] request failed', error);
    pushBotMessage(generateBotReply(userText));
  } finally {
    isBotTyping.value = false;
  }
}

// v1：基於關鍵字的 hardcode 回應
function generateBotReply(userText: string): string {
  const text = userText.toLowerCase();

  if (/福利|政策|補助|低收|身心障礙|戶籍/.test(text)) {
    return '我們有完整的福利政策搜尋工具，可依戶籍、受助對象、經濟條件等多條件搜尋。<br><a href="/ifare" target="_self">前往 i-Fare 福利好幫手 →</a>';
  }
  if (/贊助|捐款|支持|donation|donate/.test(text)) {
    return '感謝您願意支持長穩 ❤️ 您可以透過幾種方式：<br>1. 加入 LINE 好友了解最新捐款方式<br>2. 直接聯絡我們：(02) 2797-8383<br><a href="https://lin.ee/eHw9VpL" target="_blank" rel="noopener noreferrer">加入 LINE →</a>';
  }
  if (/志工|義工|參與|加入/.test(text)) {
    return '想成為志工嗎？我們的志工會陪伴孩子學習、參與教育活動，並共同推動資源整合等公益行動。<br>歡迎透過 LINE 或電話告訴我們您想參與的方向。<br><a href="/about" target="_self">了解更多 →</a>';
  }
  if (/聯絡|電話|email|地址|line/.test(text)) {
    return '您可以透過以下方式聯絡我們：<br>📞 (02) 2797-8383<br>✉️ ifaretw@gmail.com<br>💬 <a href="https://lin.ee/eHw9VpL" target="_blank" rel="noopener noreferrer">LINE 好友</a><br>服務時間：週一至週五 09:00-18:00';
  }
  if (/最新|消息|活動|news/.test(text)) {
    return '最新的公益活動與消息您可以直接到「最新消息」頁面查看。<br><a href="/news" target="_self">查看最新消息 →</a>';
  }
  if (/夥伴|partner|合作/.test(text)) {
    return '我們有 19 個公益夥伴，涵蓋兒少、老人、婦女、身心障礙、弱勢家庭等領域。<br><a href="/collaborator" target="_self">查看所有夥伴 →</a>';
  }
  if (/兒少|兒童|嬰幼兒|青少年/.test(text)) {
    return '兒少相關服務我們有兒福扶助、博幼基金會、世界展望會等多家公益夥伴提供支持。<br><a href="/collaborator" target="_self">查看兒少類夥伴 →</a>';
  }
  if (/老人|長者|銀髮/.test(text)) {
    return '長者服務您可以參考弘道老人福利基金會等夥伴。<br><a href="/collaborator" target="_self">查看老人類夥伴 →</a>';
  }
  if (/感謝|謝謝|thank|thanks/.test(text)) {
    return '不客氣！還有任何需要可以隨時告訴我 🙂';
  }
  if (/你好|哈囉|hi|hello/.test(text)) {
    return '哈囉！很高興遇到您 👋 想了解什麼樣的服務呢？可以試試左側的快速功能或直接告訴我您的需求。';
  }

  // Fallback
  return '這個問題我可能還不太會回答，您可以試試看用更具體的詞，或是直接聯絡我們的客服 ❤️<br><a href="https://lin.ee/eHw9VpL" target="_blank" rel="noopener noreferrer">LINE 聯絡 →</a> ｜ 📞 (02) 2797-8383';
}

function handleClose() {
  isOpen.value = false;
  emit('close');
}

function handleMenu() {
  // 對話狀態時，主選單 = 清空對話回到開場
  if (messages.value.length > 0) {
    if (confirm('要返回主選單嗎？目前對話會清空。')) {
      messages.value = [];
    }
  }
  emit('menu');
}

function handleSubmit() {
  const text = inputText.value.trim();
  if (!text) return;
  emit('send', text);
  pushUserMessage(text);
  scheduleBotReply(text);
  inputText.value = '';
}

function handleQuickAction(action: QuickAction) {
  emit('action', action.key);
  // 點 quick action 等同使用者送出 label，bot 用對應 customReply 回應 (跳過關鍵字判斷)
  pushUserMessage(action.label);
  scheduleBotReply(action.label, action.reply);
}

function handleChip(chip: string) {
  inputText.value = '';
  pushUserMessage(chip);
  scheduleBotReply(chip);
}
</script>

<style lang="scss" scoped>
$c-orange: #EA5504;
$c-orange-dark: #C84804;
$c-orange-light: #FFE6D5;
$c-white: #FFFFFF;
$c-black: #171818;
$c-grey-50: #F3F3F3;
$c-grey-200: #D1D1D1;
$c-grey-500: #8B8B8B;

.chatbot-window {
  position: fixed;
  right: 24px;
  bottom: 96px;            // 56 (按鈕) + 24 (按鈕距邊) + 16 (gap) = 96
  z-index: 998;            // 比 entry button (999) 低
  width: 380px;
  max-height: 620px;
  display: flex;
  flex-direction: column;
  background: $c-white;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba($c-black, 0.16), 0 4px 12px rgba($c-black, 0.08);
  overflow: hidden;
}

// ① Header
.chatbot-header {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 12px 0 16px;
  background: linear-gradient(135deg, $c-orange 0%, $c-orange-dark 100%);
  color: $c-white;
  flex-shrink: 0;

  .header-avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    svg { width: 100%; height: 100%; }
  }

  .header-info {
    flex: 1;
    min-width: 0;
    line-height: 1.2;
  }

  .header-name {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: $c-white;
  }

  .header-status {
    font-size: 11px;
    opacity: 0.85;

    &::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4ade80;
      margin-right: 4px;
      vertical-align: middle;
    }
  }

  .header-menu,
  .header-close {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: rgba($c-white, 0.12);
    color: $c-white;
    border-radius: 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;

    &:hover { background: rgba($c-white, 0.22); }
  }
}

// ② Body 滾動區
.chatbot-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.welcome-block {
  margin-bottom: 18px;
  line-height: 1.5;

  .welcome-greeting {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: $c-black;
  }

  .welcome-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: $c-grey-500;
  }

  .wave {
    display: inline-block;
    animation: wave 2s ease-in-out infinite;
    transform-origin: 70% 70%;
  }
}

@keyframes wave {
  0%, 60%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(14deg); }
  50% { transform: rotate(-4deg); }
}

// ③ Quick Actions 2x2 Grid
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 18px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 12px;
  border: 1px solid $c-grey-200;
  border-radius: 12px;
  background: $c-white;
  color: $c-black;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $c-orange;
    background: $c-orange-light;
    color: $c-orange;

    .qa-icon { color: $c-orange; }
  }

  .qa-icon {
    width: 18px;
    height: 18px;
    color: $c-grey-500;
    flex-shrink: 0;
    display: inline-flex;
    transition: color 0.2s ease;

    :deep(svg) { width: 100%; height: 100%; }
  }

  .qa-label {
    flex: 1;
    text-align: left;
  }
}

// 對話氣泡 (對話狀態)
.messages-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  display: flex;
  max-width: 100%;
}
.message-user {
  justify-content: flex-end;
  .message-bubble {
    background: $c-orange-light;
    color: $c-black;
    border-radius: 14px 14px 4px 14px;
  }
}
.message-bot {
  justify-content: flex-start;
  .message-bubble {
    background: $c-grey-50;
    color: $c-black;
    border-radius: 14px 14px 14px 4px;
  }
}
.message-bubble {
  max-width: 78%;
  padding: 9px 14px;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;

  // 對話內 a 連結
  :deep(a) {
    color: $c-orange;
    text-decoration: underline;
    font-weight: 500;
    &:hover { color: $c-orange-dark; }
  }
}

// 打字中三點動畫
.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 12px 14px;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $c-grey-500;
    animation: typing 1.4s infinite ease-in-out;
  }
  span:nth-child(1) { animation-delay: 0s; }
  span:nth-child(2) { animation-delay: 0.2s; }
  span:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
  30% { opacity: 1; transform: scale(1.2); }
}

// ④ Suggestion Chips
.suggestion-section {
  margin-bottom: 8px;
}

.suggestion-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: $c-grey-500;
  letter-spacing: 0.05em;
}

.suggestion-chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 6px;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb {
    background: $c-grey-200;
    border-radius: 2px;
  }
}

.chip-suggestion {
  flex-shrink: 0;
  padding: 7px 14px;
  border: 1px solid $c-grey-200;
  border-radius: 999px;
  background: $c-white;
  color: $c-black;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $c-orange;
    color: $c-orange;
  }
}

// ⑤.0 Action Bar — 顯式退出按鈕（手機 header X 易被網址列遮）
.chatbot-actions {
  display: flex;
  justify-content: flex-end;
  padding: 6px 12px;
  border-top: 1px solid $c-grey-200;
  background: $c-grey-50;
  flex-shrink: 0;
}

.chatbot-exit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: $c-grey-500;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: color .2s ease, background .2s ease;

  &:hover {
    color: $c-orange-dark;
    background: rgba($c-orange, .08);
  }

  &:focus-visible {
    outline: 2px solid rgba($c-orange, .55);
    outline-offset: 2px;
  }
}

// ⑤ Input Bar 固定底部
.chatbot-input {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border-top: 1px solid $c-grey-200;
  background: $c-white;
  flex-shrink: 0;

  .input-message {
    flex: 1;
    height: 40px;
    padding: 0 14px;
    border: 1px solid $c-grey-200;
    border-radius: 999px;
    background: $c-grey-50;
    font-size: 14px;
    color: $c-black;
    outline: none;
    transition: border-color 0.2s ease, background 0.2s ease;

    &::placeholder { color: $c-grey-500; }
    &:focus {
      border-color: $c-orange;
      background: $c-white;
    }
  }

  .btn-send {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: $c-orange;
    color: $c-white;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease, transform 0.1s ease;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background: $c-orange-dark;
      transform: scale(1.05);
    }
    &:disabled {
      background: $c-grey-200;
      cursor: not-allowed;
    }
  }
}

// 視窗進出動畫
.chatbot-window-enter-active,
.chatbot-window-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.chatbot-window-enter-from,
.chatbot-window-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

// RWD：行動裝置縮成浮窗（不再滿版），讓背景仍可見、內容不空盪
@media (max-width: 768px) {
  .chatbot-window {
    right: 16px;
    bottom: 96px;                       // 避開 entry button (56 + 24 + 16)
    top: auto;
    width: calc(100vw - 32px);
    max-width: 380px;
    max-height: min(620px, 80dvh);
    height: auto;
    border-radius: 16px;
  }

  // 不再滿版 → 取消 safe-area-inset-top 的 header padding，回到桌面風格
  .chatbot-header {
    padding-top: 0;
    min-height: 56px;
    align-items: center;
  }

  // input bar 保留 safe-area-bottom，鍵盤彈出時有用
  .chatbot-input {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }
}
</style>
