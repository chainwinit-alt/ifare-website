<template>
  <div class="app-body" name="about">
    <div class="page-navs">
      <ul class="list-unstyled">
        <li v-for="_page in $route.matched"><NuxtLink :to="`${_page.meta.toLink}`">{{ _page.meta.toLinkName }}</NuxtLink></li>
      </ul>
    </div>
    <div class="part-top">
      <div class="title-component">
        <!-- <i class="ic-title-pattern"></i> -->
        <h3 class="comp-title">關於長穩</h3>
        <span class="comp-shadow">ABOUT</span>
      </div>
    </div>
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
            <div class="how-content" :class="{ 'is-active': activeHow === 0 }" tabindex="0" @click="toggleHow(0)" @keyup.enter="toggleHow(0)" @keyup.space.prevent="toggleHow(0)">
                <div class="how-top">
                    <i class="how-logo ic-about-how-2"></i>
                    <h4 class="how-title">環境保育</h4>
                </div>
                <div class="how-info-wrap">
                    <div class="how-info">面對極端氣候與環境變遷挑戰，長穩以油芒復耕為起點，推動永續糧食研究、生態教育與在地文化復振，並透過跨域合作提升土地與社會的永續韌性。</div>
                </div>
            </div>
            <div class="how-content" :class="{ 'is-active': activeHow === 1 }" tabindex="0" @click="toggleHow(1)" @keyup.enter="toggleHow(1)" @keyup.space.prevent="toggleHow(1)">
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
            <div class="how-content" :class="{ 'is-active': activeHow === 2 }" tabindex="0" @click="toggleHow(2)" @keyup.enter="toggleHow(2)" @keyup.space.prevent="toggleHow(2)">
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
                    <h6 class="member-name">陳進財</h6>
                </div>
                <div class="bg-mask"></div>
                <div class="member-photo ic-about-member-1"></div>
            </div>
            <div class="member-content">
                <div class="member-info" name="boss_P">
                    <ul class="list-unstyled member-intros">
                    </ul>
                    <h6 class="member-name">鄔筠軒</h6>
                </div>
                <div class="bg-mask"></div>
                <div class="member-photo ic-about-member-2"></div>
            </div>
        </div>
        <div class="part-member-bottom">
            <div class="member-content">
                <div class="member-info" name="boss_C">
                    <ul class="list-unstyled member-intros">
                    </ul>
                    <h6 class="member-name">顏杏蓉</h6>
                </div>
            </div>
            <div class="purpose-content">
                <h6 class="purpose-title">一起加入行動</h6>
                <span class="purpose-info">
                                          我們相信，每一份投入都能為孩子、為家庭、為土地帶來改變。<br>
                                          歡迎加入長穩，一起推動永續、教育與文化的善循環。<br>
                <h6 class="purpose-title">成為志工</h6>
                                          陪伴孩子學習、參與教育活動，並共同推動資源整合等公益行動。<br>
                <h6 class="purpose-title">成為合作夥伴</h6>
                                          與我們攜手推動教育支持、社福資源整合、文化永續與環境保育。<br>
                <h6 class="purpose-title">支持我們</h6>
                                          您的支持能擴大公益能量，讓更多孩子獲得陪伴，更多家庭得到協助。<br>
</span>
            </div>
        </div>
      </section>
      <section class="section section-about-bottom">
        <div class="card-advance">
            <div class="advance-enter">
                <span class="advance-info">邀請你體驗我們的 i-Fare 社福資訊搜尋服務</span>
                <NuxtLink to="/ifare" class="advance-link">
                    <span>前往 i-Fare</span>
                    <i class="ic-arrow-right-primary-dark link-url"></i>
                </NuxtLink>
            </div>
            <div class="advance-search">
                <span class="advance-info">或者進一步瞭解我們的行動</span>
                <NuxtLink to="/news" class="advance-link">
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
</script>