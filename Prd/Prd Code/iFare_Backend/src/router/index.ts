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

// 輸出基礎路徑（開發除錯用）
console.log(import.meta.env.BASE_URL)

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
        title: '首頁'
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
            title: '最新消息維護'
          }
        },
        {
          path: 'Add',
          name: 'News_Add',
          component: News_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增最新消息'
          }
        },
        {
          path: 'Edit',
          name: 'News_Edit',
          component: News_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯最新消息'
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
            title: '福利文章維護'
          }
        },
        {
          path: 'Add',
          name: 'Articles_Welfare_Add',
          component: ArticlesWelfare_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增福利文章'
          }
        },
        {
          path: 'Edit',
          name: 'Articles_Welfare_Edit',
          component: ArticlesWelfare_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯福利文章'
          }
        },
        {
          path: 'Detail',
          name: 'Articles_Welfare_Detail',
          component: ArticlesWelfare_ItemDetailViewVue,
          meta: {
            requiresAuth: true,
            title: '福利文章瀏覽',
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
            title: '懶人包維護'
          }
        },
        {
          path: 'Add',
          name: 'Articles_Lazy_Add',
          component: ArticlesLazy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增懶人包'
          }
        },
        {
          path: 'Edit',
          name: 'Articles_Lazy_Edit',
          component: ArticlesLazy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯懶人包'
          }
        },
        {
          path: 'Detail',
          name: 'Articles_Lazy_Detail',
          component: ArticlesLazy_ItemDetailViewVue,
          meta: {
            requiresAuth: true,
            title: '懶人包瀏覽',
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
            title: '福利政策維護'
          }
        },
        {
          path: 'Add',
          name: 'IFare_Policy_Add',
          component: IFarePolicy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增福利政策'
          }
        },
        {
          path: 'Edit',
          name: 'IFare_Policy_Edit',
          component: IFarePolicy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯福利政策'
          }
        },
        {
          path: 'Detail',
          name: 'IFare_Policy_Detail',
          component: IFarePolicy_ItemDetailViewVue,
          meta: {
            requiresAuth: true,
            title: '福利政策瀏覽',
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
            title: '常見問題維護'
          }
        },
        {
          path: 'Add',
          name: 'IFare_QA_Add',
          component: IFareQA_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增常見問題'
          }
        },
        {
          path: 'Edit',
          name: 'IFare_QA_Edit',
          component: IFareQA_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯常見問題'
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
            title: '洽辦單位維護'
          }
        },
        {
          path: 'Add',
          name: 'IFare_OfficeUnit_Add',
          component: IFareOfficeUnit_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增洽辦單位'
          }
        },
        {
          path: 'Edit',
          name: 'IFare_OfficeUnit_Edit',
          component: IFareOfficeUnit_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯洽辦單位'
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
            title: '公益夥伴維護'
          }
        },
        {
          path: 'Add',
          name: 'Collaborator_Add',
          component: Collaborator_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增公益夥伴'
          }
        },
        {
          path: 'Edit',
          name: 'Collaborator_Edit',
          component: Collaborator_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯公益夥伴'
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
            title: '政策類別維護'
          }
        },
        {
          path: 'Add',
          name: 'Code_Policy_Add',
          component: CodePolicy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增政策類別'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Policy_Edit',
          component: CodePolicy_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯政策類別'
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
            title: '受助者維護'
          }
        },
        {
          path: 'Add',
          name: 'Code_Recipient_Add',
          component: CodeRecipient_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增受助者'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Recipient_Edit',
          component: CodeRecipient_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯受助者'
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
            title: '關鍵字維護'
          }
        },
        {
          path: 'Add',
          name: 'Code_Keyword_Add',
          component: CodeKeyword_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增關鍵字'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Keyword_Edit',
          component: CodeKeyword_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯關鍵字'
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
            title: '經濟條件維護'
          }
        },
        {
          path: 'Add',
          name: 'Code_Income_Add',
          component: CodeIncome_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增經濟條件'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Income_Edit',
          component: CodeIncome_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯經濟條件'
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
            title: '特殊身分維護'
          }
        },
        {
          path: 'Add',
          name: 'Code_Identity_Add',
          component: CodeIdentity_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增特殊身分'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Identity_Edit',
          component: CodeIdentity_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯特殊身分'
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
            title: '戶籍地維護'
          }
        },
        {
          path: 'Add',
          name: 'Code_Domicile_Add',
          component: CodeDomicile_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增戶籍地'
          }
        },
        {
          path: 'Edit',
          name: 'Code_Domicile_Edit',
          component: CodeDomicile_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯戶籍地'
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
        title: '資料分析'
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
            title: '帳戶維護'
          }
        },
        {
          path: 'Add',
          name: 'Account_Add',
          component: Account_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '新增帳戶'
          }
        },
        {
          path: 'Edit',
          name: 'Account_Edit',
          component: Account_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯帳戶'
          }
        },
        {
          // 管理者專用編輯路由，僅「管理者」角色可存取
          path: 'Edit_Manager',
          name: 'Account_Edit_Manager',
          component: Account_AddEditViewVue,
          meta: {
            requiresAuth: true,
            title: '管理者編輯帳戶'
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
            title: '個人資料'
          }
        },
        {
          path: 'Edit',
          name: 'Personal_Edit',
          component: Personal_EditViewVue,
          meta: {
            requiresAuth: true,
            title: '編輯個人資料'
          }
        },
        {
          path: 'ChangePwd',
          name: 'Personal_ChangePwd',
          component: Personal_ChangePwdViewVue,
          meta: {
            requiresAuth: true,
            title: '變更密碼'
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
        title: '無此權限'
      }
    },
    {
      // 圖片管理頁
      path: '/ImgManager',
      name: 'ImgManager',
      component: ImgManager_DataListView,
      meta: {
        indexKey: 'ImgManager',
        requiresAuth: true,
        title: '圖片管理'
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
     * 執行時機：每次路由跳轉前
     * 功能：
     *   1. 未登入時重導至登入頁
     *   2. 「檢視者」角色僅能瀏覽特定頁面，其餘頁面導向無權限頁
     *   3. Account_Edit_Manager 路由僅「管理者」可存取
     */
    router.beforeEach((to, from) => {
      const userStore = useUserStore()

      // 規則一：需要登入但尚未登入 → 重導至登入頁
      if (to.meta.requiresAuth && !userStore.isLogin) {
        return {
          path: '/Login'
        }
      }

      // 規則二：「檢視者」角色的存取限制
      // 以下頁面「檢視者」可正常存取，其餘均導向無權限頁
      if (to.name != null &&
          to.name.toString().indexOf('Login') < 0 &&
          to.name.toString().indexOf('Home') < 0 &&
          to.name.toString().indexOf('Articles_Welfare_DataList') < 0 &&
          to.name.toString().indexOf('Articles_Lazy_DataList') < 0 &&
          to.name.toString().indexOf('IFare_Policy_DataList') < 0 &&
          to.name.toString().indexOf('Articles_Welfare_Detail') < 0 &&
          to.name.toString().indexOf('Articles_Lazy_Detail') < 0 &&
          to.name.toString().indexOf('IFare_Policy_Detail') < 0 &&
          // to.name.toString().indexOf('Personal_Detail') < 0 &&
          to.name.toString().indexOf('NoPermission') < 0 &&
          userStore.permission == "檢視者") {
        return {
          path: '/NoPermission'
        }
      }

      // 規則三：Account_Edit_Manager 僅「管理者」可存取
      if (to.name != null && to.name.toString().indexOf('Account_Edit_Manager') >= 0 && userStore.permission != "管理者") {
        return {
          path: '/NoPermission'
        }
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
