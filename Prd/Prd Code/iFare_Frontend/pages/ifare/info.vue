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
              <div class="info-content">
                {{ _welfareItem.qualification }}
              </div>
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
              <div class="info-content">
                {{ _welfareItem.evidence }}
              </div>
            </div>
            <div class="part part-office">
              <div class="bg-office"></div>
              <div class="title-component">
                <i class="ic-title-pattern"></i>
                <h3 class="comp-title">洽辦單位</h3>
              </div>
              <div class="info-content" :class="{'cursor-pointer': _welfareItem.officeUnitID != 1}" @click="JumpTo(_welfareItem.officeUnitID)">
                <label :class="{'cursor-pointer': _welfareItem.officeUnitID != 1, 'info-label-tel': _welfareItem.welfareTel}">
                  {{ _welfareItem.officeUnitInfo }}
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
const _infoID = route.query.id;

function JumpTo(id: any) {
  if (id == 1) return false;
  $router.push({ path: "/ifare/contact", query: { id: id } });
}

interface infoItem {
  id: number;
  title: string;
  qualification: string;
  evidence: string;
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
  welfareInfo: "",
  welfareTel: "",
  welfareTelStr: "",
  releaseTime: "",
  updateTime: "",
  officeUnitInfo: "",
  officeUnitID: 0,
});
const welfareGet = $WebApiGet("/FarePolicy/GetIFarePolicyDetail", {
  farePolicyID: _infoID,
});

// Office Unit
interface OfficeUnitItem {
  id: number;
  title: string;
}

const officeList = reactive<Array<OfficeUnitItem>>([]);

const listOffice = $WebApiGet("/FareOfficeUnit/GetIFareOfficeUnitList");
listOffice.then((res: any) => {
  const _data = res.result.result;
  let _newsList: Array<OfficeUnitItem> = _data.map((item: any, i: number) => {
    return {
      id: item.id,
      title: item.title,
    };
  });
  officeList.push(..._newsList);

  welfareGet.then((res: any) => {
    const _data = res.result.result;
    
    _welfareItem.id = _data.id;
    _welfareItem.title = _data.title;
    _welfareItem.qualification = _data.qualification;
    _welfareItem.evidence = _data.evidence;
    _welfareItem.welfareInfo = decodeURIComponent(_data.welfareInfo).replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&");
    _welfareItem.welfareTel = _data.officeUnitTel ? _data.officeUnitTel.indexOf("分機") >= 0 ? `${_data.officeUnitTel.replace("分機", ",")}%23` : _data.officeUnitTel : "";
    _welfareItem.welfareTelStr = _data.officeUnitTel;
    _welfareItem.releaseTime = _data.releaseTime;
    _welfareItem.updateTime = _data.updateTime;
    (_welfareItem.officeUnitInfo = _data.officeUnitInfo
      ? _data.officeUnitInfo
      : officeList.find((p) => p.id == _data.iFareOfficeUnitID)?.title),
      (_welfareItem.officeUnitID = _data.iFareOfficeUnitID);
    console.log(_welfareItem)
  });
});

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

const listNews = $WebApiGet("/FarePolicy/GetIFarePolicyRelation", {
  farePolicyID: _infoID,
});
listNews.then((res: any) => {
  const _data = res.result.result;
  let _newsList: Array<iFarePolicyItem> = _data.map((item: any, i: number) => {
    return {
      id: item.id,
      title: item.title,
      qualification: `${item.qualification.slice(0, 50)}...`,
      area: item.codeDomicile_LabelName,
      hasIndentity: item.codeIdentityList.findIndex((p:any) => p.id == 1) < 0,
      hasIncome: item.codeIncomeList.findIndex((p:any) => p.id == 1) < 0,
      hasRecipient: item.codeRecipientList.findIndex((p:any) => p.id == 1) < 0
    };
  });

  iFarePolicyList.push(..._newsList);
});

const _url = useRequestURL();
async function ShareWebUrlToLine() {
  const SHARETOLINE = "https://social-plugins.line.me/lineit/share";
  const urlShare = `${SHARETOLINE}?url=${encodeURIComponent(_url.href)}`;

  await navigateTo(urlShare, {
    external: true,
  });
}
</script>
