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

          <!-- 真人協助卡片暫時隱藏，避免初始畫面資訊過多。 -->
          <!--
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

interface SearchIntent {
  key: string;
  keywords: RegExp;
  reply: string;
  actions: FollowUpAction[];
}

// Default runtime mode.
// - 'script': pure script, only local rules, no API call.
// - 'ai': pure AI, call API directly and skip local scripted replies.
// - 'hybrid': script first, then API fallback.
const CHATBOT_DEFAULT_MODE = 'ai' as ChatbotRunMode;
const CHATBOT_MODE_STORAGE_KEY = 'ifare-chatbot-mode';
const CHATBOT_THINKING_DELAY_MS = 3000;

const chatbotModeOptions: Array<{ value: ChatbotRunMode; label: string; description: string }> = [
  { value: 'script', label: '快速導覽', description: '優先提供站內入口與常見問題方向' },
  { value: 'ai', label: '智能回覆', description: '協助整理開放式問題與站內資訊' },
  { value: 'hybrid', label: '綜合協助', description: '常見問題快速引導，進階問題再整理回覆' },
];

const OUT_OF_SCOPE_REPLY =
  '芒寶是網站介紹導覽員，主要協助說明本站頁面、按鈕與操作方式。這個問題不在導覽範圍內，你可以改問我「搜尋按鈕怎麼用」、「如何篩選福利政策」或「最新消息在哪裡」。';

const searchIntents: SearchIntent[] = [
  {
    key: 'greeting',
    keywords: /^(嗨|你好|哈囉|哈囉芒寶|hello|hi)[！!。.]?$/i,
    reply:
      '嗨，我是芒寶！我可以介紹本站各頁面的用途，也能說明搜尋、篩選、清空、選單與分頁等按鈕怎麼使用。',
    actions: [],
  },
  {
    key: 'clear-filter',
    keywords: /清空|清除|重設|取消篩選|清掉條件/,
    reply:
      '在 i-Fare 搜尋區按「清空」，就能一次清除受助者情況、年齡、戶籍地、關鍵字與進階篩選條件，再重新選擇需要的項目。',
    actions: [
      { label: '前往 i-Fare', type: 'route', to: '/ifare', variant: 'button' },
    ],
  },
  {
    key: 'filter',
    keywords: /篩選|受助者情況|年齡區間|戶籍地|經濟條件|特殊身分|下拉|選項/,
    reply:
      '在 i-Fare 搜尋區可以先選「受助者情況」、「年齡區間」與「戶籍地」；需要更多條件時按「篩選」，再選經濟條件或特殊身分，最後按「搜尋」查看結果。',
    actions: [
      { label: '前往 i-Fare', type: 'route', to: '/ifare', variant: 'button' },
    ],
  },
  {
    key: 'search',
    keywords: /搜尋按鈕|怎麼搜尋|如何搜尋|政策搜尋|搜尋福利|找福利|找補助|福利政策|補助|申請資格|關鍵字/,
    reply:
      '要找福利政策，請到 i-Fare 搜尋頁：先選需要的條件或輸入關鍵字，再按右側的「搜尋」按鈕。沒有關鍵字也可以搜尋，系統會依你選擇的條件整理站內政策。',
    actions: [
      { label: '前往 i-Fare', type: 'route', to: '/ifare', variant: 'button' },
    ],
  },
  {
    key: 'result',
    keywords: /搜尋結果|結果頁|政策列表|找到.*筆|第一筆|政策內容|政策詳情|詳細內容/,
    reply:
      '搜尋完成後，下方會列出符合條件的政策。每筆會顯示政策名稱、適用地區與資格限制；點政策名稱即可查看完整內容。若結果太多，可以回到上方增加篩選條件。',
    actions: [
      { label: '前往 i-Fare', type: 'route', to: '/ifare', variant: 'button' },
    ],
  },
  {
    key: 'pagination',
    keywords: /分頁|下一頁|上一頁|頁碼|換頁/,
    reply:
      '資料超過一頁時，列表下方會顯示頁碼與上一頁、下一頁按鈕。點選後會切換資料頁面，原本的搜尋條件會保留。',
    actions: [],
  },
  {
    key: 'menu',
    keywords: /主選單|選單|導覽列|頁籤|手機選單|漢堡選單|導覽按鈕/,
    reply:
      '電腦版的主要頁面選單在畫面上方；手機版請按右上角的選單按鈕展開。你可以從選單前往關於長穩、最新消息、福利專欄、公益夥伴與 i-Fare。',
    actions: [
      { label: '回到首頁', type: 'route', to: '/', variant: 'button' },
    ],
  },
  {
    key: 'foundation-establishment',
    keywords: /基金會.*(成立|創辦)|成立.*基金會|何時成立|什麼時候成立|哪一年成立|成立日期|創辦人|誰創辦/,
    reply:
      '長穩社福慈善基金會成立於 2017 年 7 月 19 日，由穩懋半導體董事長陳進財先生創辦；全穩生技農業科技集團副董事長鄔筠軒女士擔任第一任董事長迄今。基金會成立的主要目的是整合社會福利資訊，透過 i-Fare 福利好幫手提供資源，並推動教育平權、永續環境與社會關懷等公益計畫。可前往「關於長穩」頁面查看更多內容。',
    actions: [{ label: '關於長穩', type: 'route', to: '/about', variant: 'button' }],
  },
  {
    key: 'foundation-mission',
    keywords: /基金會.*使命|使命是什麼|長穩.*使命/,
    reply:
      '長穩社福慈善基金會以推動「環境保育、人才培育、社會關懷」三大核心行動為使命。基金會以文化、教育與科技公益為基礎，透過永續環境行動、教育支持及社福資源整合，努力減少社會落差，為台灣下一代打造更具韌性的未來。可前往「關於長穩」頁面查看更多內容。',
    actions: [{ label: '關於長穩', type: 'route', to: '/about', variant: 'button' }],
  },
  {
    key: 'core-environment',
    keywords: /環境保育|油芒|永續糧食|生態教育|文化復振/,
    reply:
      '在「環境保育」行動中，長穩面對極端氣候與環境變遷，以油芒復耕為起點，推動永續糧食研究、生態教育與在地文化復振，並透過跨域合作提升土地與社會的永續韌性。可前往「關於長穩」頁面查看更多內容。',
    actions: [{ label: '關於長穩', type: 'route', to: '/about', variant: 'button' }],
  },
  {
    key: 'core-talent',
    keywords: /人才培育|芒望未來|兒少心理|土地教育|青年志工|教師支持|志工培訓/,
    reply:
      '在「人才培育」行動中，長穩以教育為核心，涵蓋兒少心理健康、土地教育、青年志工與教師支持。基金會推動「芒望未來」教育計畫、兒少心理教育、志工培訓及跨校合作，強化孩子、青年與教育者的文化力、永續力與心理韌性。可前往「關於長穩」頁面查看更多內容。',
    actions: [{ label: '關於長穩', type: 'route', to: '/about', variant: 'button' }],
  },
  {
    key: 'core-care',
    keywords: /社會關懷|社福資源|資訊落差|資源透明|社會安全網/,
    reply:
      '在「社會關懷」行動中，長穩以 i-Fare 社福資源平台為核心，整合全台公部門與民間補助資訊，減少資訊落差，讓需要的人更快找到協助；並透過宣導、志工支援與跨機構合作，提升社會安全網的可近性與效能。可前往「關於長穩」頁面查看更多內容。',
    actions: [{ label: '前往 i-Fare', type: 'route', to: '/ifare', variant: 'button' }],
  },
  {
    key: 'foundation-core',
    keywords: /三大核心|核心介紹|核心行動|基金會.*核心|長穩.*核心/,
    reply:
      '基金會的三大核心是「環境保育、人才培育、社會關懷」。環境保育聚焦油芒復耕與永續教育；人才培育涵蓋兒少心理、土地教育、青年志工與教師支持；社會關懷則透過 i-Fare 整合社福資源，減少資訊落差。可前往「關於長穩」頁面查看更多內容。',
    actions: [{ label: '關於長穩', type: 'route', to: '/about', variant: 'button' }],
  },
  {
    key: 'members-purpose',
    keywords: /成員與宗旨|成員.*宗旨|團隊.*宗旨/,
    reply:
      '基金會由陳進財先生創辦，鄔筠軒女士擔任第一任董事長迄今，執行長為顏杏蓉女士。基金會相信每一份投入都能為孩子、家庭與土地帶來改變，並邀請大家透過加入行動、擔任志工、成為合作夥伴或提供支持，一起推動永續、教育與文化的善循環。可前往「關於長穩」頁面查看更多內容。',
    actions: [{ label: '關於長穩', type: 'route', to: '/about', variant: 'button' }],
  },
  {
    key: 'foundation-members',
    keywords: /基金會.*(成員|團隊)|主要成員|有哪些成員|董事長|副董事長|執行長|陳進財|鄔筠軒|顏杏蓉/,
    reply:
      '基金會創辦人是陳進財先生，現任穩懋半導體董事長暨總裁；鄔筠軒女士為全穩生技農業科技集團副董事長，並擔任基金會第一任董事長迄今；基金會執行長為顏杏蓉女士。可前往「關於長穩」頁面查看更多內容。',
    actions: [{ label: '關於長穩', type: 'route', to: '/about', variant: 'button' }],
  },
  {
    key: 'foundation-purpose',
    keywords: /基金會.*宗旨|宗旨是什麼|如何參與|加入行動|成為志工|支持基金會|支持我們|合作夥伴/,
    reply:
      '長穩相信每一份投入都能為孩子、家庭與土地帶來改變，並推動永續、教育與文化的善循環。你可以透過參與教育活動與志工服務、成為合作夥伴共同推動教育支持與社福資源整合，或提供支持來擴大公益能量。可前往「關於長穩」頁面查看更多內容。',
    actions: [{ label: '關於長穩', type: 'route', to: '/about', variant: 'button' }],
  },
  {
    key: 'about',
    keywords: /認識長穩|關於長穩|基金會介紹|長穩在做什麼|團隊介紹/,
    reply:
      '長穩社福慈善基金會成立於 2017 年 7 月 19 日，由陳進財先生創辦，鄔筠軒女士擔任第一任董事長迄今。基金會以環境保育、人才培育、社會關懷為三大核心，整合福利資訊、推動教育支持與永續行動；你也可以前往「關於長穩」頁面查看成員、宗旨及參與方式。',
    actions: [
      { label: '關於長穩', type: 'route', to: '/about', variant: 'button' },
    ],
  },
  {
    key: 'news',
    keywords: /最新消息|公告|近期消息|新聞|活動消息/,
    reply:
      '「最新消息」頁會顯示基金會公告、活動與近期更新。從上方選單點「最新消息」進入列表，再點文章標題查看完整內容。',
    actions: [{ label: '最新消息', type: 'route', to: '/news', variant: 'button' }],
  },
  {
    key: 'articles',
    keywords: /福利專欄|專欄頁|懶人包|政策文章|文章列表/,
    reply:
      '「福利專欄」會整理福利資訊、政策文章與懶人包。從上方選單點「福利專欄」，再選擇文章標題閱讀完整內容。',
    actions: [{ label: '福利專欄', type: 'route', to: '/articles', variant: 'button' }],
  },
  {
    key: 'partners',
    keywords: /公益夥伴|夥伴頁|合作單位|服務分類|核心議題/,
    reply:
      '「公益夥伴」頁可以依兒少、老人、身心障礙等服務分類，或環境保育、人才培育、社會關懷等核心議題查看合作單位。點分類頁籤即可切換內容。',
    actions: [{ label: '公益夥伴', type: 'route', to: '/collaborator', variant: 'button' }],
  },
  {
    key: 'contact',
    keywords: /聯絡|電話|email|facebook|fb|社群連結|客服資訊/,
    reply:
      '基金會聯絡資訊與社群連結放在網站頁面下方。你可以查看聯絡電話，或點 Facebook 圖示前往粉絲團。',
    actions: [],
  },
  {
    key: 'ifare',
    keywords: /i-?fare平台|介紹.*i-?fare|i-?fare.*(功能|怎麼用|是什麼)|福利好幫手/,
    reply:
      '「i-Fare」是本站的福利政策搜尋平台。你可以用受助者情況、年齡區間、戶籍地與關鍵字查找政策，需要更多條件時再按「篩選」。',
    actions: [{ label: '前往 i-Fare', type: 'route', to: '/ifare', variant: 'button' }],
  },
  {
    key: 'site',
    keywords: /網站|網頁|導覽|介紹|首頁|長穩基金會|能做什麼|可以問什麼|怎麼用|使用方式/,
    reply:
      '本站主要包含「關於長穩」、「最新消息」、「福利專欄」、「公益夥伴」與「i-Fare」五個區域。你可以問我某個頁面在哪裡，或搜尋、篩選、清空等按鈕怎麼使用。',
    actions: [
      { label: '關於長穩', type: 'route', to: '/about', variant: 'button' },
      { label: 'i-Fare 福利政策', type: 'route', to: '/ifare', variant: 'button' },
    ],
  },
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

const SCRIPT_MODE_FALLBACK_REPLY = OUT_OF_SCOPE_REPLY;

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

async function waitForThinkingDelay(startedAt: number) {
  const remaining = CHATBOT_THINKING_DELAY_MS - (Date.now() - startedAt);
  if (remaining <= 0) return;
  await new Promise((resolve) => window.setTimeout(resolve, remaining));
}

function normalizePrompt(prompt: string) {
  return prompt.trim().slice(0, 200);
}

function normalizeDisplayedReply(reply: string) {
  const normalized = String(reply || '')
    .replace(/^(?:好呀|好啊|好的|沒問題)[！!，,。\s]*/u, '')
    .replace(/\s+/g, ' ')
    .trim();
  const characters = Array.from(normalized);
  if (characters.length <= 50) return normalized;

  let sentenceEnd = -1;
  for (let index = 29; index < 50; index += 1) {
    if (/[。！？!?]/u.test(characters[index] || '')) sentenceEnd = index;
  }
  if (sentenceEnd >= 29) return characters.slice(0, sentenceEnd + 1).join('');

  return `${characters.slice(0, 49).join('').replace(/[，、；：,;:\s]+$/u, '')}。`;
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

function isWebsiteGuidePrompt(prompt: string) {
  return /網站|網頁|頁面|首頁|導覽|選單|按鈕|欄位|輸入框|下拉|選項|篩選|清空|清除|重設|頁籤|搜尋|結果|政策|福利|補助|申請|關鍵字|分頁|上一頁|下一頁|關於長穩|認識長穩|長穩基金會|成立|創辦|使命|宗旨|三大核心|核心行動|環境保育|人才培育|社會關懷|油芒|芒望未來|成員|團隊|董事長|副董事長|執行長|陳進財|鄔筠軒|顏杏蓉|志工|參與|加入行動|合作夥伴|支持基金會|i-?fare|最新消息|福利專欄|公益夥伴|公告|活動|文章|懶人包|合作單位|聯絡|電話|email|facebook|fb/i.test(prompt);
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

  if (/網站|導覽|介紹|長穩|基金會|關於/.test(text)) {
    actions.push(
      { label: '關於長穩', type: 'route', to: '/about', variant: 'button' },
      { label: 'i-Fare 福利政策', type: 'route', to: '/ifare', variant: 'button' },
      { label: '最新消息', type: 'route', to: '/news', variant: 'link' },
      { label: '福利專欄', type: 'route', to: '/articles', variant: 'link' },
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
      { label: '前往關於長穩', type: 'route', to: '/about', variant: 'link' },
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

function getLocalKnowledgeReply(prompt: string) {
  const matchedIntent = matchSearchIntent(prompt);
  return matchedIntent?.reply || '';
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

async function requestScriptModeReply(prompt: string, sessionId: number, startedAt: number) {
  const localReply = getLocalKnowledgeReply(prompt) || SCRIPT_MODE_FALLBACK_REPLY;
  await waitForThinkingDelay(startedAt);
  if (sessionId !== chatSessionId.value) return;
  pushMessage('bot', normalizeDisplayedReply(localReply));
}

async function requestAiModeReply(prompt: string, sessionId: number, startedAt: number) {
  await requestApiReply(prompt, sessionId, 'ai', startedAt);
}

async function requestHybridModeReply(prompt: string, sessionId: number, startedAt: number) {
  // Hybrid mode now uses the API first. Local rules are kept only as request-failure fallback.
  await requestApiReply(prompt, sessionId, 'hybrid', startedAt);
}

async function requestApiReply(prompt: string, sessionId: number, mode: ChatbotApiMode, startedAt: number) {
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

    await waitForThinkingDelay(startedAt);
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
    pushMessage(
      'bot',
      normalizeDisplayedReply(getLocalKnowledgeReply(prompt) || SCRIPT_MODE_FALLBACK_REPLY),
    );
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
.follow-up-actions,
.contact-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-suggestion,
.follow-up-action,
.contact-pill {
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

.contact-card {
  padding: 12px;
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(23, 24, 24, 0.94), rgba(39, 39, 39, 0.88));
  color: #ffffff;
}

.contact-card-top h5 {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 800;
}

.contact-card-top p {
  margin: 0 0 10px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 13px;
  line-height: 1.45;
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
