<template>
  <div class="app-body-child" :name="$route.name">
    <div class="section-list">
      <section class="section-filter">
        <div class="card-filter">
          <div class="part-top">
            <div class="filter-group">
              <label class="filter-title">受助者情況</label>
              <CompSelect
                placeholder="選擇受助者情況"
                select-title="受助者情況"
                select-type="policy"
                :select-list="policySelectList"
                :select-default="codeSelect_policy"
                @update:select-value="getSelectValue"
              />
            </div>
            <div class="filter-group">
              <label class="filter-title">受助者年齡區間</label>
              <div class="btn-tag-list">
                <span
                  class="btn btn-tag transition-general"
                  :class="{ active: _recipient.isActive}"
                  :name="_recipient.name"
                  v-for="_recipient in recipientSelectList"
                  :key="_recipient.val"
                  @click="SwitchRecipient(_recipient.val)"
                  >{{ _recipient.name }}</span
                >
              </div>
            </div>
            <div class="filter-group">
              <label class="filter-title">受助者戶籍地</label>
              <CompSelect
                placeholder="選擇受助者戶籍地"
                select-title="受助者戶籍地"
                select-type="area"
                :select-list="areaSelectList"
                :select-default="codeSelect_area"
                @update:select-value="getSelectValue"
              />
            </div>
            <div class="filter-group">
              <label class="filter-title">關鍵字</label>
              <input v-model="searchQuery" class="input-query" type="text" placeholder="輸入繁中關鍵字" />
            </div>
          </div>
          <div class="part-bottom" v-show="isOpts">
            <div class="filter-group">
              <label class="filter-title">經濟條件</label>
              <div class="btn-tag-list">
                <span
                  class="btn btn-tag transition-general"
                  :class="{ active: _income.isActive }"
                  v-for="_income in incomeSelectList"
                  :key="_income.val"
                  @click="SwitchIncome(_income.val)"
                  >{{ _income.name }}</span
                >
              </div>
            </div>
            <div class="filter-group">
              <label class="filter-title" name="identity">特殊身分</label>
              <div class="btn-tag-list">
                <span
                  class="btn btn-tag transition-general"
                  :class="{ active: _identity.isActive }"
                  v-for="_identity in identitySelectList"
                  :key="_identity.val"
                  @click="SwitchIdentity(_identity.val)"
                  >{{ _identity.name }}</span
                >
              </div>
            </div>
          </div>
          <div class="part-filter">
            <button
              class="btn btn-advance"
              :class="{ active: isOpts }"
              @click="isOpts = !isOpts"
            >
              <i
                :class="{ 'ic-options': !isOpts, 'ic-arrow-simple-up': isOpts }"
              ></i>
              <span>篩選</span>
            </button>
            <button class="btn btn-filter" @click="Search" :disabled="!canSearch">
              <span>搜尋</span>
              <i class="icon ic-search"></i>
            </button>
          </div>
          <div class="part-reset">
            <button class="btn btn-reset" @click="ResetParam">清空</button>
          </div>
        </div>
        <div class="card-filter-mobile">
          <div class="part-filter-btns">
            <div class="part-start">
              <CompSelect
                placeholder="受助者情況"
                select-title="受助者情況"
                select-type="policy"
                :select-list="policySelectList"
                :select-default="codeSelect_policy"
                @is-opened="isSelectOpen"
                @update:select-value="getSelectValue"
              />
            <CompSelectRecipient 
                placeholder="受助者年齡區間"
                select-title="受助者年齡區間"
                select-type="recipient"
                :select-list="recipientSelectList"
                :select-default="codeSelectRecipient"
                @is-opened="isSelectOpen"
                @update:select-value="getSelectValue"
            />
            <CompSelect
                placeholder="受助者戶籍地"
                select-title="受助者戶籍地"
                select-type="area"
                :select-list="areaSelectList"
                :select-default="codeSelect_area"
                @is-opened="isSelectOpen"
                @update:select-value="getSelectValue"
              />
            </div>
            <div class="part-end">
              <CompSelectElse 
                select-title="篩選"
                select-type="else"
                :select-list-income="incomeSelectList"
                :select-list-identity="identitySelectList"
                @is-opened="isSelectOpen"
                @update:select-items="getSelectItems"
                />
              <button class="btn-filter" @click="Search" :disabled="!canSearch">
                <span></span>
                <i class="icon ic-search"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="card-filter-reset">
          <button class="btn btn-reset" @click="ResetParam">清空</button>
        </div>
      </section>
      <section class="section-result">
        <div class="part-list">
          <span class="result-total">{{ storageiFarePolicyList.length }}</span>
          <ul class="list-unstyled result-list">
            <li
              class="result-item transition-general"
              v-for="_item in iFarePolicyList"
              :key="_item.id"
            >
              <NuxtLink :to="{ path: '/ifare/info', query: { id: _item.id } }">
                <h4 class="result-title">{{ _item.title }}</h4>
                <div class="result-item-bottom">
                  <div class="result-filter">
                    <label class="result-filter-area">{{ _item.area }}</label>
                    <label class="result-filter-qualify">
                      <span :class="{ remark: _item.hasRecipient }">{{ _item.hasRecipient ? '有' : '無' }}</span>年齡限制、
                      <span :class="{ remark: _item.hasIncome }">{{ _item.hasIncome ? '有' : '無' }}</span>經濟限制、
                      <span :class="{ remark: _item.hasIndentity }">{{ _item.hasIndentity ? '有' : '無' }}</span>特殊身分
                    </label>
                  </div>
                  <i class="ic-arrow-right link-url transition-general"></i>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
        <div class="part-pages">
          <CompPage :page-list="pageNums" @change-page="PageChange"/>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const _isSelect = ref(false)
useHead({
    bodyAttrs: {
        class: {
          "overflow-disabled": _isSelect,
          "select-mode": _isSelect
        }
    }
})
definePageMeta({
  title: "ifare",
  toLinkName: "i-Fare",
  toLink: "/ifare",
});
const { $WebApiGet } = useNuxtApp();
import CompSelect from "../components/CompSelect.vue";
import CompSelectRecipient from "../components/CompSelectRecipient.vue";
import CompSelectElse from "~/components/CompSelectElse.vue";
import CompPage from "../components/CompPage.vue"

const isOpts = ref(false);

// interface selectItem {
//   name: string;
//   val: string;
// }

interface selectItem {
  name: string;
  val: string;
  isActive: boolean;
}

const policySelectList = reactive<Array<selectItem>>([]);
const codeSelect_policy:Ref<string> = ref("");
const areaSelectList = reactive<Array<selectItem>>([]);
const codeSelect_area:Ref<string> = ref("");
const searchQuery = ref("");
const recipientSelectList = reactive<Array<selectItem>>([]);
const codeSelectRecipient:Ref<string> = ref("");
const incomeSelectList = reactive<Array<selectItem>>([]);
const codeSelectIncome = ref("");
const identitySelectList = reactive<Array<selectItem>>([]);
const codeSelectIdentity: any = ref([]);
const canSearch = computed(() => {
  return Boolean(
    codeSelect_policy.value ||
    codeSelectRecipient.value ||
    codeSelect_area.value ||
    searchQuery.value.trim()
  );
});

function getSelectValue(type: string, val: string) {
  console.log(`[${type}] val => ${val}`)
  if (type == "policy") {
    codeSelect_policy.value = val;
  }

  if (type == "area") {
    codeSelect_area.value = val;
  }

  if (type == "recipient") {
    codeSelectRecipient.value = val
  }
}

function getSelectItems(type: string, items: any) {
  console.log('type:', type)
  console.log(items)

  let selectIncome = items.find((p:any) => p.type == 'Income')
  codeSelectIncome.value = selectIncome ? selectIncome.value : ""
  console.log(codeSelectIncome)

  let selectIdentitys = items.filter((p:any) => p.type == 'Identity')
  console.log(selectIdentitys)
  if (selectIdentitys.length > 0) {
    codeSelectIdentity.value.splice(0)
    if (selectIdentitys.find((p:any) => p.value == 1)) return false
    codeSelectIdentity.value.push(...selectIdentitys.map((p:any) => { return p.value}))
    // codeSelectIdentity.value.splice(0, selectIdentitys.length, ...selectIdentitys.map((p:any) => { return p.value}))
    console.log(codeSelectIdentity)
  } else {
    codeSelectIdentity.value.splice(0)
  }
}

// Code Policy
const codePolicy = $WebApiGet("/Code/GetCodePolicyList");
codePolicy.then((res: any) => {
  if (!res?.result?.result) return;
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
  if (!res?.result?.result) return;
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
  if (!res?.result?.result) return;
  const _data = res.result.result;
  let _list: Array<selectItem> = _data.slice(1).map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: item.id,
      isActive: false,
    };
  });
  recipientSelectList.push(..._list);
})
.then(() => {
  SwitchRecipient($route.query.recipient)
});

function SwitchRecipient(codeVal: any) {
  recipientSelectList.forEach((item, i) => {
    item.isActive = item.val == codeVal;
    if (item.isActive) {
      codeSelectRecipient.value = item.val;
    }
  });

  if (codeVal == "reset") {
    codeSelectRecipient.value = ""
    const _tempRecipient = JSON.parse(JSON.stringify(recipientSelectList))
    recipientSelectList.splice(0)
    recipientSelectList.push(..._tempRecipient)
  }
}

// Code income
const codeIncome = $WebApiGet("/Code/GetCodeIncomeList");
codeIncome.then((res: any) => {
  if (!res?.result?.result) return;
  const _data = res.result.result;
  let _list: Array<selectItem> = _data.slice(1).map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: item.id,
      isActive: false,
    };
  });
  incomeSelectList.push(..._list);
});

function SwitchIncome(codeVal: any) {
  incomeSelectList.forEach((item, i) => {
    // item.isActive = item.val == codeVal;
    if (item.val == codeVal) {
      if (item.isActive) {
        codeSelectIncome.value = "";
        item.isActive = false;
      } else {
        codeSelectIncome.value = item.val;
        item.isActive = true;
      }
    } else {
      item.isActive = false;
    }
  });

  if (codeVal == "reset") {
    codeSelectIncome.value = ""
  }
}

// Code identity
const codeIdentity = $WebApiGet("/Code/GetCodeIdentityList");
codeIdentity.then((res: any) => {
  if (!res?.result?.result) return;
  const _data = res.result.result;
  let _list: Array<selectItem> = _data.slice(1).map((item: any, i: number) => {
    return {
      name: item.codeName == '?券' ? '銝?' : item.codeName,
      val: item.id,
      isActive: false,
    };
  });
  identitySelectList.push(..._list);
});

function SwitchIdentity(codeVal: any) {
  console.log(codeVal)
  identitySelectList.forEach((item:any, i) => {
    if (item.val == codeVal) {
      if (item.isActive) {
        let codeIndex = codeSelectIdentity.value.findIndex(
          (p: any) => p == codeVal
        );
        codeSelectIdentity.value.splice(codeIndex, 1);
      } else {
        codeSelectIdentity.value.push(item.val);
      }

      item.isActive = !item.isActive;
    }
    if (codeVal == "reset" || codeVal == 1) {
      item.isActive = false;
    }
    if (codeVal == 1 && item.val == 1) {
      item.isActive = true
    }
    if (codeVal != 1 && item.val == 1 && item.isActive) {
      item.isActive = false
    }
  });

  if (codeVal == "reset") {
    codeSelectIdentity.value.splice(0)
  }
}

function Search() {
  if (!canSearch.value) return false;
  let query: any = {};
  if (codeSelect_policy.value) query.CodePolicy = codeSelect_policy.value;
  if (codeSelectRecipient.value)
    query.CodeRecipient = codeSelectRecipient.value;
  if (codeSelect_area.value) query.CodeDomicile = codeSelect_area.value;
  if (codeSelectIncome.value) query.CodeIncome = codeSelectIncome.value;
  if (searchQuery.value.trim()) query.Query = searchQuery.value.trim();
  if (codeSelectIdentity.value.length > 0)
    query.CodeIdentities = codeSelectIdentity.value;
  SetDataInit(query);
}

// iFare Policy
const PAGEITEMMAX = 10;
const $route = useRoute();

// Init filter default value.
codeSelect_policy.value = typeof $route.query.policy == "string" ? $route.query.policy : ""
codeSelect_area.value = typeof $route.query.area == "string" ? $route.query.area : ""
codeSelectRecipient.value = typeof $route.query.recipient == "string" ? $route.query.recipient : ""
searchQuery.value = typeof $route.query.query == "string" ? $route.query.query : ""

const _query: any = {};

if (Object.keys($route.query).length > 0) {
  if ($route.query.policy) _query.CodePolicy = $route.query.policy;
  if ($route.query.recipient) _query.CodeRecipient = $route.query.recipient;
  if ($route.query.area) _query.CodeDomicile = $route.query.area;
  if ($route.query.query) _query.Query = $route.query.query;
}

interface iFarePolicyItem {
  id: number;
  title: string;
  qualification: string;
  area: string;
  hasIndentity: boolean;
  hasIncome: boolean;
  hasRecipient: boolean;
}

interface pageNum {
  num: number;
  isActive: boolean;
  isHide: boolean;
}

const iFarePolicyList = reactive<Array<iFarePolicyItem>>([]);
const storageiFarePolicyList = reactive<Array<iFarePolicyItem>>([]);
const pageNums = reactive<Array<pageNum>>([]);

SetDataInit(_query);

function SetDataInit(_q: any) {
  const listNews = $WebApiGet("/FarePolicy/GetIFarePolicyList", _q);
  listNews.then((res: any) => {
    if (!res?.result?.result) return;
    const _data = res.result.result;
    let _newsList: Array<iFarePolicyItem> = _data.map(
      (item: any, i: number) => {
        return {
          id: item.id,
          title: item.title,
          qualification: `${item.qualification.slice(0, 50)}...`,
          area: item.codeDomicile_LabelName,
          hasIndentity: item.codeIdentityList.findIndex((p:any) => p.id == 1) < 0,
          hasIncome: item.codeIncomeList.findIndex((p:any) => p.id == 1) < 0,
          hasRecipient: item.codeRecipientList.findIndex((p:any) => p.id == 1) < 0
        };
      }
    );

    storageiFarePolicyList.splice(0);
    iFarePolicyList.splice(0);
    pageNums.splice(0);

    storageiFarePolicyList.push(..._newsList);
    iFarePolicyList.push(
      ..._newsList.slice(
        0,
        _newsList.length > PAGEITEMMAX ? PAGEITEMMAX : _newsList.length
      )
    );

    if (storageiFarePolicyList.length <= 0) return;

    // Num page init.
    for (let n = 0; n < storageiFarePolicyList.length / PAGEITEMMAX; n++) {
      pageNums.push({
        num: n + 1,
        isActive: n == 0,
        isHide: false
      });
    }
  });
}

function PageChange(pageNum: number) {
  iFarePolicyList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX;
  const index_E =
    pageNum <= storageiFarePolicyList.length / PAGEITEMMAX
      ? pageNum * PAGEITEMMAX
      : storageiFarePolicyList.length;

  let nextItems = storageiFarePolicyList.slice(index_S, index_E);
  iFarePolicyList.push(...nextItems);
}

function isSelectOpen(type: string, val: boolean) {
  // console.log(`[${type}] val => ${val} || type ${typeof val}`)
  _isSelect.value = val
  // useHead({
  //       bodyAttrs: {
  //           class: {
  //             "overflow-disabled": val,
  //             "select-mode": val
  //           }
  //       }
  //   })
}

function ResetParam() {
  console.log('ResetParam')
  codeSelect_area.value = ""
  const _tempArea = JSON.parse(JSON.stringify(areaSelectList))
  areaSelectList.splice(0)
  areaSelectList.push(..._tempArea)

  codeSelect_policy.value = ""
  const _tempPolicy = JSON.parse(JSON.stringify(policySelectList))
  policySelectList.splice(0)
  policySelectList.push(..._tempPolicy)

  searchQuery.value = ""

  SwitchRecipient("reset")
  SwitchIncome("reset")
  SwitchIdentity("reset")
}
</script>
