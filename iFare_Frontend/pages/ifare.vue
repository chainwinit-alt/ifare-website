<template>
  <div class="app-body" :name="$route.name">
    <div class="bg-sector-bottom"></div>
    <div class="part-bg">
      <div
        class="bg-ifare"
        :class="{
          'ic-ifare-bg':
            $route.name == 'ifare' || $route.name == 'ifare-result',
        }"
      ></div>
    </div>
    <div class="page-navs" v-show="$route.name != 'ifare'" :name="$route.name">
      <ul class="list-unstyled">
        <li v-for="_page in $route.matched">
          <NuxtLink :to="`${_page.meta.toLink}`">{{
            _page.meta.toLinkName
          }}</NuxtLink>
        </li>
      </ul>
      <h3 class="nav-title" v-show="$route.name == 'ifare-result'">搜尋結果</h3>
    </div>
    <div class="ifare-index section-list bg-section-list" v-if="$route.name == 'ifare'">
      <section class="section-top">
        <div class="title-comp">
          <h1 class="ifare-title">
            <span class="ic-ifare-logo">
              <!-- <i class="ic-title-pattern"></i> -->
              <!-- <i class="ic-i-mini-logo"></i> -->
            </span>
            <span class="mini-title">福利好幫手</span>
          </h1>
          <h3 class="ifare-subtitle">
            <span>找尋適合您的社會福利</span>
          </h3>
        </div>
        <div class="card-ifare-filter">
          <div class="item item-policy">
            <label class="filter-name">受助者情況</label>
            <CompSelect
              placeholder="選擇受助情境"
              select-title="受助情境"
              select-type="policy"
              :select-list="policySelectList"
              @update:select-value="getSelectValue"
              @is-opened="isSelectOpen"
            />
          </div>
          <div class="item item-recipient transition-general" :class="{'visible': isVisibleRecipient}">
            <label class="filter-name">受助者年齡區間</label>
            <div class="btn-tag-list">
              <span
                class="btn btn-tag transition-general"
                :class="{ active: _recipient.isActive }"
                @click="SwitchRecipient(_recipient.val)"
                :name="_recipient.name"
                v-for="_recipient in recipientSelectList"
                :key="_recipient.val"
                >{{ _recipient.name }}</span
              >
            </div>
          </div>
          <div class="item item-identity">
            <label class="filter-name">受助者戶籍地</label>
            <CompSelect
              placeholder="選擇受助者所在戶籍"
              select-title="戶籍地"
              select-type="area"
              :select-list="areaSelectList"
              @update:select-value="getSelectValue"
              @is-opened="isSelectOpen"
            />
          </div>
          <div class="item item-keyword">
            <label class="filter-name">關鍵字（選填）</label>
            <input
              type="text"
              class="input-keyword"
              placeholder="輸入關鍵字搜尋（如：補助、津貼、長者…）"
              v-model="keyword"
              maxlength="30"
              @keyup.enter="Search"
            />
          </div>
          <div class="item item-bottom">
            <p class="filter-hint" v-show="!hasAnyCondition">
              ＊未填條件將顯示最新福利，可單填任一項以縮小範圍
            </p>
            <button class="btn-filter transition-general" @click="Search">
              <span>搜尋</span>
              <i class="icon ic-search"></i>
            </button>
          </div>
        </div>
      </section>
      <section class="section-agency bg-section">
        <div class="bg-radial"></div>
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">相關福利機構</h3>
            <span class="comp-shadow">AGENCY</span>
          </div>
        </div>
        <div class="part-body">
          <div class="part-list">
            <ul class="list-unstyled agency-list">
              <li
                class="agency-item"
                v-for="_office in officeList"
                :key="_office.id"
              >
                <NuxtLink
                    :to="{ path: '/ifare/contact', query: { id: _office.id } }"
                    class="item-page-link"
                  >
                  <span class="agency-name">{{ _office.title }}</span>
                  <i class="ic-open link-url"
                  ></i>
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="part-pages">
            <!-- <CompPage :page-list="pageNums_office" @change-page="PageChange_Office"/> -->
            <CompPageNum :page-list="pageNums_office" @change-page="PageChange_Office"/>
          </div>
        </div>
      </section>
      <section class="section-faq bg-section">
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">常見福利問題</h3>
            <span class="comp-shadow">FAQ</span>
          </div>
        </div>
        <div class="part-body">
          <div class="part-faq">
            <ul class="list-unstyled faq-list">
              <li
                class="faq-item transition-general"
                :class="{ active: item.isActive }"
                @click="item.isActive = !item.isActive"
                v-for="(item, i) in qaList"
                :key="i"
              >
                <div class="faq-comp">
                  <h5 class="faq-title">
                    <i
                      class="faq-logo ic-faq transition-general"
                    ></i>
                    <span>{{ item.question }}</span>
                  </h5>
                  <i
                    class="open-switch transition-general"
                    :class="{
                      'ic-plus': !item.isActive,
                      'ic-dash-primary-dark': item.isActive,
                    }"
                  ></i>
                </div>
                <div class="faq-info transition-general">
                  <span class="info-content transition-general">{{ item.answer }}</span>
                </div>
              </li>
            </ul>
          </div>
          <div class="part-pages">
            <!-- <CompPage :page-list="pageNums_QA" @change-page="PageChange_QA"/> -->
            <CompPageNum :page-list="pageNums_QA" @change-page="PageChange_QA"/>
          </div>
        </div>
      </section>
    </div>
    <NuxtPage v-else />
  </div>
</template>

<script setup lang="ts">
const _isSelect = ref(false)
useHead({
  title: 'i-Fare',
  bodyAttrs: {
    class: {
      "overflow-disabled": _isSelect,
      "select-mode": _isSelect
    }
  }
})
definePageMeta({
  title: "ifare",
  toLinkName: "首頁",
  toLink: "/",
});
const { $WebApiGet } = useNuxtApp();
const $router = useRouter();
import CompSelect from "../components/CompSelect.vue";
import CompPage from "../components/CompPage.vue"
import CompPageNum from "../components/CompPageNum.vue";

interface selectItem {
  name: string;
  val: string;
  isActive: boolean;
}

function isSelectOpen(type: string, val: boolean) {
  // console.log(`[${type}] val => ${val} || type ${typeof val}`)
  _isSelect.value = val
  // useHead({
  //   bodyAttrs: {
  //     class: {
  //       "overflow-disabled": val,
  //       "select-mode": val
  //     }
  //   }
  // })
}

const policySelectList = reactive<Array<selectItem>>([]);
const codeSelect_policy = ref("");
const areaSelectList = reactive<Array<selectItem>>([]);
const codeSelect_area = ref("");
const recipientSelectList = reactive<Array<selectItem>>([]);
const codeSelectRecipient = ref("");
const isVisibleRecipient = ref(true)
const keyword = ref("");
const hasAnyCondition = computed(() =>
  codeSelect_policy.value !== ""
  || codeSelectRecipient.value !== ""
  || codeSelect_area.value !== ""
  || keyword.value.trim() !== ""
);

function getSelectValue(type: string, val: string) {
  // console.log(`[${type}] val => ${val}`)
  if (type == "policy") {
    codeSelect_policy.value = val;
    // isVisibleRecipient.value = true
  }

  if (type == "area") {
    codeSelect_area.value = val;
  }
}

// Code Policy
const codePolicy = $WebApiGet("/Code/GetCodePolicyList");
codePolicy.then((res: any) => {
  const _data = res.result.result;

  let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: item.id,
    };
  });

  policySelectList.push(..._list);
});

// Code area
const codeArea = $WebApiGet("/Code/GetCodeDomicileList");
codeArea.then((res: any) => {
  const _data = res.result.result;

  let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: item.id,
    };
  });

  areaSelectList.push(..._list);
});

// Code recipient
const codeRecipient = $WebApiGet("/Code/GetCodeRecipientList");
codeRecipient.then((res: any) => {
  const _data = res.result.result;

  let _list: Array<selectItem> = _data.slice(1).map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: item.id,
      isActive: false,
    };
  });

  recipientSelectList.push(..._list);
});

function SwitchRecipient(codeVal: any) {
  recipientSelectList.forEach((item, i) => {
    item.isActive = item.val == codeVal;
    if (item.isActive) {
      codeSelectRecipient.value = item.val;
    }
  });
}

function Search() {
  let query: any = {};
  if (codeSelect_policy.value) query.policy = codeSelect_policy.value;
  if (codeSelectRecipient.value) query.recipient = codeSelectRecipient.value;
  if (codeSelect_area.value) query.area = codeSelect_area.value;
  if (keyword.value.trim()) query.keyword = keyword.value.trim();
  $router.push({ path: "/ifare/result", query: query });
  // Init value.
  codeSelect_policy.value = ""
  codeSelectRecipient.value = ""
  recipientSelectList.forEach((item, i) => {
    item.isActive = false;
  });
  codeSelect_area.value = ""
  keyword.value = ""
}

// Office Unit
interface OfficeUnitItem {
  id: number;
  title: string;
}

interface pageNum {
  num: number;
  isActive: boolean;
  isHide: boolean;
}

const officeList = reactive<Array<OfficeUnitItem>>([]);
const storageOfficeList = reactive<Array<OfficeUnitItem>>([]);
const pageNums_office = reactive<Array<pageNum>>([]);
const PAGEITEMMAX_OFFICE = 6;

const listOffice = $WebApiGet("/FareOfficeUnit/GetIFareOfficeUnitList");
listOffice.then((res: any) => {
  const _data = res.result.result;

  let _newsList: Array<OfficeUnitItem> = _data
    .filter((p: any) => p.id != 1)
    .map((item: any, i: number) => {
      return {
        id: item.id,
        title: item.title,
      };
    });

  storageOfficeList.push(..._newsList);
  officeList.push(
    ..._newsList.slice(
      0,
      _newsList.length > PAGEITEMMAX_OFFICE
        ? PAGEITEMMAX_OFFICE
        : _newsList.length
    )
  );

  // Num page init.
  for (let n = 0; n <= officeList.length / PAGEITEMMAX_OFFICE; n++) {
    pageNums_office.push({
      num: n + 1,
      isActive: n == 0,
      isHide: false
    });
  }
});

function PageChange_Office(pageNum: number) {
  officeList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX_OFFICE;
  const index_E =
    pageNum <= storageOfficeList.length / PAGEITEMMAX_OFFICE
      ? pageNum * PAGEITEMMAX_OFFICE
      : storageOfficeList.length;

  let nextItems = storageOfficeList.slice(index_S, index_E);
  officeList.push(...nextItems);
}

function PageSwitch_Office(pageNum: number) {
  pageNums_office.forEach((_page, i) => {
    _page.isActive = _page.num == pageNum;
  });

  officeList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX_OFFICE;
  const index_E =
    pageNum <= storageOfficeList.length / PAGEITEMMAX_OFFICE
      ? pageNum * PAGEITEMMAX_OFFICE
      : storageOfficeList.length;

  let nextItems = storageOfficeList.slice(index_S, index_E);
  officeList.push(...nextItems);
}

// QA
interface QAItem {
  isActive: boolean;
  question: string;
  answer: string;
}

interface pageNum_QA {
  num: number;
  isActive: boolean;
  isHide: boolean;
}

const qaList = reactive<Array<QAItem>>([]);
const storageQAList = reactive<Array<QAItem>>([]);
const pageNums_QA = reactive<Array<pageNum_QA>>([]);
const PAGEITEMMAX_QA = 9;

const listNews = $WebApiGet("/FareQA/GetIFareQAList");
listNews.then((res: any) => {
  const _data = res.result.result;

  let _newsList: Array<QAItem> = _data
    .filter((p: any) => p.id != 1)
    .map((item: any, i: number) => {
      return {
        id: item.id,
        question: item.question,
        answer: item.answer,
        isActive: false,
      };
    });

  storageQAList.push(..._newsList);
  qaList.push(
    ..._newsList.slice(
      0,
      _newsList.length > PAGEITEMMAX_QA ? PAGEITEMMAX_QA : _newsList.length
    )
  );

  // Num page init.
  for (let n = 0; n <= storageQAList.length / PAGEITEMMAX_QA; n++) {
    pageNums_QA.push({
      num: n + 1,
      isActive: n == 0,
      isHide: false
    });
  }
});

function PageChange_QA(pageNum: number) {
  qaList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX_QA;
  const index_E =
    pageNum <= storageQAList.length / PAGEITEMMAX_QA
      ? pageNum * PAGEITEMMAX_QA
      : storageQAList.length;

  let nextItems = storageQAList.slice(index_S, index_E);
  qaList.push(...nextItems);
}

function PageSwitch_QA(pageNum: number) {
  pageNums_QA.forEach((_page, i) => {
    _page.isActive = _page.num == pageNum;
  });

  qaList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX_QA;
  const index_E =
    pageNum <= storageQAList.length / PAGEITEMMAX_QA
      ? pageNum * PAGEITEMMAX_QA
      : storageQAList.length;

  let nextItems = storageQAList.slice(index_S, index_E);
  qaList.push(...nextItems);
}

const currentPage_Office = ref(1);
const currentPage_QA = ref(1);

// function PageControl(target: string, controlType: string, currentPage: number) {
//   if (controlType == "next") {
//     if (target == "Office") {
//       if (currentPage >= storageOfficeList.length / PAGEITEMMAX_OFFICE) {
//         return false;
//       }

//       currentPage_Office.value += 1;
//     }

//     if (target == "QA") {
//       if (currentPage >= storageQAList.length / PAGEITEMMAX_QA) {
//         return false;
//       }

//       currentPage_QA.value += 1;
//     }
//   }

//   if (controlType == "prev") {
//     if (target == "Office") {
//       if (currentPage <= 1) {
//         return false;
//       }

//       currentPage_Office.value -= 1;
//     }

//     if (target == "QA") {
//       if (currentPage <= 1) {
//         return false;
//       }

//       currentPage_QA.value -= 1;
//     }
//   }

//   if (target == "Office") PageSwitch_Office(currentPage_Office.value);
//   if (target == "QA") PageSwitch_QA(currentPage_QA.value);
//   console.log(storageQAList.length)
// }
</script>
