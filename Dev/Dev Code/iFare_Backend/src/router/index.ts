/**
 * router/index.ts
 * iFare 後台管理系統路由設定
 *
 * 採用 Vue Router 的巢狀路由結構，各功能模組皆有 Index（父）/ DataList / Add / Edit / Detail 子路由。
 * 路由 meta 說明：
 *   - requiresAuth：是否需要登入才能存取（true = 需登入）
 *   - indexKey：對應側邊欄選單的高亮識別鍵
 *   - title：頁面標題（顯示於 document.title）
 *   - title_parent / urlName_parent：麵包屑導航所需的上層標題與路由名稱
 *   - isTitleHide：詳細檢視頁面是否隱藏頁面標題列
 */

//#region 基礎引入
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import Analysis_DashboardViewVue from '@/views/Analysis/Analysis_DashboardView.vue'
import NoPermission from '@/views/NoPermission.vue'
//#endregion

// 2026-05-26 #6 — 擴展 RouteMeta，把權限與提示 tip 變成型別安全的欄位
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    /** 路由標題（顯示於 main-header） */
    title?: string
    /** 麵包屑用：父層標題 / route name */
    title_parent?: string
    urlName_parent?: string
    /** 詳細頁可隱藏 main-header title */
    isTitleHide?: boolean
    /** AsideMenu 高亮對應的鍵 */
    indexKey?: string
    /** PageTip 顯示的一句話操作提示 */
    tip?: string
    /** 「檢視者」是否允許進入此路由（不設預設不允許） */
    viewerCanAccess?: boolean
    /** 是否限「管理者」才能進入（不設預設編輯者 + 管理者皆可） */
    requiresAdmin?: boolean
  }
}

//#region [View.vue] 最新消息
import News_IndexViewVue from '@/views/News/News_IndexView.vue'
import News_DataListViewVue from '@/views/News/News_DataListView.vue'
import News_AddEditViewVue from '@/views/News/News_AddEditView.vue'
import News_ItemDetailViewVue from '@/views/News/News_ItemDetailView.vue'
//#endregion

//#region [View.vue] 福利文章
import ArticlesWelfare_IndexViewVue from '@/views/Articles/Welfare/ArticlesWelfare_IndexView.vue'
import ArticlesWelfare_DataListViewVue from '@/views/Articles/Welfare/ArticlesWelfare_DataListView.vue'
import ArticlesWelfare_AddEditViewVue from '@/views/Articles/Welfare/ArticlesWelfare_AddEditView.vue'
import ArticlesWelfare_ItemDetailViewVue from '@/views/Articles/Welfare/ArticlesWelfare_ItemDetailView.vue'
//#endregion

//#region [View.vue] 懶人包文章
import ArticlesLazy_IndexViewVue from '@/views/Articles/Lazy/ArticlesLazy_IndexView.vue'
import ArticlesLazy_DataListViewVue from '@/views/Articles/Lazy/ArticlesLazy_DataListView.vue'
import ArticlesLazy_AddEditViewVue from '@/views/Articles/Lazy/ArticlesLazy_AddEditView.vue'
import ArticlesLazy_ItemDetailViewVue from '@/views/Articles/Lazy/ArticlesLazy_ItemDetailView.vue'
//#endregion

//#region [View.vue] iFare 福利政策
import IFarePolicy_IndexViewVue from '@/views/IFare/Policy/IFarePolicy_IndexView.vue'
import IFarePolicy_DataListViewVue from '@/views/IFare/Policy/IFarePolicy_DataListView.vue'
import IFarePolicy_AddEditViewVue from '@/views/IFare/Policy/IFarePolicy_AddEditView.vue'
import IFarePolicy_ItemDetailViewVue from '@/views/IFare/Policy/IFarePolicy_ItemDetailView.vue'
//#endregion

//#region [View.vue] iFare 常見問題
import IFareQA_IndexViewVue from '@/views/IFare/QA/IFareQA_IndexView.vue'
import IFareQA_DataListViewVue from '@/views/IFare/QA/IFareQA_DataListView.vue'
import IFareQA_AddEditViewVue from '@/views/IFare/QA/IFareQA_AddEditView.vue'
import IFareQA_ItemDetailViewVue from '@/views/IFare/QA/IFareQA_ItemDetailView.vue'
//#endregion

//#region [View.vue] iFare 洽辦單位
import IFareOfficeUnit_IndexViewVue from '@/views/IFare/OfficeUnit/IFareOfficeUnit_IndexView.vue'
import IFareOfficeUnit_DataListViewVue from '@/views/IFare/OfficeUnit/IFareOfficeUnit_DataListView.vue'
import IFareOfficeUnit_AddEditViewVue from '@/views/IFare/OfficeUnit/IFareOfficeUnit_AddEditView.vue'
import IFareOfficeUnit_ItemDetailViewVue from '@/views/IFare/OfficeUnit/IFareOfficeUnit_ItemDetailView.vue'
//#endregion

//#region [View.vue] 公益夥伴
import Collaborator_IndexViewVue from '@/views/Collaborator/Collaborator_IndexView.vue'
import Collaborator_DataListViewVue from '@/views/Collaborator/Collaborator_DataListView.vue'
import Collaborator_AddEditViewVue from '@/views/Collaborator/Collaborator_AddEditView.vue'
import Collaborator_ItemDetailViewVue from '@/views/Collaborator/Collaborator_ItemDetailView.vue'
//#endregion

//#region [View.vue] 代碼維護 - 政策類別
import CodePolicy_IndexViewVue from '@/views/Code/Policy/CodePolicy_IndexView.vue'
import CodePolicy_DataListViewVue from '@/views/Code/Policy/CodePolicy_DataListView.vue'
import CodePolicy_AddEditViewVue from '@/views/Code/Policy/CodePolicy_AddEditView.vue'
//#endregion

//#region [View.vue] 代碼維護 - 受助者
import CodeRecipient_IndexViewVue from '@/views/Code/Recipient/CodeRecipient_IndexView.vue'
import CodeRecipient_DataListViewVue from '@/views/Code/Recipient/CodeRecipient_DataListView.vue'
import CodeRecipient_AddEditViewVue from '@/views/Code/Recipient/CodeRecipient_AddEditView.vue'
//#endregion

//#region [View.vue] 代碼維護 - 關鍵字
import CodeKeyword_IndexViewVue from '@/views/Code/Keyword/CodeKeyword_IndexView.vue'
import CodeKeyword_DataListViewVue from '@/views/Code/Keyword/CodeKeyword_DataListView.vue'
import CodeKeyword_AddEditViewVue from '@/views/Code/Keyword/CodeKeyword_AddEditView.vue'
//#endregion

//#region [View.vue] 代碼維護 - 經濟條件
import CodeIncome_IndexViewVue from '@/views/Code/Income/CodeIncome_IndexView.vue'
import CodeIncome_DataListViewVue from '@/views/Code/Income/CodeIncome_DataListView.vue'
import CodeIncome_AddEditViewVue from '@/views/Code/Income/CodeIncome_AddEditView.vue'
//#endregion

//#region [View.vue] 代碼維護 - 特殊身分
import CodeIdentity_IndexViewVue from '@/views/Code/Identity/CodeIdentity_IndexView.vue'
import CodeIdentity_DataListViewVue from '@/views/Code/Identity/CodeIdentity_DataListView.vue'
import CodeIdentity_AddEditViewVue from '@/views/Code/Identity/CodeIdentity_AddEditView.vue'
//#endregion

//#region [View.vue] 代碼維護 - 戶籍地
import CodeDomicile_IndexViewVue from '@/views/Code/Domicile/CodeDomicile_IndexView.vue'
import CodeDomicile_DataListViewVue from '@/views/Code/Domicile/CodeDomicile_DataListView.vue'
import CodeDomicile_AddEditViewVue from '@/views/Code/Domicile/CodeDomicile_AddEditView.vue'
//#endregion

//#region [View.vue] 帳戶管理
import Account_IndexViewVue from '@/views/Account/Account_IndexView.vue'
import Account_DataListViewVue from '@/views/Account/Account_DataListView.vue'
import Account_AddEditViewVue from '@/views/Account/Account_AddEditView.vue'
import Account_ItemDetailViewVue from '@/views/Account/Account_ItemDetailView.vue'
//#endregion

//#region [View.vue] 個人資料
import Personal_IndexViewVue from '@/views/Personal/Personal_IndexView.vue'
import Personal_DetailViewVue from '@/views/Personal/Personal_DetailView.vue'
import Personal_EditViewVue from '@/views/Personal/Personal_EditView.vue'
import Personal_ChangePwdViewVue from '@/views/Personal/Personal_ChangePwdView.vue'
//#endregion

//#region [View.vue] 圖片管理
import ImgManager_DataListView from '@/views/ImgManager/ImgManager_DataListView.vue'
//#endregion

//#region [View.vue] 動態頁面管理 (CMS) — 後臺優化 #X
import PageManagement_IndexViewVue from '@/views/PageManagement/PageManagement_IndexView.vue'
import PageManagement_DataListViewVue from '@/views/PageManagement/PageManagement_DataListView.vue'
import PageManagement_AddEditViewVue from '@/views/PageManagement/PageManagement_AddEditView.vue'
//#endregion

//#region [View.vue] 部署健康檢查 — 後臺優化 #87
import HealthCheckView from '@/views/Health/HealthCheckView.vue'
//#endregion

//#region [View.vue] 部署 Smoke Test 清單 — 後臺優化 #88
import SmokeTestView from '@/views/Health/SmokeTestView.vue'
//#endregion

// 輸出基礎路徑（開發除錯用）

// 建立路由實例，使用 HTML5 History 模式（無 # 號的 URL）
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      //#region 首頁
      path: '/',
      name: 'Home',
      component: HomeView,
      meta: {
        indexKey: 'Home',
        requiresAuth: true,
        title: '首頁',
        tip: '左側選單或下方快速入口可進入各模組。常用模組會自動記在「最近使用」。',
        viewerCanAccess: true
      }
      //#endregion
    },
    {
      //#region 登入頁
      path: '/Login',
      name: 'Login',
      component: LoginView,
      meta: {
        indexKey: 'Login',
        requiresAuth: false, // 登入頁不需驗證
        title: 'Login'
      }
      //#endregion
    },
    {
      //#region 最新消息管理
      path: '/News',
      name: 'News_Index',
      component: News_IndexViewVue,
      meta: {
        indexKey: 'News',
        requiresAuth: true,
        title_parent: '最新消息維護',
        urlName_parent: 'News_DataList'
      },
      children: [
        {
          path: '',
          name: 'News_DataList',
          component: News_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '最新消息維護',
            tip: '先用搜尋條件縮小範圍再點列表。資料狀態設為「停用」前台會立即隱藏。'
          }
        },
        {
          path: 'Add',
          name: 'News_Add',
          component: News_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增最新消息',
            tip: '填完必填欄位按右上「儲存」即建立。上下架日期到期會自動切換。'
          }
        },
        {
          path: 'Edit',
          name: 'News_Edit',
          component: News_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯最新消息',
            tip: '修改後按「儲存」才會更新前台顯示。建立日期不會改變。'
          }
        },
        {
          path: 'Detail',
          name: 'News_Detail',
          component: News_ItemDetailViewVue,
          meta: {
            requiresAuth: true,
            title: '最新消息瀏覽',
            isTitleHide: true // 詳細頁隱藏頁面標題列
          }
        }
      ]
      //#endregion
    },
    {
      //#region 福利文章管理
      path: '/Articles-Welfare',
      name: 'Articles_Welfare_Index',
      component: ArticlesWelfare_IndexViewVue,
      meta: {
        indexKey: 'Articles_Welfare',
        requiresAuth: true,
        title_parent: '福利文章維護',
        urlName_parent: 'Articles_Welfare_DataList'
      },
      children: [
        {
          path: '',
          name: 'Articles_Welfare_DataList',
          component: ArticlesWelfare_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '福利文章維護',
            tip: '可依政策類別、關鍵字篩選。文章「啟用」且在上下架期間才會出現在前台。',
            viewerCanAccess: true
          }
        },
        {
          path: 'Add',
          name: 'Articles_Welfare_Add',
          component: ArticlesWelfare_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增福利文章',
            tip: '先選政策類別與關鍵字會影響前台分類。建議封面圖比例 16:9。'
          }
        },
        {
          path: 'Edit',
          name: 'Articles_Welfare_Edit',
          component: ArticlesWelfare_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯福利文章',
            tip: '修改後按「儲存」。若要先預覽，可把上架日期暫設今天再觀察前台。'
          }
        },
        {
          path: 'Detail',
          name: 'Articles_Welfare_Detail',
          component: ArticlesWelfare_ItemDetailViewVue,
          meta: {
            requiresAuth: true,
            title: '福利文章瀏覽',
            viewerCanAccess: true,
            isTitleHide: true
          }
        }
      ]
      //#endregion
    },
    {
      //#region 懶人包文章管理
      path: '/Articles-Lazy',
      name: 'Articles_Lazy_Index',
      component: ArticlesLazy_IndexViewVue,
      meta: {
        indexKey: 'Articles_Lazy',
        requiresAuth: true,
        title_parent: '懶人包維護',
        urlName_parent: 'Articles_Lazy_DataList'
      },
      children: [
        {
          path: '',
          name: 'Articles_Lazy_DataList',
          component: ArticlesLazy_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '懶人包維護',
            tip: '懶人包以多張圖片組成，可依政策類別與關鍵字篩選。',
            viewerCanAccess: true
          }
        },
        {
          path: 'Add',
          name: 'Articles_Lazy_Add',
          component: ArticlesLazy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增懶人包',
            tip: '圖片依上傳順序在前台呈現。建議單張寬 1200px 以上、檔案 < 500KB。'
          }
        },
        {
          path: 'Edit',
          name: 'Articles_Lazy_Edit',
          component: ArticlesLazy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯懶人包',
            tip: '修改後按「儲存」才會更新。可重排圖片順序。'
          }
        },
        {
          path: 'Detail',
          name: 'Articles_Lazy_Detail',
          component: ArticlesLazy_ItemDetailViewVue,
          meta: {
            requiresAuth: true,
            title: '懶人包瀏覽',
            viewerCanAccess: true,
            isTitleHide: true
          }
        }
      ]
      //#endregion
    },
    {
      //#region iFare 福利政策管理
      path: '/IFare-Policy',
      name: 'IFare_Policy_Index',
      component: IFarePolicy_IndexViewVue,
      meta: {
        indexKey: 'IFare_Policy',
        requiresAuth: true,
        title_parent: '福利政策維護',
        urlName_parent: 'IFare_Policy_DataList'
      },
      children: [
        {
          path: '',
          name: 'IFare_Policy_DataList',
          component: IFarePolicy_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '福利政策維護',
            tip: '政策筆數較多，建議用條件先縮小範圍。下架日期過期會自動從前台隱藏。',
            viewerCanAccess: true
          }
        },
        {
          path: 'Add',
          name: 'IFare_Policy_Add',
          component: IFarePolicy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增福利政策',
            tip: '欄位較多，建議依序填基本資料、適用條件、福利內容、洽辦資訊。'
          }
        },
        {
          path: 'Edit',
          name: 'IFare_Policy_Edit',
          component: IFarePolicy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯福利政策',
            tip: '修改後按「儲存」。請特別檢查上架/下架日期與洽辦單位是否正確。'
          }
        },
        {
          path: 'Detail',
          name: 'IFare_Policy_Detail',
          component: IFarePolicy_ItemDetailViewVue,
          meta: {
            requiresAuth: true,
            title: '福利政策瀏覽',
            viewerCanAccess: true,
            isTitleHide: true
          }
        }
      ]
      //#endregion
    },
    {
      //#region iFare 常見問題管理
      path: '/IFare-QA',
      name: 'IFare_QA_Index',
      component: IFareQA_IndexViewVue,
      meta: {
        indexKey: 'IFare_QA',
        requiresAuth: true,
        title_parent: '常見問題維護',
        urlName_parent: 'IFare_QA_DataList'
      },
      children: [
        {
          path: '',
          name: 'IFare_QA_DataList',
          component: IFareQA_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '常見問題維護',
            tip: 'QA 會顯示在 i-Fare 首頁與政策詳情。問題與答案建議使用白話。'
          }
        },
        {
          path: 'Add',
          name: 'IFare_QA_Add',
          component: IFareQA_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增常見問題',
            tip: '答案內容會直接顯示給民眾，請避免使用內部術語。'
          }
        },
        {
          path: 'Edit',
          name: 'IFare_QA_Edit',
          component: IFareQA_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯常見問題',
            tip: '修改後按「儲存」即更新前台。'
          }
        },
        {
          path: 'Detail',
          name: 'IFare_QA_Detail',
          component: IFareQA_ItemDetailViewVue,
          meta: {
            requiresAuth: true,
            title: '常見問題瀏覽',
            isTitleHide: true
          }
        }
      ]
      //#endregion
    },
    {
      //#region iFare 洽辦單位管理
      path: '/IFare-OfficeUnit',
      name: 'IFare_OfficeUnit_Index',
      component: IFareOfficeUnit_IndexViewVue,
      meta: {
        indexKey: 'IFare_OfficeUnit',
        requiresAuth: true,
        title_parent: '洽辦單位維護',
        urlName_parent: 'IFare_OfficeUnit_DataList'
      },
      children: [
        {
          path: '',
          name: 'IFare_OfficeUnit_DataList',
          component: IFareOfficeUnit_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '洽辦單位維護',
            tip: '洽辦單位會被多筆政策引用，編輯前請確認影響範圍。'
          }
        },
        {
          path: 'Add',
          name: 'IFare_OfficeUnit_Add',
          component: IFareOfficeUnit_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增洽辦單位',
            tip: '一個單位可有多個分支地址與電話，依需求新增。'
          }
        },
        {
          path: 'Edit',
          name: 'IFare_OfficeUnit_Edit',
          component: IFareOfficeUnit_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯洽辦單位',
            tip: '修改地址或電話後，所有引用此單位的政策都會同步更新。'
          }
        },
        {
          path: 'Detail',
          name: 'IFare_OfficeUnit_Detail',
          component: IFareOfficeUnit_ItemDetailViewVue,
          meta: {
            requiresAuth: true,
            title: '洽辦單位瀏覽',
            isTitleHide: true
          }
        }
      ]
      //#endregion
    },
    {
      //#region 公益夥伴管理
      path: '/Collaborator',
      name: 'Collaborator_Index',
      component: Collaborator_IndexViewVue,
      meta: {
        indexKey: 'Collaborator',
        requiresAuth: true,
        title_parent: '公益夥伴維護',
        urlName_parent: 'Collaborator_DataList'
      },
      children: [
        {
          path: '',
          name: 'Collaborator_DataList',
          component: Collaborator_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '公益夥伴維護',
            tip: '夥伴顯示順序依「啟用」狀態與建立時間排序。'
          }
        },
        {
          path: 'Add',
          name: 'Collaborator_Add',
          component: Collaborator_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增公益夥伴',
            tip: 'Logo 建議 PNG 透明背景、檔案 < 500KB。連結填夥伴官網。'
          }
        },
        {
          path: 'Edit',
          name: 'Collaborator_Edit',
          component: Collaborator_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯公益夥伴',
            tip: '修改後按「儲存」。Logo 替換後前台立即更新。'
          }
        },
        {
          path: 'Detail',
          name: 'Collaborator_Detail',
          component: Collaborator_ItemDetailViewVue,
          meta: {
            requiresAuth: true,
            title: '公益夥伴瀏覽',
            isTitleHide: true
          }
        }
      ]
      //#endregion
    },
    {
      //#region 代碼維護 - 政策類別
      path: '/Code-Policy',
      name: 'Code_Policy_Index',
      component: CodePolicy_IndexViewVue,
      meta: {
        indexKey: 'Code_Policy',
        requiresAuth: true,
        title_parent: '政策類別維護',
        urlName_parent: 'Code_Policy_DataList'
      },
      children: [
        {
          path: '',
          name: 'Code_Policy_DataList',
          component: CodePolicy_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '政策類別維護',
            tip: '政策類別會出現在前台政策篩選選單，停用後民眾搜尋時看不到。'
          }
        },
        {
          path: 'Add',
          name: 'Code_Policy_Add',
          component: CodePolicy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增政策類別',
            tip: '新增類別後，記得通知內容人員把舊政策歸類到此類別。'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Policy_Edit',
          component: CodePolicy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯政策類別',
            tip: '修改名稱會即時影響前台篩選顯示文字。'
          }
        }
      ]
      //#endregion
    },
    {
      //#region 代碼維護 - 受助者
      path: '/Code-Recipient',
      name: 'Code_Recipient_Index',
      component: CodeRecipient_IndexViewVue,
      meta: {
        indexKey: 'Code_Recipient',
        requiresAuth: true,
        title_parent: '受助者維護',
        urlName_parent: 'Code_Recipient_DataList'
      },
      children: [
        {
          path: '',
          name: 'Code_Recipient_DataList',
          component: CodeRecipient_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '受助者維護',
            tip: '受助者類別用於福利政策的適用對象篩選。'
          }
        },
        {
          path: 'Add',
          name: 'Code_Recipient_Add',
          component: CodeRecipient_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增受助者',
            tip: '建議使用民眾易懂的稱呼，例如「低收入戶」「身心障礙者」。'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Recipient_Edit',
          component: CodeRecipient_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯受助者',
            tip: '修改名稱會立即同步到所有引用此代碼的政策。'
          }
        }
      ]
      //#endregion
    },
    {
      //#region 代碼維護 - 關鍵字
      path: '/Code-Keyword',
      name: 'Code_Keyword_Index',
      component: CodeKeyword_IndexViewVue,
      meta: {
        indexKey: 'Code_Keyword',
        requiresAuth: true,
        title_parent: '關鍵字維護',
        urlName_parent: 'Code_Keyword_DataList'
      },
      children: [
        {
          path: '',
          name: 'Code_Keyword_DataList',
          component: CodeKeyword_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '關鍵字維護',
            tip: '關鍵字用於文章與政策的標籤，提升前台搜尋命中率。'
          }
        },
        {
          path: 'Add',
          name: 'Code_Keyword_Add',
          component: CodeKeyword_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增關鍵字',
            tip: '建議使用名詞、避免標點符號。'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Keyword_Edit',
          component: CodeKeyword_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯關鍵字',
            tip: '修改後所有掛此關鍵字的文章/政策標籤都會更新。'
          }
        }
      ]
      //#endregion
    },
    {
      //#region 代碼維護 - 經濟條件
      path: '/Code-Income',
      name: 'Code_Income_Index',
      component: CodeIncome_IndexViewVue,
      meta: {
        indexKey: 'Code_Income',
        requiresAuth: true,
        title_parent: '經濟條件維護',
        urlName_parent: 'Code_Income_DataList'
      },
      children: [
        {
          path: '',
          name: 'Code_Income_DataList',
          component: CodeIncome_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '經濟條件維護',
            tip: '經濟條件用於福利政策的收入門檻篩選。'
          }
        },
        {
          path: 'Add',
          name: 'Code_Income_Add',
          component: CodeIncome_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增經濟條件',
            tip: '請使用具體門檻描述，例如「家庭月收入 < 4 萬」。'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Income_Edit',
          component: CodeIncome_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯經濟條件',
            tip: '修改後民眾依此條件查到的政策結果可能改變。'
          }
        }
      ]
      //#endregion
    },
    {
      //#region 代碼維護 - 特殊身分
      path: '/Code-Identity',
      name: 'Code_Identity_Index',
      component: CodeIdentity_IndexViewVue,
      meta: {
        indexKey: 'Code_Identity',
        requiresAuth: true,
        title_parent: '特殊身分維護',
        urlName_parent: 'Code_Identity_DataList'
      },
      children: [
        {
          path: '',
          name: 'Code_Identity_DataList',
          component: CodeIdentity_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '特殊身分維護',
            tip: '特殊身分用於福利政策的對象篩選（原住民、新住民等）。'
          }
        },
        {
          path: 'Add',
          name: 'Code_Identity_Add',
          component: CodeIdentity_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增特殊身分',
            tip: '請使用法規或政府公告慣用名稱。'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Identity_Edit',
          component: CodeIdentity_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯特殊身分',
            tip: '修改後所有引用此身分的政策即時同步。'
          }
        }
      ]
      //#endregion
    },
    {
      //#region 代碼維護 - 戶籍地
      path: '/Code-Domicile',
      name: 'Code_Domicile_Index',
      component: CodeDomicile_IndexViewVue,
      meta: {
        indexKey: 'Code_Domicile',
        requiresAuth: true,
        title_parent: '戶籍地維護',
        urlName_parent: 'Code_Domicile_DataList'
      },
      children: [
        {
          path: '',
          name: 'Code_Domicile_DataList',
          component: CodeDomicile_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '戶籍地維護',
            tip: '戶籍地用於洽辦單位的服務範圍劃分。'
          }
        },
        {
          path: 'Add',
          name: 'Code_Domicile_Add',
          component: CodeDomicile_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增戶籍地',
            tip: '依縣市行政區命名，例如「臺北市」「新北市」。'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Domicile_Edit',
          component: CodeDomicile_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯戶籍地',
            tip: '修改後所有引用此戶籍地的單位顯示文字會更新。'
          }
        }
      ]
      //#endregion
    },
    {
      //#region 資料分析儀表板
      path: '/Analysis',
      name: 'Analysis',
      component: Analysis_DashboardViewVue,
      meta: {
        indexKey: 'Analysis',
        requiresAuth: true,
        title: '資料分析',
        tip: '目前資料來自網站訪客紀錄；GA4 整合預計另外規劃。'
      }
      //#endregion
    },
    {
      //#region 帳戶管理
      path: '/Account',
      name: 'Account_Index',
      component: Account_IndexViewVue,
      meta: {
        indexKey: 'Account',
        requiresAuth: true,
        title_parent: '帳戶維護',
        urlName_parent: 'Account_DataList'
      },
      children: [
        {
          path: '',
          name: 'Account_DataList',
          component: Account_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '帳戶維護',
            tip: '帳號權限分檢視者/編輯者/管理者三層，建立後不可變更。'
          }
        },
        {
          path: 'Add',
          name: 'Account_Add',
          component: Account_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增帳戶',
            tip: '預設密碼至少 6 字、含英文大小寫與數字。使用者首次登入後可自行修改。'
          }
        },
        {
          path: 'Edit',
          name: 'Account_Edit',
          component: Account_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯帳戶',
            tip: '帳號、權限、資料狀態建立後不可修改；需變更請新增新帳號並停用舊帳號。'
          }
        },
        {
          // 管理者專用編輯路由，僅「管理者」角色可存取
          path: 'Edit_Manager',
          name: 'Account_Edit_Manager',
          component: Account_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '管理者編輯帳戶',
            requiresAdmin: true
          }
        },
        {
          path: 'Detail',
          name: 'Account_Detail',
          component: Account_ItemDetailViewVue,
          meta: {
            requiresAuth: true,
            title: '帳戶瀏覽',
            isTitleHide: true
          }
        }
      ]
      //#endregion
    },
    {
      //#region 個人資料管理
      path: '/Personal',
      name: 'Personal_Index',
      component: Personal_IndexViewVue,
      meta: {
        indexKey: 'Personal',
        requiresAuth: true,
        title_parent: '個人資料',
        urlName_parent: 'Personal_Detail'
      },
      children: [
        {
          path: '',
          name: 'Personal_Detail',
          component: Personal_DetailViewVue,
          meta: {
            requiresAuth: true,
            title: '個人資料',
            tip: '這裡只顯示目前的帳戶資料，需修改請按「編輯個人資料」。'
          }
        },
        {
          path: 'Edit',
          name: 'Personal_Edit',
          component: Personal_EditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯個人資料',
            tip: '修改姓名/E-mail 後按「儲存」。要改密碼請按上方「變更密碼」。'
          }
        },
        {
          path: 'ChangePwd',
          name: 'Personal_ChangePwd',
          component: Personal_ChangePwdViewVue,
          meta: {
            requiresAuth: true,
            title: '變更密碼',
            tip: '新密碼需含英文大小寫與數字、至少 6 字。儲存後下次登入需用新密碼。'
          }
        }
      ]
      //#endregion
    },
    {
      //#region 動態頁面管理 (CMS) — 後臺優化 #X
      path: '/PageManagement',
      name: 'PageManagement_Index',
      component: PageManagement_IndexViewVue,
      meta: {
        indexKey: 'PageManagement',
        requiresAuth: true,
        title_parent: '頁面管理',
        urlName_parent: 'PageManagement_DataList'
      },
      children: [
        {
          path: '',
          name: 'PageManagement_DataList',
          component: PageManagement_DataListViewVue,
          meta: {
            requiresAuth: true,
            title: '頁面管理',
            tip: '動態頁面變更需「發布」才會推到前台，僅儲存只是暫存草稿。'
          }
        },
        {
          path: 'Add',
          name: 'PageManagement_Add',
          component: PageManagement_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增頁面',
            tip: '先設定 slug 與 SEO，再放入區塊。儲存只是暫存，按「發布」才會生效。'
          }
        },
        {
          path: 'Edit',
          name: 'PageManagement_Edit',
          component: PageManagement_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯頁面',
            tip: '修改後可先儲存草稿預覽，確認沒問題再點「發布」推到前台。'
          }
        }
      ]
      //#endregion
    },
    {
      // 無權限提示頁
      path: '/NoPermission',
      name: 'NoPermission',
      component: NoPermission,
      meta: {
        indexKey: 'NoPermission',
        requiresAuth: true,
        title: '無此權限',
        viewerCanAccess: true
      }
    },
    {
      //#region 部署健康檢查 — 後臺優化 #87
      path: '/Health',
      name: 'Health',
      component: HealthCheckView,
      meta: {
        indexKey: 'Health',
        requiresAuth: true,
        title: '部署健康檢查',
        tip: 'read-only：列出目前部署的 API/環境變數/連線狀態，協助確認設定有沒有正確套用。',
        requiresAdmin: true
      }
      //#endregion
    },
    {
      //#region 部署 Smoke Test 清單 — 後臺優化 #88
      path: '/Health/Smoke',
      name: 'SmokeTest',
      component: SmokeTestView,
      meta: {
        indexKey: 'Health',
        requiresAuth: true,
        title: '部署 Smoke Test',
        tip: '依清單逐項驗收部署狀態；「通過/失敗/備註」會存在本機 localStorage，重新整理後仍在。',
        requiresAdmin: true
      }
      //#endregion
    },
    {
      // 圖片管理頁
      path: '/ImgManager',
      name: 'ImgManager',
      component: ImgManager_DataListView,
      meta: {
        indexKey: 'ImgManager',
        requiresAuth: true,
        title: '圖片管理',
        tip: '上傳的圖片可供文章、懶人包、夥伴等共用。刪除前請確認沒有頁面正在引用。'
      }
    }
  ]
})

/**
 * 路由以 Vue Plugin 形式匯出，安裝時同時掛載路由並設定導航守衛
 */
export default {
  install(app: any, options: any) {
    router.install(app)

    /**
     * 全域前置守衛（beforeEach）
     *
     * 2026-05-26 #6 — 改為讀 route.meta 驅動的權限模型，不再用 to.name 字串硬比。
     * 新增 route 只要設 meta.viewerCanAccess / meta.requiresAdmin，不必再來這裡改字串清單。
     *
     * 規則：
     *   1. meta.requiresAuth 為 true 且未登入 → /Login
     *   2. meta.requiresAdmin 為 true 但非「管理者」 → /NoPermission
     *   3. 使用者為「檢視者」但目標路由未標 meta.viewerCanAccess → /NoPermission
     *   4. 其餘放行（編輯者 + 管理者 可進除 requiresAdmin 之外的所有路由）
     */
    router.beforeEach((to, _from) => {
      const userStore = useUserStore()

      // 規則 1：需登入但尚未登入
      if (to.meta.requiresAuth && !userStore.isLogin) {
        return { path: '/Login' }
      }

      // Login / NoPermission 本身不需做進一步權限檢查（NoPermission 預設 viewerCanAccess: true）
      const isAuthPage = to.name === 'Login' || to.name === 'NoPermission'
      if (isAuthPage) return

      const permission = userStore.permission

      // 規則 2：管理者限定路由
      if (to.meta.requiresAdmin && permission !== '管理者') {
        return { path: '/NoPermission' }
      }

      // 規則 3：檢視者只能進有標 viewerCanAccess 的路由
      if (permission === '檢視者' && !to.meta.viewerCanAccess) {
        return { path: '/NoPermission' }
      }
    })

    /**
     * 全域後置守衛（afterEach）
     * 執行時機：每次路由跳轉完成後
     * 功能：更新瀏覽器分頁標題為路由定義的 title
     */
    router.afterEach((to, from) => {
      // @ts-ignore
      document.title = to.meta.title
    })
  }
}
