<template>
  <div class="app-body" name="about">
    <CompBreadCrumb />
    <div class="part-top">
      <div class="title-component">
        <!-- <i class="ic-title-pattern"></i> -->
        <h1 class="comp-title">關於長穩</h1>
        <span class="comp-shadow">ABOUT</span>
      </div>
    </div>
    <DynamicChildLinks parent-key="about" parent-label="關於長穩" title="關於長穩延伸頁面" />
    <div class="section-list">
      <section class="section section-about-what">
        <div class="part-what-top">
          <div class="card card-what">
            <div class="title-component">
              <i class="ic-title-pattern"></i>
              <h3 class="comp-title">基金會的成立</h3>
            </div>
            <div class="info-what">
              長穩社福慈善基金會成立於2017年7月19日，由穩懋半導體董事長陳進財先生創辦；全穩生技農業科技集團副董事長鄔筠軒女士擔任第一任董事長迄今。<br>基金會的主要目的是整合社會福利資訊，並透過「i-fare福利好幫手」網站提供資源，同時推動教育平權、永續環境及社會關懷等公益計畫。
            </div>
          </div>
          <div class="card card-what-img ic-img-about-1"></div>
        </div>
        <div class="part-what-bottom">
          <div class="card card-what">
            <div class="title-component">
              <i class="ic-title-pattern"></i>
              <h3 class="comp-title">基金會的使命</h3>
            </div>
            <div class="info-what">
                長穩社福慈善基金會以推動 <strong>環境保育、人才培育、社會關懷</strong> 三大核心行動為使命。<br>
                我們以「文化」、「教育」與「科技公益」為基礎，透過永續環境行動、教育支持計畫與社福資源整合，致力減少社會落差，並為台灣的下一代打造更具韌性的未來。
            </div>
          </div>
          <div class="card card-what-img ic-img-about-2"></div>
          <div class="card card-what-img ic-img-about-3"></div>
        </div>
      </section>
      <section class="section section-about-how">
        <div class="part-how-top">
            <div class="title-component">
              <i class="ic-title-pattern"></i>
              <h3 class="comp-title">基金會三大核心介紹</h3>
            </div>
        </div>
        <div class="part-how-body">
            <div class="how-content" :class="{ 'is-active': activeHow === 0 }" tabindex="0" data-mascot-tip="這裡會展開環境保育的行動內容。" @click="toggleHow(0)" @keyup.enter="toggleHow(0)" @keyup.space.prevent="toggleHow(0)">
                <div class="how-top">
                    <i class="how-logo ic-about-how-2"></i>
                    <h4 class="how-title">環境保育</h4>
                </div>
                <div class="how-info-wrap">
                    <div class="how-info">面對極端氣候與環境變遷挑戰，長穩以油芒復耕為起點，推動永續糧食研究、生態教育與在地文化復振，並透過跨域合作提升土地與社會的永續韌性。</div>
                </div>
            </div>
            <div class="how-content" :class="{ 'is-active': activeHow === 1 }" tabindex="0" data-mascot-tip="這裡會展開人才培育的行動內容。" @click="toggleHow(1)" @keyup.enter="toggleHow(1)" @keyup.space.prevent="toggleHow(1)">
                <div class="how-top">
                    <i class="how-logo ic-about-how-1"></i>
                    <h4 class="how-title">人才培育</h4>
                </div>
                <div class="how-info-wrap">
                    <div class="how-info">以教育為核心，從兒少心理健康、土地教育、青年志工到教師支持，打造完整的成長與陪伴系統。<br>
我們推動「芒望未來」教育計畫、兒少心理教育、志工培訓與跨校合作，強化孩子、青年與教育者的文化力、永續力與心理韌性。
</div>
                </div>
            </div>
            <div class="how-content" :class="{ 'is-active': activeHow === 2 }" tabindex="0" data-mascot-tip="這裡會展開社會關懷的行動內容。" @click="toggleHow(2)" @keyup.enter="toggleHow(2)" @keyup.space.prevent="toggleHow(2)">
                <div class="how-top">
                    <i class="how-logo ic-about-how-3"></i>
                    <h4 class="how-title">社會關懷</h4>
                </div>
                <div class="how-info-wrap">
                    <div class="how-info">以 I-fare 社福資源平台為核心，整合全台公部門與民間補助資訊，減少資訊落差，讓需要的人群更快找到協助。<br>透過宣導、志工支援與跨機構合作，我們持續推動資源透明化，提升社會安全網的可近性與效能。
</div>
                </div>
            </div>
        </div>
      </section>
      <section class="section section-about-member">
        <div class="part-member-top">
            <div class="title-component">
              <i class="ic-title-pattern"></i>
              <h3 class="comp-title">成員與宗旨</h3>
            </div>
        </div>
        <div class="part-member-body">
            <div class="member-content">
                <div class="member-info" name="boss_E">
                    <ul class="list-unstyled member-intros">
                        <li>穩懋半導體股份有限公司</li>
                        <li>董事長暨總裁</li>
                    </ul>
                    <h4 class="member-name">陳進財</h4>
                </div>
                <div class="bg-mask"></div>
                <div class="member-photo ic-about-member-1"></div>
            </div>
            <div class="member-content">
                <div class="member-info" name="boss_P">
                    <ul class="list-unstyled member-intros">
                        <li>全穩生技農業科技集團</li>
                        <li>副董事長</li>
                    </ul>
                    <h4 class="member-name">鄔筠軒</h4>
                </div>
                <div class="bg-mask"></div>
                <div class="member-photo ic-about-member-2"></div>
            </div>
        </div>
        <div class="part-member-bottom about-member-bottom-v2">
            <div class="executive-row">
                <span class="executive-title">執行長</span>
                <h4 class="executive-name">顏杏蓉</h4>
            </div>
            <div class="purpose-content">
                <ul class="list-unstyled purpose-list">
                    <li class="purpose-item">
                        <span class="purpose-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>
                            </svg>
                        </span>
                        <div class="purpose-text">
                            <h6 class="purpose-title">一起加入行動</h6>
                            <p class="purpose-info">
                                我們相信，每一份投入都能為孩子、為家庭、為土地帶來改變。<br>
                                歡迎加入長穩，一起推動永續、教育與文化的善循環。
                            </p>
                        </div>
                    </li>
                    <li class="purpose-item">
                        <span class="purpose-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="7" r="3.2"/>
                                <path d="M3 21v-1a6 6 0 0 1 12 0v1"/>
                                <path d="M19 8v6M16 11h6"/>
                            </svg>
                        </span>
                        <div class="purpose-text">
                            <h6 class="purpose-title">成為志工</h6>
                            <p class="purpose-info">陪伴孩子學習、參與教育活動，並共同推動資源整合等公益行動。</p>
                        </div>
                    </li>
                    <li class="purpose-item">
                        <span class="purpose-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m11 17-4 4-3.5-3.5L7 14M13 7l4-4 3.5 3.5L17 10"/>
                                <path d="m8 13 5-5"/>
                                <path d="M9 12 4 7l3-3 5 5"/>
                                <path d="m12 15 5 5 3-3-5-5"/>
                            </svg>
                        </span>
                        <div class="purpose-text">
                            <h6 class="purpose-title">成為合作夥伴</h6>
                            <p class="purpose-info">與我們攜手推動教育支持、社福資源整合、文化永續與環境保育。</p>
                        </div>
                    </li>
                    <li class="purpose-item">
                        <span class="purpose-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 12V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4"/>
                                <path d="M2 12h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8z"/>
                                <path d="M12 22V6"/>
                                <path d="M12 6S9 2.5 7 4s.5 4 5 4M12 6s3-3.5 5-2-.5 4-5 4"/>
                            </svg>
                        </span>
                        <div class="purpose-text">
                            <h6 class="purpose-title">支持我們</h6>
                            <p class="purpose-info">您的支持能擴大公益能量，讓更多孩子獲得陪伴，更多家庭得到協助。</p>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
      </section>
      <!-- 2026-05-25 UIUX #43 — 基金會歷程時間軸 + #20 滾動觸發 -->
      <!--
      <section class="section section-about-timeline" v-scroll-reveal>
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">基金會歷程</h3>
            <span class="comp-shadow">JOURNEY</span>
          </div>
          <p class="timeline-subtitle">從 2017 至今,長穩持續耕耘環境、教育與社會關懷</p>
        </div>
        <ol class="timeline" aria-label="基金會大事紀">
          <li v-for="(item, idx) in timeline" :key="item.year + item.title" class="timeline-item" :style="{ animationDelay: `${idx * 0.08}s` }" :data-mascot-tip="`這裡是 ${item.year} 年的里程碑：${item.title}。`">
            <span class="timeline-year">{{ item.year }}</span>
            <span class="timeline-dot" aria-hidden="true"></span>
            <div class="timeline-content">
              <h4 class="timeline-title">{{ item.title }}</h4>
              <p class="timeline-desc">{{ item.desc }}</p>
            </div>
          </li>
        </ol>
      </section>
      -->

      <!-- 2026-05-25 UIUX #39 — 合作夥伴 logo 輪播(CSS marquee 無限滑動)+ #20 滾動進場 -->
      <section v-if="partnerLogos.length > 0" class="section section-about-partners" v-scroll-reveal>
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">公益夥伴</h3>
            <span class="comp-shadow">PARTNERS</span>
          </div>
          <p class="partners-subtitle">與長穩一起推動社會關懷的公益夥伴們</p>
        </div>
        <div class="partner-marquee" aria-label="合作夥伴 logo 滑動展示">
          <div class="partner-marquee__track">
            <a
              v-for="(_p, idx) in marqueeLoop"
              :key="`${_p.id}-${idx}`"
              class="partner-marquee__item"
              href="/collaborator"
              :data-mascot-tip="`點這裡會帶你看 ${_p.title} 的公益夥伴介紹。`"
              :aria-label="`查看 ${_p.title} 詳細資訊`"
            >
              <img :src="_p.imageFile" :alt="`${_p.title} logo`" loading="lazy" />
            </a>
          </div>
        </div>
        <div class="partners-cta">
          <NuxtLink to="/collaborator" class="btn-more transition-general" data-mascot-tip="點這裡會打開完整的公益夥伴列表。">查看所有夥伴</NuxtLink>
        </div>
      </section>

      <section class="section section-about-bottom">
        <div class="card-advance">
            <div class="advance-enter">
                <span class="advance-info">邀請你體驗我們的 i-Fare 社福資訊搜尋服務</span>
                <NuxtLink to="/ifare" class="advance-link" data-mascot-tip="點這裡會直接前往 i-Fare 福利查詢。">
                    <span>前往 i-Fare</span>
                    <i class="ic-arrow-right-primary-dark link-url"></i>
                </NuxtLink>
            </div>
            <div class="advance-search">
                <span class="advance-info">或者進一步瞭解我們的行動</span>
                <NuxtLink to="/news" class="advance-link" data-mascot-tip="點這裡會帶你去看最新消息。">
                    <span>查看最新消息</span>
                    <i class="ic-arrow-right-orange link-url"></i>
                </NuxtLink>
            </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '關於長穩'
})
definePageMeta({
  title: '關於長穩',
  toLinkName: '首頁',
  toLink: '/'
})

const activeHow = ref<number | null>(null);
function toggleHow(idx: number) {
  activeHow.value = activeHow.value === idx ? null : idx;
}

// 2026-05-25 UIUX #43 — 基金會歷程時間軸資料
// (內容依 about 頁既有文字推得;實際年份請以基金會官方資料更新)
const timeline = [
  {
    year: '2017',
    title: '基金會成立',
    desc: '由穩懋半導體董事長陳進財先生於 7 月 19 日創辦,鄔筠軒女士擔任第一任董事長,推動公益願景。',
  },
  {
    year: '2018',
    title: '三大核心行動啟動',
    desc: '確立環境保育、人才培育、社會關懷三大方向,展開公益佈局。',
  },
  {
    year: '2019',
    title: '油芒復耕計畫',
    desc: '推動原生作物油芒復耕,結合永續糧食研究、生態教育與在地文化復振。',
  },
  {
    year: '2020',
    title: 'i-Fare 福利好幫手上線',
    desc: '整合全台公部門與民間補助資訊,讓需要的人群更快找到協助。',
  },
  {
    year: '2022',
    title: '「芒望未來」教育計畫',
    desc: '從兒少心理健康、土地教育、青年志工到教師支持,打造完整成長陪伴系統。',
  },
  {
    year: '2024',
    title: '兒少心理健康計畫',
    desc: '深化兒少心理教育、志工培訓與跨校合作,強化孩子與教育者的心理韌性。',
  },
  {
    year: '至今',
    title: '持續耕耘',
    desc: '透過資源整合與跨機構合作,持續推動社會安全網的可近性與效能。',
  },
];

// 2026-05-25 UIUX #39 — 合作夥伴 logo 輪播
const { $WebApiGet } = useNuxtApp();
const { getApiResultArray } = useApiResult();

// 2026-06-08 UIUX #191 — 改用 useAsyncData，SSR 階段即取得合作夥伴 logo，避免 onMounted 才抓造成首屏閃入
const { data: partnerLogos } = await useAsyncData(
  'about-partner-logos',
  async () => {
    try {
      const res: any = await $WebApiGet('/Collaborator/GetCollaboratorList');
      const arr = getApiResultArray<any>(res);
      return arr
        .map((c: any) => ({ id: c.id, title: c.title, imageFile: c.imageFile }))
        .filter((c: any) => !!c.imageFile)
        .slice(0, 12);
    } catch (e) {
      console.warn('[about] partners load failed', e);
      return [] as Array<{ id: number; title: string; imageFile: string }>;
    }
  },
  { default: () => [] as Array<{ id: number; title: string; imageFile: string }> },
);

// CSS marquee 需要把 list 重複一次才能無縫接接(translateX -50% loop)
const marqueeLoop = computed(() => [...(partnerLogos.value ?? []), ...(partnerLogos.value ?? [])]);
</script>

<style lang="scss" scoped>
// UIUX 新需求 (2026-05-05): 「一起加入行動」等 4 項加 icon + 重整 markup
// 對應 _color.scss 色票
$c-orange: #EA5504;
$c-orange-light: #FFE6D5;
$c-black: #171818;

// 「執行長 顏杏蓉」橫排、置中於 4 項上方（覆寫全域 .part-member-bottom 的 row 排版）
// 用 .app-body[name="about"] 提升特異度 + !important 雙保險，蓋過 _appBody_about.scss
.app-body[name="about"] .part-member-bottom.about-member-bottom-v2 {
  flex-direction: column !important;
  align-items: center !important;
  gap: 40px !important;
  margin-top: 60px;
}

// 對齊董事長呈現方式：「執行長」標籤在橘色方框上方且**靠左**（如同 boss_P/boss_E ::before 的 left: 0）
.executive-row {
  display: inline-flex;
  flex-direction: column;        // 標籤在上 / 名字框在下
  align-items: flex-start;       // 靠左對齊（不置中）
  gap: 8px;
  margin: 0;
}

// 「執行長」對齊 _appBody_about.scss 中董事長 / 創辦人 ::before 的視覺
.executive-title {
  font-size: 16px;
  color: $c-orange;
  font-weight: 500;
  line-height: 28px;
}

// 姓名框：方框 + 靈動島 hover 效果（對齊整站 _appBody_about.scss 內 morph 卡片的 cubic-bezier 動畫）
.executive-name {
  margin: 0;
  padding: 18px 28px;
  background: rgba($c-orange, 0.92);
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 500;
  line-height: 28px;
  border-radius: 4px;
  cursor: default;
  will-change: transform;
  box-shadow:
    0 11px 30px -8px rgba($c-orange, 0.5),
    inset 0 1px 0 rgba(#FFFFFF, 0.18);
  transition:
    transform 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    box-shadow 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    background 0.32s cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    transform: translateY(-4px) scale(1.04);
    background: $c-orange;
    box-shadow:
      0 18px 40px -10px rgba($c-orange, 0.6),
      inset 0 1px 0 rgba(#FFFFFF, 0.28);
  }
}

// 4 項強制同一排（覆寫 global .purpose-content max-width: 502px 限制 + 不換行）
// 寬度對齊下方 .card-advance（section-about-bottom 內的兩欄 CTA 卡）
:deep(.purpose-content) {
  max-width: 920px !important;
  width: 100%;
}

// 同步把下方 .card-advance 框定為相同寬度，避免兩個區塊看起來錯位
:deep(.section-about-bottom .card-advance) {
  width: 920px;
  max-width: 100%;
  box-sizing: border-box;
}

.purpose-list {
  display: flex;
  flex-direction: row;        // 4 項橫排
  flex-wrap: nowrap;          // 強制不換行
  justify-content: center;
  gap: 16px;
  margin: 0;
  padding: 0;
  width: 100%;
}

// 每一項做成輕量卡片 — 與上方 executive name 的橘色方框視覺呼應
.purpose-item {
  flex: 1 1 0;                // 4 等分
  min-width: 0;
  padding: 20px 18px;
  display: flex;
  flex-direction: column;     // icon 在上、文字在下
  align-items: flex-start;
  gap: 12px;
  background: rgba(#FFFFFF, 0.7);
  border: 1px solid rgba($c-black, 0.06);
  border-radius: 12px;
  cursor: default;
  will-change: transform;
  box-shadow:
    0 8px 24px -8px rgba($c-black, 0.08),
    inset 0 1px 0 rgba(#FFFFFF, 0.6);
  transition:
    transform 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    box-shadow 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    border-color 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    background 0.32s cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    transform: translateY(-4px) scale(1.02);
    background: #FFFFFF;
    border-color: rgba($c-orange, 0.3);
    box-shadow:
      0 16px 36px -10px rgba($c-orange, 0.18),
      inset 0 1px 0 rgba(#FFFFFF, 0.8);

    .purpose-icon {
      transform: translateY(-2px) scale(1.05);
      background: $c-orange;
      color: #FFFFFF;
    }
  }
}

.purpose-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: $c-orange-light;
  color: $c-orange;
  border-radius: 12px;
  transition: transform 0.25s ease, background 0.25s ease;

  svg {
    width: 22px;
    height: 22px;
  }
}

// (purpose-item:hover .purpose-icon 已內嵌進 .purpose-item:hover 規則內)

.purpose-text {
  flex: 1;
  min-width: 0;
}

// 覆寫全域 _appBody_about.scss 的 .purpose-title / .purpose-info margin
.purpose-text .purpose-title {
  margin: 0 0 6px;
  font-size: 18px;
  color: $c-black;
  font-weight: 600;
  line-height: 1.5;
}

.purpose-text .purpose-info {
  margin: 0;
  font-size: 15px;
  color: rgba($c-black, 0.7);
  line-height: 1.7;
}

@media (max-width: 768px) {
  .purpose-list {
    flex-direction: column;       // 手機改回垂直 stack
    flex-wrap: nowrap;
    gap: 18px;
    max-width: 100%;
  }
  .purpose-item {
    flex: 1 1 auto;
    max-width: 100%;
    flex-direction: row;          // 手機 icon 左 + 文字右（節省垂直空間）
    align-items: flex-start;
    gap: 12px;
  }
  .purpose-icon { width: 38px; height: 38px; svg { width: 18px; height: 18px; } }
  .purpose-text .purpose-title { font-size: 16px; }
  .purpose-text .purpose-info { font-size: 14px; line-height: 1.6; }
}

// 2026-05-25 UIUX #43 — 歷程時間軸
.section-about-timeline {
  padding: 56px 24px 32px;
  max-width: 960px;
  margin: 0 auto;

  .timeline-subtitle {
    margin: 16px 0 40px;
    color: rgba($c-black, 0.6);
    text-align: center;
    line-height: 1.7;
  }
}

.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 100px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: linear-gradient(180deg, rgba($c-orange, 0.4), rgba($c-orange, 0.1));
  }
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 90px 22px 1fr;
  gap: 12px;
  align-items: start;
  padding: 16px 0;
  opacity: 0;
  transform: translateX(-12px);
  animation: timelineFadeIn 0.55s ease-out forwards;
}

@keyframes timelineFadeIn {
  to { opacity: 1; transform: translateX(0); }
}

.timeline-year {
  font-family: 'Noto Serif TC', serif;
  font-size: 18px;
  font-weight: 700;
  color: $c-orange;
  text-align: right;
  padding-top: 2px;
}

.timeline-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-top: 6px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid $c-orange;
  box-shadow: 0 0 0 4px rgba($c-orange, 0.12);
  z-index: 1;
  justify-self: center;
}

.timeline-content {
  padding: 0 8px 0 6px;
}

.timeline-title {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 700;
  color: $c-black;
  line-height: 1.4;
}

.timeline-desc {
  margin: 0;
  color: rgba($c-black, 0.7);
  line-height: 1.7;
  font-size: 14px;
}

@media (max-width: 640px) {
  .timeline::before { left: 38px; }
  .timeline-item { grid-template-columns: 36px 22px 1fr; gap: 8px; }
  .timeline-year { font-size: 15px; }
}

@media (prefers-reduced-motion: reduce) {
  .timeline-item { animation: none; opacity: 1; transform: none; }
}

// 2026-05-25 UIUX #39 — 合作夥伴 logo 輪播(CSS marquee 無限滑動)
.section-about-partners {
  padding: 32px 0 48px;

  .part-top { padding: 0 24px; text-align: center; }
  .partners-subtitle {
    margin: 16px 0 32px;
    color: rgba($c-black, 0.6);
    line-height: 1.7;
  }
}

.partner-marquee {
  overflow: hidden;
  position: relative;
  // 漸層遮罩讓兩側淡出,看不到 loop 接縫
  mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
}

.partner-marquee__track {
  display: flex;
  gap: 32px;
  width: max-content;
  animation: partnerScroll 40s linear infinite;
}

.partner-marquee:hover .partner-marquee__track {
  animation-play-state: paused;
}

@keyframes partnerScroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.partner-marquee__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 80px;
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid rgba($c-black, 0.08);
  border-radius: 12px;
  flex-shrink: 0;
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    opacity: 0.75;
    filter: grayscale(0.3);
    transition: opacity 0.2s ease, filter 0.2s ease;
  }

  &:hover {
    border-color: rgba($c-orange, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 10px 22px -10px rgba($c-orange, 0.25);

    img {
      opacity: 1;
      filter: grayscale(0);
    }
  }
}

.partners-cta {
  text-align: center;
  margin-top: 24px;
}

@media (max-width: 640px) {
  .partner-marquee__item { width: 110px; height: 64px; }
  .partner-marquee__track { gap: 20px; animation-duration: 30s; }
}

@media (prefers-reduced-motion: reduce) {
  .partner-marquee__track { animation: none; }
}
</style>
