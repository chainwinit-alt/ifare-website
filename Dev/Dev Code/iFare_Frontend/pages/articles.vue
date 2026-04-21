<template>
  <div class="app-body" name="articles">
    <div class="bg-sector-top"></div>
    <div class="page-navs">
      <ul class="list-unstyled">
        <li v-for="_page in $route.matched">
          <NuxtLink :to="`${_page.meta.toLink}`">{{
            _page.meta.toLinkName
          }}</NuxtLink>
        </li>
      </ul>
    </div>
    <div class="section-list bg-section-list" v-if="$route.name == 'articles'">
      <section class="section section-welfare bg-section">
        <div class="bg-radial"></div>
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 id="articleWelfare" class="comp-title">福利專欄</h3>
            <span class="comp-shadow">ARTICLE</span>
          </div>
          <div class="part-filter">
            <CompSelect
              placeholder="選擇類別"
              select-title="類別"
              select-type="policy"
              :select-list="policySelectList"
              @update:select-value="setFilter"
              @is-opened="isSelectOpen"
            />
            <CompSelect
              placeholder="選擇關鍵字"
              select-title="關鍵字"
              select-type="keyword"
              :select-list="keywordSelectList"
              @update:select-value="setFilter"
              @is-opened="isSelectOpen"
            />
            <button class="btn-icon btn-search" @click="FilterWelfare">
              <i class="ic-search"></i>
            </button>
          </div>
        </div>
        <div class="part-body">
          <div class="part-articles">
            <ul class="list-unstyled article-list">
              <li
                class="article-item transition-general"
                v-for="_welfare in welfareList"
                :key="_welfare.id"
              >
                <NuxtLink
                  class="item-page-link"
                  :to="{
                    path: '/articles/welfare',
                    query: { id: _welfare.id },
                  }"
                >
                  <div class="item-top">
                    <span class="btn btn-tag active">{{
                      _welfare.codePolicy
                    }}</span>
                    <span class="item-date">{{ _welfare.releaseTime }}</span>
                  </div>
                  <div class="item-title">
                    <h2 class="article-title">{{ _welfare.title }}</h2>
                    <ul class="list-unstyled tags-list">
                      <li v-for="_keyword in _welfare.codeKeywords">
                        {{ _keyword.name }}
                      </li>
                    </ul>
                  </div>
                  <div class="item-body">
                    <div class="item-info">
                      {{ _welfare.content }}
                    </div>
                    <i class="ic-arrow-right link-url transition-general"></i>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="part-pages">
            <CompPage :page-list="pageNums_welfare" @change-page="PageChange_Welfare"/>
            
            <!-- <div class="page-component">
              <div class="page-content">
                <ul class="list-unstyled pages-list">
                  <li
                    :class="{ active: _page.isActive }"
                    v-for="_page in pageNums_welfare"
                    :key="_page.num"
                    @click="PageSwitch_Welfare(_page.num)"
                  >
                    {{ _page.num }}
                  </li>
                </ul>
              </div>
              <div class="page-control">
                <button
                  class="btn-icon btn-page-prev"
                  :class="{ disabled: currentPage_Welfare == 1 }"
                  @click="PageControl('welfare', 'prev', currentPage_Welfare)"
                >
                  <i class="ic-arrow-simple"></i>
                </button>
                <button
                  class="btn-icon btn-page-next"
                  :class="{
                    disabled:
                      currentPage_Welfare >
                      storage_welfareList.length / PAGEITEMMAX_WELFARE,
                  }"
                  @click="PageControl('welfare', 'next', currentPage_Welfare)"
                >
                  <i class="ic-arrow-simple"></i>
                </button>
              </div>
            </div> -->
          </div>
        </div>
      </section>
      <section class="section section-lazy bg-section">
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 id="articleDummies" class="comp-title">懶人包</h3>
            <span class="comp-shadow">FOR DUMMIES</span>
          </div>
          <div class="part-filter">
            <CompSelect
              placeholder="選擇關鍵字"
              select-title="關鍵字"
              select-type="keyword"
              :select-list="keywordSelectList"
              @update:select-value="FilterLazy"
              @is-opened="isSelectOpen"
            />
          </div>
        </div>
        <div class="part-body">
          <div class="part-articles">
            <ul class="list-unstyled article-list">
              <li
                class="article-item transition-general"
                v-for="_lazy in lazyList"
                :key="_lazy.id"
              >
                <NuxtLink
                  class="item-page-link"
                  :to="{ path: '/articles/lazy', query: { id: _lazy.id } }"
                >
                  <div class="item-info">
                    <i class="ic-box item-pattern"></i>
                    <div class="item-content">
                      <h5 class="item-title">{{ _lazy.title }}</h5>
                      <ul class="list-unstyled tags-list">
                        <li v-for="_keyword in _lazy.codeKeywords">
                          {{ _keyword.name }}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="item-link">
                    <i class="ic-arrow-right link-url transition-general"></i>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="part-pages">
            <CompPage :page-list="pageNums_lazy" @change-page="PageChange_Lazy"/>
            <!-- <ul class="list-unstyled pages-list">
              <li
                :class="{ active: _page.isActive }"
                v-for="_page in pageNums_lazy"
                :key="_page.num"
                @click="PageSwitch_Lazy(_page.num)"
              >
                {{ _page.num }}
              </li>
            </ul>
            <div class="page-control">
              <button
                class="btn-icon btn-page-prev"
                :class="{ disabled: currentPage_Lazy == 1 }"
                @click="PageControl('lazy', 'prev', currentPage_Lazy)"
              >
                <i class="ic-arrow-simple"></i>
              </button>
              <button
                class="btn-icon btn-page-next"
                :class="{
                  disabled:
                    currentPage_Lazy >
                    storage_lazyList.length / PAGEITEMMAX_LAZY,
                }"
                @click="PageControl('lazy', 'next', currentPage_Lazy)"
              >
                <i class="ic-arrow-simple"></i>
              </button>
            </div> -->
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
  title: '福利專欄',
  bodyAttrs: {
      class: {
        "overflow-disabled": _isSelect,
        "select-mode": _isSelect
      }
  }
})

definePageMeta({
  title: "福利專欄",
  toLinkName: "首頁",
  toLink: "/",
});
import CompSelect from "../components/CompSelect.vue";
import CompPage from "../components/CompPage.vue"
const { $WebApiGet } = useNuxtApp();
const PAGEITEMMAX_WELFARE = 4;
const PAGEITEMMAX_LAZY = 8;

interface selectItem {
  name: string;
  val: string;
}
interface welfareItem {
  id: number;
  title: string;
  releaseTime: string;
  content: string;
  codePolicy: string;
  codePolicy_ID: number;
  codeKeywords: Array<selectItem>;
}

interface lazyItem {
  id: number;
  title: string;
  codeKeywords: Array<selectItem>;
}

interface pageNum {
  num: number;
  isActive: boolean;
  isHide: boolean;
}

// definePageMeta({
//     test: "test"
// })

// Code Policy
const policySelectList = reactive<Array<selectItem>>([]);
const codePolicy = $WebApiGet("/Code/GetCodePolicyList");
codePolicy.then((res: any) => {
  const _data = res.result.result;
  let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      val: item.id,
      name: item.codeName,
    };
  });
  // Add all item (default).
  policySelectList.push({
    val: 'all',
    name: '全部'
  })
  policySelectList.push(..._list);
});

// Code Keywords
const keywordSelectList = reactive<Array<selectItem>>([]);
const codeKeyword = $WebApiGet("/Code/GetCodeKeywordList");
codeKeyword.then((res: any) => {
  const _data = res.result.result;
  let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      val: item.id,
      name: item.codeName,
    };
  });

  // Add all item (default).
  keywordSelectList.push({
    val: 'all',
    name: '全部'
  })
  keywordSelectList.push(..._list);
});

// welfare
const welfareList = reactive<Array<welfareItem>>([]);
const storage_welfareList = reactive<Array<welfareItem>>([]);
const storageAll_welfareList = reactive<Array<welfareItem>>([]);
const pageNums_welfare = reactive<Array<pageNum>>([]);
const GetListWelfare = $WebApiGet("/ArticlesWelfare/GetArticlesWelfareList");

GetListWelfare.then((res: any) => {
  const _data = res.result.result;
  let _list: Array<welfareItem> = _data.map((item: any, i: number) => {
    return {
      id: item.id,
      title: item.title,
      releaseTime: item.releaseTime,
      content: item.detail,
      codePolicy_ID: item.codePolicy_ID,
      codePolicy: item.codePolicy_LabelName,
      codeKeywords: item.codeKeywordList.map((_code: any, j: number) => {
        return { name: _code.codeName, val: _code.id };
      }),
    };
  });

  storage_welfareList.push(..._list);
  storageAll_welfareList.push(..._list);
  welfareList.push(
    ..._list.slice(
      0,
      _list.length > PAGEITEMMAX_WELFARE ? PAGEITEMMAX_WELFARE : _list.length
    )
  );

  // Num page init.
  for (let n = 0; n <= _list.length / PAGEITEMMAX_WELFARE; n++) {
    pageNums_welfare.push({
      num: n + 1,
      isActive: n == 0,
      isHide: false
    });
  }
});

function PageChange_Welfare(pageNum: number) {
  welfareList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX_WELFARE;
  const index_E =
    pageNum <= storage_welfareList.length / PAGEITEMMAX_WELFARE
      ? pageNum * PAGEITEMMAX_WELFARE
      : storage_welfareList.length;

  let nextItems = storage_welfareList.slice(index_S, index_E);
  welfareList.push(...nextItems);
}

// function PageSwitch_Welfare(pageNum: number) {
//   pageNums_welfare.forEach((_page, i) => {
//     _page.isActive = _page.num == pageNum;
//   });

//   welfareList.splice(0);

//   const index_S = (pageNum - 1) * PAGEITEMMAX_WELFARE;
//   const index_E =
//     pageNum <= storage_welfareList.length / PAGEITEMMAX_WELFARE
//       ? pageNum * PAGEITEMMAX_WELFARE
//       : storage_welfareList.length;

//   let nextItems = storage_welfareList.slice(index_S, index_E);
//   welfareList.push(...nextItems);
// }

const welfareFilter_Policy = ref();
const welfareFilter_Keyword = ref();
function setFilter(type: string, val: number) {
  // console.log(`[${type}] val => ${val} || type ${typeof val}`)
  if (type == "policy") welfareFilter_Policy.value = val;
  if (type == "keyword") welfareFilter_Keyword.value = val;
}

function isSelectOpen(type: string, val: boolean) {
  // console.log(`[${type}] val => ${val} || type ${typeof val}`)
  // useHead({
  //       bodyAttrs: {
  //           class: {
  //             "overflow-disabled": val,
  //             "select-mode": val
  //           }
  //       }
  //   })
  _isSelect.value = val
}

function FilterWelfare() {
  pageNums_welfare.splice(0);
  storage_welfareList.splice(0);
  welfareList.splice(0);

  let _list: Array<welfareItem> = [];
  if (welfareFilter_Policy.value && welfareFilter_Keyword.value) {
    _list = storageAll_welfareList.filter(
      (p) =>
        (p.codePolicy_ID == welfareFilter_Policy.value || welfareFilter_Policy.value == 'all') &&
        (p.codeKeywords.map((p2) => p2.val).includes(welfareFilter_Keyword.value) || welfareFilter_Keyword.value == 'all')
    );
  } else {
    if (welfareFilter_Policy.value)
      _list = storageAll_welfareList.filter(
        (p) => p.codePolicy_ID == welfareFilter_Policy.value || welfareFilter_Policy.value == 'all'
      );
    if (welfareFilter_Keyword.value)
      _list = storageAll_welfareList.filter((p) =>
        p.codeKeywords.map((p2) => p2.val).includes(welfareFilter_Keyword.value) || welfareFilter_Keyword.value == 'all'
      );
  }

  storage_welfareList.push(..._list);
  welfareList.push(
    ..._list.slice(
      0,
      _list.length > PAGEITEMMAX_WELFARE ? PAGEITEMMAX_WELFARE : _list.length
    )
  );

  if (welfareList.length <= 0) return false;
  // Num page init.
  for (let n = 0; n <= storage_welfareList.length / PAGEITEMMAX_WELFARE; n++) {
    pageNums_welfare.push({
      num: n + 1,
      isActive: n == 0,
      isHide: false
    });
  }
}

// lazy
const lazyList = reactive<Array<lazyItem>>([]);
const storage_lazyList = reactive<Array<lazyItem>>([]);
const storageAll_lazy = reactive<Array<lazyItem>>([]);
const pageNums_lazy = reactive<Array<pageNum>>([]);
const listLazy = $WebApiGet("/ArticlesLazy/GetArticlesLazyList");

listLazy.then((res: any) => {
  const _data = res.result.result;
  let _list: Array<lazyItem> = _data.map((item: any, i: number) => {
    return {
      id: item.id,
      title: item.title,
      codeKeywords: item.codeKeywordList.map((_code: any, j: number) => {
        return { name: _code.codeName, val: _code.id };
      }),
    };
  });

  storage_lazyList.push(..._list);
  storageAll_lazy.push(..._list);
  lazyList.push(
    ..._list.slice(
      0,
      _list.length > PAGEITEMMAX_LAZY ? PAGEITEMMAX_LAZY : _list.length
    )
  );

  // Num page init.
  for (let n = 0; n <= _list.length / PAGEITEMMAX_LAZY; n++) {
    pageNums_lazy.push({
      num: n + 1,
      isActive: n == 0,
      isHide: false
    });
  }
});

function PageChange_Lazy(pageNum: number) {
  lazyList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX_LAZY;
  const index_E =
    pageNum <= storage_lazyList.length / PAGEITEMMAX_LAZY
      ? pageNum * PAGEITEMMAX_LAZY
      : storage_lazyList.length;

  let nextItems = storage_lazyList.slice(index_S, index_E);
  lazyList.push(...nextItems);
}

// function PageSwitch_Lazy(pageNum: number) {
//   pageNums_lazy.forEach((_page, i) => {
//     _page.isActive = _page.num == pageNum;
//   });

//   lazyList.splice(0);

//   const index_S = (pageNum - 1) * PAGEITEMMAX_LAZY;
//   const index_E =
//     pageNum <= storage_lazyList.length / PAGEITEMMAX_LAZY
//       ? pageNum * PAGEITEMMAX_LAZY
//       : storage_lazyList.length;

//   let nextItems = storage_lazyList.slice(index_S, index_E);
//   lazyList.push(...nextItems);
// }

function FilterLazy(type: string, val: string) {
  storage_lazyList.splice(0);
  lazyList.splice(0);
  pageNums_lazy.splice(0);

  storage_lazyList.push(
    ...storageAll_lazy.filter((p) =>
      p.codeKeywords.map((p2) => { return p2.val;}).includes(val) || val == 'all'
    )
  );
  lazyList.push(
    ...storage_lazyList.slice(
      0,
      storage_lazyList.length > PAGEITEMMAX_LAZY
        ? PAGEITEMMAX_LAZY
        : storage_lazyList.length
    )
  );

  if (lazyList.length <= 0) return false;
  // Num page init.
  for (let n = 0; n <= storage_lazyList.length / PAGEITEMMAX_LAZY; n++) {
    pageNums_lazy.push({
      num: n + 1,
      isActive: n == 0,
      isHide: false
    });
  }
}

const currentPage_Lazy = ref(1);
const currentPage_Welfare = ref(1);

// function PageControl(target: string, controlType: string, currentPage: number) {
//   if (controlType == "next") {
//     if (target == "welfare") {
//       if (currentPage >= storage_welfareList.length / PAGEITEMMAX_WELFARE) {
//         return false;
//       }

//       currentPage_Welfare.value += 1;
//     }

//     if (target == "lazy") {
//       if (currentPage >= storage_lazyList.length / PAGEITEMMAX_LAZY) {
//         return false;
//       }

//       currentPage_Lazy.value += 1;
//     }
//   }

//   if (controlType == "prev") {
//     if (target == "welfare") {
//       if (currentPage <= 1) {
//         return false;
//       }

//       currentPage_Welfare.value -= 1;
//     }

//     if (target == "lazy") {
//       if (currentPage <= 1) {
//         return false;
//       }

//       currentPage_Lazy.value -= 1;
//     }
//   }

//   // if (target == "welfare") PageSwitch_Welfare(currentPage_Welfare.value);
//   // if (target == "lazy") PageSwitch_Lazy(currentPage_Lazy.value);
// }
</script>
