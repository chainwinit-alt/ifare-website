//#region Else
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import Analysis_DashboardViewVue from '@/views/Analysis/Analysis_DashboardView.vue'
import NoPermission from '@/views/NoPermission.vue'
//#endregion
//#region [View.vue] News
import News_IndexViewVue from '@/views/News/News_IndexView.vue'
import News_DataListViewVue from '@/views/News/News_DataListView.vue'
import News_AddEditViewVue from '@/views/News/News_AddEditView.vue'
import News_ItemDetailViewVue from '@/views/News/News_ItemDetailView.vue'
//#endregion
//#region [View.vue] Articles_Welfare
import ArticlesWelfare_IndexViewVue from '@/views/Articles/Welfare/ArticlesWelfare_IndexView.vue'
import ArticlesWelfare_DataListViewVue from '@/views/Articles/Welfare/ArticlesWelfare_DataListView.vue'
import ArticlesWelfare_AddEditViewVue from '@/views/Articles/Welfare/ArticlesWelfare_AddEditView.vue'
import ArticlesWelfare_ItemDetailViewVue from '@/views/Articles/Welfare/ArticlesWelfare_ItemDetailView.vue'
//#endregion
//#region [View.vue] Articles_Lazy
import ArticlesLazy_IndexViewVue from '@/views/Articles/Lazy/ArticlesLazy_IndexView.vue'
import ArticlesLazy_DataListViewVue from '@/views/Articles/Lazy/ArticlesLazy_DataListView.vue'
import ArticlesLazy_AddEditViewVue from '@/views/Articles/Lazy/ArticlesLazy_AddEditView.vue'
import ArticlesLazy_ItemDetailViewVue from '@/views/Articles/Lazy/ArticlesLazy_ItemDetailView.vue'
//#endregion
//#region [View.vue] IFare_Policy
import IFarePolicy_IndexViewVue from '@/views/IFare/Policy/IFarePolicy_IndexView.vue'
import IFarePolicy_DataListViewVue from '@/views/IFare/Policy/IFarePolicy_DataListView.vue'
import IFarePolicy_AddEditViewVue from '@/views/IFare/Policy/IFarePolicy_AddEditView.vue'
import IFarePolicy_ItemDetailViewVue from '@/views/IFare/Policy/IFarePolicy_ItemDetailView.vue'
//#endregion
//#region [View.vue] IFare_QA
import IFareQA_IndexViewVue from '@/views/IFare/QA/IFareQA_IndexView.vue'
import IFareQA_DataListViewVue from '@/views/IFare/QA/IFareQA_DataListView.vue'
import IFareQA_AddEditViewVue from '@/views/IFare/QA/IFareQA_AddEditView.vue'
import IFareQA_ItemDetailViewVue from '@/views/IFare/QA/IFareQA_ItemDetailView.vue'
//#endregion
//#region [View.vue] IFare_OfficeUnit
import IFareOfficeUnit_IndexViewVue from '@/views/IFare/OfficeUnit/IFareOfficeUnit_IndexView.vue'
import IFareOfficeUnit_DataListViewVue from '@/views/IFare/OfficeUnit/IFareOfficeUnit_DataListView.vue'
import IFareOfficeUnit_AddEditViewVue from '@/views/IFare/OfficeUnit/IFareOfficeUnit_AddEditView.vue'
import IFareOfficeUnit_ItemDetailViewVue from '@/views/IFare/OfficeUnit/IFareOfficeUnit_ItemDetailView.vue'
//#endregion
//#region [View.vue] Collaborator
import Collaborator_IndexViewVue from '@/views/Collaborator/Collaborator_IndexView.vue'
import Collaborator_DataListViewVue from '@/views/Collaborator/Collaborator_DataListView.vue'
import Collaborator_AddEditViewVue from '@/views/Collaborator/Collaborator_AddEditView.vue'
import Collaborator_ItemDetailViewVue from '@/views/Collaborator/Collaborator_ItemDetailView.vue'
//#endregion
//#region [View.vue] Code_Policy
import CodePolicy_IndexViewVue from '@/views/Code/Policy/CodePolicy_IndexView.vue'
import CodePolicy_DataListViewVue from '@/views/Code/Policy/CodePolicy_DataListView.vue'
import CodePolicy_AddEditViewVue from '@/views/Code/Policy/CodePolicy_AddEditView.vue'
//#endregion
//#region [View.vue] Code_Recipient
import CodeRecipient_IndexViewVue from '@/views/Code/Recipient/CodeRecipient_IndexView.vue'
import CodeRecipient_DataListViewVue from '@/views/Code/Recipient/CodeRecipient_DataListView.vue'
import CodeRecipient_AddEditViewVue from '@/views/Code/Recipient/CodeRecipient_AddEditView.vue'
//#endregion
//#region [View.vue] Code_Keyword
import CodeKeyword_IndexViewVue from '@/views/Code/Keyword/CodeKeyword_IndexView.vue'
import CodeKeyword_DataListViewVue from '@/views/Code/Keyword/CodeKeyword_DataListView.vue'
import CodeKeyword_AddEditViewVue from '@/views/Code/Keyword/CodeKeyword_AddEditView.vue'
//#endregion
//#region [View.vue] Code_Income
import CodeIncome_IndexViewVue from '@/views/Code/Income/CodeIncome_IndexView.vue'
import CodeIncome_DataListViewVue from '@/views/Code/Income/CodeIncome_DataListView.vue'
import CodeIncome_AddEditViewVue from '@/views/Code/Income/CodeIncome_AddEditView.vue'
//#endregion
//#region [View.vue] Code_Identity
import CodeIdentity_IndexViewVue from '@/views/Code/Identity/CodeIdentity_IndexView.vue'
import CodeIdentity_DataListViewVue from '@/views/Code/Identity/CodeIdentity_DataListView.vue'
import CodeIdentity_AddEditViewVue from '@/views/Code/Identity/CodeIdentity_AddEditView.vue'
//#endregion
//#region [View.vue] Code_Domicile
import CodeDomicile_IndexViewVue from '@/views/Code/Domicile/CodeDomicile_IndexView.vue'
import CodeDomicile_DataListViewVue from '@/views/Code/Domicile/CodeDomicile_DataListView.vue'
import CodeDomicile_AddEditViewVue from '@/views/Code/Domicile/CodeDomicile_AddEditView.vue'
//#endregion
//#region [View.vue] Account
import Account_IndexViewVue from '@/views/Account/Account_IndexView.vue'
import Account_DataListViewVue from '@/views/Account/Account_DataListView.vue'
import Account_AddEditViewVue from '@/views/Account/Account_AddEditView.vue'
import Account_ItemDetailViewVue from '@/views/Account/Account_ItemDetailView.vue'
//#endregion
//#region [View.vue] Personal
import Personal_IndexViewVue from '@/views/Personal/Personal_IndexView.vue'
import Personal_DetailViewVue from '@/views/Personal/Personal_DetailView.vue'
import Personal_EditViewVue from '@/views/Personal/Personal_EditView.vue'
import Personal_ChangePwdViewVue from '@/views/Personal/Personal_ChangePwdView.vue'
//#endregion
//#region [View.vue] Img Manager
import ImgManager_DataListView from '@/views/ImgManager/ImgManager_DataListView.vue'
//#endregion
console.log(import.meta.env.BASE_URL)
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      //#region Home
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
      //#region Login
      path: '/Login',
      name: 'Login',
      component: LoginView,
      meta: {
        indexKey: 'Login',
        requiresAuth: false,
        title: 'Login'
      }
      //#endregion
    },
    {
      //#region News
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
            isTitleHide: true
          }
        }
      ]
      //#endregion
    },
    {
      //#region Articles-Welfare
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
      //#region Articles-Lazy
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
      //#region IFare-Policy
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
      //#region IFare-QA
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
      //#region IFare-OfficeUnit
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
      //#region Collaborator
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
      //#region Code_Policy
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
      //#region Code_Recipient
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
      //#region Code_Keyword
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
      //#region Code_Income
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
      //#region Code_Identity
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
      //#region Code_Domicile
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
      //#region Analysis
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
      //#region Account
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
      //#region Personal
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

export default {
  install(app: any, options: any) {
    router.install(app)

    router.beforeEach((to, from) => {
      const userStore = useUserStore()

      if (to.meta.requiresAuth && !userStore.isLogin) {
        return {
          path: '/Login'
        }
      }
      
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

      if (to.name != null && to.name.toString().indexOf('Account_Edit_Manager') >= 0 && userStore.permission != "管理者") {
        return {
          path: '/NoPermission'
        }
      }
    })

    router.afterEach((to, from) => {
      // @ts-ignore
      document.title = to.meta.title
    })
  }
}
