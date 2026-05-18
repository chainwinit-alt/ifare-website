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
              <input v-model="searchQuery" class="input-query" type="text" placeholder="請輸入關鍵字" />
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
            <button class="btn btn-filter" @click="Search" :disabled="!canSearch || isLoading">
              <span>搜尋</span>
              <i class="icon ic-search"></i>
            </button>
          </div>
          <div class="part-reset">
            <button class="btn btn-reset" :class="{ 'is-clearing': showResetFeedback }" @click="ResetParam">清空</button>
            <span class="reset-feedback" :class="{ 'is-visible': showResetFeedback }" aria-live="polite">已清空篩選條件</span>
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
              <button class="btn-filter" @click="Search" :disabled="!canSearch || isLoading">
                <span></span>
                <i class="icon ic-search"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="card-filter-reset">
          <button class="btn btn-reset" :class="{ 'is-clearing': showResetFeedback }" @click="ResetParam">清空</button>
          <span class="reset-feedback" :class="{ 'is-visible': showResetFeedback }" aria-live="polite">已清空篩選條件</span>
        </div>
      </section>
      <section class="section-result">
        <div class="part-list">
          <span class="result-total">{{ storageiFarePolicyList.length }}</span>
          <div class="compare-toolbar" v-if="compareCount > 0">
            <span>已收藏 {{ compareCount }} 個福利</span>
            <NuxtLink class="btn btn-filter compare-toolbar__link" to="/ifare/compare">
              <span>查看比較</span>
            </NuxtLink>
          </div>
          <div class="result-loading" v-if="isLoading">載入中...</div>
          <div class="result-loading result-error" v-else-if="hasError">
            <p>{{ errorMessage }}</p>
            <button class="btn btn-filter" type="button" @click="RetryLoad">重新載入</button>
          </div>
          <div class="result-loading result-empty" v-else-if="!isLoading && iFarePolicyList.length === 0" role="status">
            <div class="empty-illustration" aria-hidden="true">
              <i class="icon ic-search"></i>
            </div>
            <p class="empty-title">沒有找到符合條件的福利</p>
            <p class="empty-hint">{{ emptyHint }}</p>
            <ul v-if="emptyDiagnosis.length > 0" class="empty-diagnosis-list">
              <li v-for="item in emptyDiagnosis" :key="item">{{ item }}</li>
            </ul>
            <div class="empty-actions">
              <button class="btn btn-filter" type="button" @click="ScrollToFilter">
                <span>修改搜尋條件</span>
              </button>
              <button class="btn btn-reset" type="button" @click="ResetParam">
                <span>看全部福利</span>
              </button>
            </div>
          </div>
          <ul class="list-unstyled result-list" v-else>
            <li
              class="result-item transition-general"
              v-for="_item in iFarePolicyList"
              :key="_item.id"
            >
              <button
                class="compare-toggle"
                :class="{ 'is-saved': isPolicySaved(_item.id) }"
                type="button"
                :aria-pressed="isPolicySaved(_item.id)"
                @click.stop="ToggleCompare(_item)"
              >
                {{ isPolicySaved(_item.id) ? '已收藏' : '收藏比較' }}
              </button>
              <NuxtLink :to="{ path: '/ifare/info', query: { id: _item.id } }">
                <h4 class="result-title">{{ _item.title }}</h4>
                <span
                  v-if="_item.deadlineInfo"
                  class="deadline-badge"
                  :class="`deadline-badge--${_item.deadlineInfo.level}`"
                >{{ _item.deadlineInfo.label }}</span>
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
        <div class="part-pages" v-show="!isLoading">
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
const { $WebApiGet, $WebApiGetDetailed } = useNuxtApp();
const { getApiResultArray } = useApiResult();
const { getApiErrorMessage } = useApiErrorMessage();
const { getDeadlineInfo } = usePolicyDeadline();
const { loadWelfareProfile, saveWelfareProfile, clearWelfareProfile } = useWelfareProfile();
const { getLifeEventByKey } = useWelfareLifeEvents();
const { count: compareCount, isSaved: isPolicySaved, togglePolicy } = useWelfareCompare();
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

const ALL_POLICY_VALUE = "__all_policy";
const ALL_AREA_VALUE = "__all_area";

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
const isLoading = ref(false);
const hasError = ref(false);
const errorMessage = ref('載入福利政策時發生錯誤');
const showResetFeedback = ref(false);
const RESET_FEEDBACK_MS = 1800;
let resetFeedbackTimer: ReturnType<typeof setTimeout> | null = null;
let lastQuery: any = {};
const selectedLifeEvent = ref("");
const canSearch = computed(() => {
  return Boolean(
    codeSelect_policy.value ||
    codeSelectRecipient.value ||
    codeSelect_area.value ||
    searchQuery.value.trim()
  );
});

function getSelectValue(type: string, val: string) {
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
  let selectIncome = items.find((p:any) => p.type == 'Income')
  codeSelectIncome.value = selectIncome ? selectIncome.value : ""

  let selectIdentitys = items.filter((p:any) => p.type == 'Identity')
  if (selectIdentitys.length > 0) {
    codeSelectIdentity.value.splice(0)
    if (selectIdentitys.find((p:any) => p.value == 1)) return false
    codeSelectIdentity.value.push(...selectIdentitys.map((p:any) => { return p.value}))
  } else {
    codeSelectIdentity.value.splice(0)
  }
}

// Code Policy
const codePolicy = $WebApiGet("/Code/GetCodePolicyList");
codePolicy.then((res: any) => {
  const _data = getApiResultArray<any>(res);
  if (_data.length === 0) return;
let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: item.id,
    };
  });
  policySelectList.push({ name: "全部", val: ALL_POLICY_VALUE, isActive: false }, ..._list);
});

// Code area
const codeArea = $WebApiGet("/Code/GetCodeDomicileList");
codeArea.then((res: any) => {
  const _data = getApiResultArray<any>(res);
  if (_data.length === 0) return;
let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: item.id,
    };
  });
  areaSelectList.push({ name: "全國", val: ALL_AREA_VALUE, isActive: false }, ..._list);
});

// Code recipient
const codeRecipient = $WebApiGet("/Code/GetCodeRecipientList");
codeRecipient.then((res: any) => {
  const _data = getApiResultArray<any>(res);
  if (_data.length === 0) return;
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
  if (codeVal == "reset") {
    codeSelectRecipient.value = ""
    recipientSelectList.forEach((item) => {
      item.isActive = false
    })
    return
  }

  const selectedItem = recipientSelectList.find((item) => item.val == codeVal);
  if (selectedItem?.isActive) {
    selectedItem.isActive = false;
    codeSelectRecipient.value = "";
    return;
  }

  recipientSelectList.forEach((item, i) => {
    item.isActive = item.val == codeVal;
    if (item.isActive) {
      codeSelectRecipient.value = item.val;
    }
  });
}

// Code income
const codeIncome = $WebApiGet("/Code/GetCodeIncomeList");
codeIncome.then((res: any) => {
  const _data = getApiResultArray<any>(res);
  if (_data.length === 0) return;
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
  const _data = getApiResultArray<any>(res);
  if (_data.length === 0) return;
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
  if (codeSelect_policy.value && codeSelect_policy.value != ALL_POLICY_VALUE) query.CodePolicy = codeSelect_policy.value;
  if (codeSelectRecipient.value)
    query.CodeRecipient = codeSelectRecipient.value;
  if (codeSelect_area.value && codeSelect_area.value != ALL_AREA_VALUE) query.CodeDomicile = codeSelect_area.value;
  if (codeSelectIncome.value) query.CodeIncome = codeSelectIncome.value;
  if (searchQuery.value.trim()) query.Query = searchQuery.value.trim();
  if (codeSelectIdentity.value.length > 0)
    query.CodeIdentities = codeSelectIdentity.value;
  saveWelfareProfile({
    policy: codeSelect_policy.value,
    recipient: codeSelectRecipient.value,
    area: codeSelect_area.value,
    income: codeSelectIncome.value,
    identities: codeSelectIdentity.value.map((item: any) => String(item)),
    query: searchQuery.value.trim(),
    lifeEvent: selectedLifeEvent.value,
  });
  SetDataInit(query);
}

function ToggleCompare(item: iFarePolicyItem) {
  togglePolicy({
    id: item.id,
    title: item.title,
    area: item.area,
    qualification: item.qualification,
    discontinuedTime: item.discontinuedTime,
    hasIndentity: item.hasIndentity,
    hasIncome: item.hasIncome,
    hasRecipient: item.hasRecipient,
  });
}

function RetryLoad() {
  SetDataInit(lastQuery);
}

function ScrollToFilter() {
  if (typeof window === 'undefined') return
  const el = document.querySelector('.section-filter')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function clearResetFeedbackTimer() {
  if (!resetFeedbackTimer) {
    return;
  }

  clearTimeout(resetFeedbackTimer);
  resetFeedbackTimer = null;
}

function triggerResetFeedback() {
  clearResetFeedbackTimer();
  showResetFeedback.value = false;
  nextTick(() => {
    showResetFeedback.value = true;
    resetFeedbackTimer = setTimeout(() => {
      showResetFeedback.value = false;
    }, RESET_FEEDBACK_MS);
  });
}

// iFare Policy
const PAGEITEMMAX = 10;
const $route = useRoute();

// Init filter default value.
codeSelect_policy.value = typeof $route.query.policy == "string" ? $route.query.policy : ""
codeSelect_area.value = typeof $route.query.area == "string" ? $route.query.area : ""
codeSelectRecipient.value = typeof $route.query.recipient == "string" ? $route.query.recipient : ""
searchQuery.value = typeof $route.query.query == "string" ? $route.query.query : ""
selectedLifeEvent.value = typeof $route.query.event == "string" ? $route.query.event : ""

const _query: any = {};

if (Object.keys($route.query).length > 0) {
  if ($route.query.policy && $route.query.policy != ALL_POLICY_VALUE) _query.CodePolicy = $route.query.policy;
  if ($route.query.recipient) _query.CodeRecipient = $route.query.recipient;
  if ($route.query.area && $route.query.area != ALL_AREA_VALUE) _query.CodeDomicile = $route.query.area;
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
  discontinuedTime: string;
  deadlineInfo: any;
}

interface pageNum {
  num: number;
  isActive: boolean;
  isHide: boolean;
}

const iFarePolicyList = reactive<Array<iFarePolicyItem>>([]);
const storageiFarePolicyList = reactive<Array<iFarePolicyItem>>([]);
const pageNums = reactive<Array<pageNum>>([]);
const activeLifeEvent = computed(() => getLifeEventByKey(selectedLifeEvent.value));
const emptyHint = computed(() => {
  if (activeLifeEvent.value) {
    return `目前找不到與「${activeLifeEvent.value.name}」完全符合的福利，建議先放寬條件或調整關鍵字。`;
  }

  return '試試放寬篩選條件、調整關鍵字，或看看所有福利政策。';
});
const emptyDiagnosis = computed(() => {
  const hints: string[] = [];
  if (lastQuery.CodeDomicile) hints.push('戶籍地可能太精準，可先改成全國或清除地區。');
  if (lastQuery.CodeRecipient) hints.push('年齡區間可能不符合，可先清除年齡限制。');
  if (lastQuery.CodeIncome) hints.push('經濟條件可能限制結果，可先清除收入條件。');
  if (lastQuery.CodeIdentities?.length > 0) hints.push('特殊身分可能沒有對應方案，可先清除身分條件。');
  if (lastQuery.Query) hints.push('關鍵字可能太細，可改用較短詞，例如「補助」「照顧」「就學」。');
  return hints.slice(0, 4);
});

SetDataInit(_query);

function SetDataInit(_q: any) {
  lastQuery = { ..._q };
  isLoading.value = true;
  hasError.value = false;
  errorMessage.value = '載入福利政策時發生錯誤';
  const listNews = $WebApiGetDetailed("/FarePolicy/GetIFarePolicyList", _q);
  listNews.then(({ data, error }: any) => {
    storageiFarePolicyList.splice(0);
    iFarePolicyList.splice(0);
    pageNums.splice(0);

    const list = getApiResultArray<any>(data);
    if (error) {
      hasError.value = true;
      errorMessage.value = getApiErrorMessage(error, '載入福利政策時發生錯誤');
      return;
    }

    let _newsList: Array<iFarePolicyItem> = list.map(
      (item: any, i: number) => {
        return {
          id: item.id,
          title: item.title,
          qualification: item.qualification,
          area: item.codeDomicile_LabelName,
          hasIndentity: item.codeIdentityList.findIndex((p:any) => p.id == 1) < 0,
          hasIncome: item.codeIncomeList.findIndex((p:any) => p.id == 1) < 0,
          hasRecipient: item.codeRecipientList.findIndex((p:any) => p.id == 1) < 0,
          discontinuedTime: item.discontinuedTime,
          deadlineInfo: getDeadlineInfo(item.discontinuedTime),
        };
      }
    );

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
  }).catch((error: any) => {
    hasError.value = true;
    errorMessage.value = getApiErrorMessage(error, '載入福利政策時發生錯誤');
  }).finally(() => {
    isLoading.value = false;
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
  selectedLifeEvent.value = ""
  clearWelfareProfile()
  SetDataInit({})
  triggerResetFeedback()
}

onBeforeUnmount(() => {
  clearResetFeedbackTimer()
})

onMounted(() => {
  if (Object.keys($route.query).length > 0) return;

  const profile = loadWelfareProfile();
  if (!profile) return;

  codeSelect_policy.value = profile.policy || "";
  codeSelect_area.value = profile.area || "";
  codeSelectRecipient.value = profile.recipient || "";
  codeSelectIncome.value = profile.income || "";
  codeSelectIdentity.value.splice(0, codeSelectIdentity.value.length, ...(profile.identities ?? []));
  searchQuery.value = profile.query || "";
  selectedLifeEvent.value = profile.lifeEvent || "";

  const query: any = {};
  if (profile.policy && profile.policy != ALL_POLICY_VALUE) query.CodePolicy = profile.policy;
  if (profile.recipient) query.CodeRecipient = profile.recipient;
  if (profile.area && profile.area != ALL_AREA_VALUE) query.CodeDomicile = profile.area;
  if (profile.income) query.CodeIncome = profile.income;
  if (profile.query) query.Query = profile.query;
  if (profile.identities?.length) query.CodeIdentities = profile.identities;
  if (Object.keys(query).length > 0) SetDataInit(query);
})
</script>

<style scoped>
.compare-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 16px;
  padding: 12px 14px;
  border: 1px solid rgba(44, 80, 97, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  color: #1f3640;
  font-weight: 700;
}

.compare-toolbar__link {
  min-width: auto;
  padding: 0 16px;
}

.result-item {
  position: relative;
}

.compare-toggle {
  position: absolute;
  z-index: 2;
  top: 14px;
  right: 14px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(234, 85, 4, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #c84804;
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 700;
}

.compare-toggle.is-saved {
  border-color: rgba(35, 84, 71, 0.28);
  background: #eef6f4;
  color: #235447;
}

.compare-toggle:hover {
  transform: translateY(-1px);
}

.result-title {
  padding-right: 96px;
}

.deadline-badge {
  display: inline-flex;
  width: fit-content;
  margin: 8px 0 0;
  padding: 4px 8px;
  border-radius: 6px;
  background: #eef6f4;
  color: #235447;
  font-size: 0.82rem;
  font-weight: 700;
}

.deadline-badge--soon {
  background: #fff5df;
  color: #8a5700;
}

.deadline-badge--urgent {
  background: #ffe8e2;
  color: #9f2f13;
}

.empty-diagnosis-list {
  display: grid;
  gap: 8px;
  max-width: 560px;
  margin: 12px auto 0;
  padding: 0;
  color: #4d5b63;
  list-style: none;
  text-align: left;
}

.empty-diagnosis-list li {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
}

@media (max-width: 560px) {
  .compare-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .compare-toolbar__link {
    width: 100%;
  }

  .compare-toggle {
    position: static;
    margin: 0 0 10px 14px;
  }

  .result-title {
    padding-right: 0;
  }
}
</style>
