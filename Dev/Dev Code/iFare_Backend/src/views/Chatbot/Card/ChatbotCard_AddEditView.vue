<template>
  <main-header>
    <template #subtitle v-if="$route.name == 'Chatbot_Card_Edit'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{ $route.query.id }}</sub>
    </template>
    <template #btnsRight>
      <el-button :icon="Close" color="white" size="large" @click="$router.go(-1)"
        >取消</el-button
      >
      <el-button :icon="Check" type="primary" size="large" @click="SaveAction"
        >儲存</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div class="section-main-card card-fullsize card-input-format">
      <div class="card-info">
        <div class="item-group">
          <label class="input-title required">主題</label>
          <el-input
            v-model="input_title"
            maxlength="100"
            show-word-limit
            placeholder="例如：i-Fare 搜尋按鈕"
          />
        </div>
        <div class="item-group">
          <label class="input-title required">卡片代號</label>
          <el-input
            v-model="input_cardKey"
            maxlength="64"
            show-word-limit
            placeholder="例如：ifare-search（僅限小寫英文、數字與連字號）"
          />
        </div>
        <div class="item-group textarea">
          <label class="input-title required">可能的問法</label>
          <el-input
            v-model="input_keywords"
            rows="4"
            type="textarea"
            resize="none"
            placeholder="以逗號分隔，例如：怎麼搜尋,找補助,查補助,福利政策"
          />
          <span class="input-hint"
            >訪客只要打到其中一個詞，就會直接回下方的答案。詞越具體越準。</span
          >
        </div>
        <div class="item-group textarea">
          <label class="input-title required">芒寶的回答</label>
          <el-input
            v-model="input_answer"
            rows="5"
            maxlength="1000"
            show-word-limit
            type="textarea"
            resize="none"
            placeholder="輸入內容"
          />
          <span class="input-hint"
            >這段文字會原封不動顯示給訪客，不會被 AI
            改寫。請用芒寶的語氣撰寫：句子短、有朝氣，稱呼訪客用「您」，不要用表情符號。</span
          >
        </div>
      </div>
    </div>

    <div class="section-main-card card-fullsize card-input-format">
      <div class="card-info">
        <div class="item-group">
          <label class="input-title">附帶的站內連結</label>
          <el-select
            v-model="select_linkKeys"
            multiple
            :multiple-limit="2"
            clearable
            placeholder="最多選 2 個，可不選"
          >
            <el-option
              v-for="opt in linkOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <span class="input-hint">回答下方會顯示成可點擊的按鈕。</span>
        </div>
        <div class="item-group">
          <label class="input-title">比對權重</label>
          <el-input-number
            v-model="input_priority"
            :min="0.1"
            :max="1"
            :step="0.01"
            :precision="2"
          />
          <span class="input-hint"
            >預設 1。若這張卡的問法太廣、容易蓋過其他卡片，可調低（例如
            0.85）。</span
          >
        </div>
        <div class="item-group">
          <label class="input-title">排序</label>
          <el-input-number v-model="input_sort" :min="0" :step="10" />
          <span class="input-hint">數字小的排在前面，僅影響後台列表顯示順序。</span>
        </div>
        <div class="item-group">
          <label class="input-title required">資料狀態</label>
          <el-switch
            v-model="switch_state"
            size="large"
            active-text="啟用"
            inactive-text="停用"
          />
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { ref, getCurrentInstance } from "vue";
import {
  ElButton,
  ElScrollbar,
  ElSwitch,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
} from "element-plus";
import { Close, Check } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const _router = useRouter();
const userStore = useUserStore();
const $Message = app?.appContext.config.globalProperties.$message;

const routeNameType = _$route?.name?.toString().toLocaleLowerCase() || "";
const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null;
const createdate = ref("");

// 必須與前台 SITE_LINKS 一致（iFare_Frontend/server/api/chatbot.post.ts）
const linkOptions = [
  { value: "home", label: "回到首頁" },
  { value: "about", label: "關於長穩" },
  { value: "news", label: "最新消息" },
  { value: "articles", label: "福利專欄" },
  { value: "collaborator", label: "公益夥伴" },
  { value: "ifare", label: "i-Fare 福利政策" },
];

const input_title = ref("");
const input_cardKey = ref("");
const input_keywords = ref("");
const input_answer = ref("");
const select_linkKeys = ref<Array<string>>([]);
const input_priority = ref(1);
const input_sort = ref(0);
const switch_state = ref(true);

if (routeNameType.indexOf("edit") >= 0) {
  $WebAPI.GetChatbotCardList(
    userStore.token,
    null,
    null,
    null,
    null,
    ids,
    (res: any) => {
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;
      if (_res.errCode != 0) return console.error(_res.errMsg);

      const _data = _res.result[0];
      createdate.value = _data.createDate;
      input_title.value = _data.title;
      input_cardKey.value = _data.cardKey;
      input_keywords.value = _data.keywords;
      input_answer.value = _data.answer;
      select_linkKeys.value = (_data.linkKeys || "")
        .split(",")
        .map((item: string) => item.trim())
        .filter((item: string) => item);
      input_priority.value = Number(_data.priority) || 1;
      input_sort.value = Number(_data.sort) || 0;
      switch_state.value = _data.state == "啟用";
    }
  );
}

function SaveAction() {
  const _title = input_title.value.trim();
  const _cardKey = input_cardKey.value.trim().toLowerCase();
  const _keywords = input_keywords.value.trim();
  const _answer = input_answer.value.trim();
  const _linkKeys = select_linkKeys.value.join(",");
  const _priority = input_priority.value;
  const _sort = input_sort.value;
  const _state = switch_state.value;

  if (!_title) {
    return $Message({ message: `【主題】不可為空`, type: "warning" });
  }
  if (!_cardKey) {
    return $Message({ message: `【卡片代號】不可為空`, type: "warning" });
  }
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(_cardKey)) {
    return $Message({
      message: `【卡片代號】僅能使用小寫英文、數字與連字號，長度 2 至 64 字元`,
      type: "warning",
    });
  }
  if (!_keywords) {
    return $Message({ message: `【可能的問法】不可為空`, type: "warning" });
  }
  if (!_answer) {
    return $Message({ message: `【芒寶的回答】不可為空`, type: "warning" });
  }

  const handleResponse = (successMessage: string, onSuccess: () => void) => {
    return (res: any) => {
      let _resData = res.data || "error";
      if (_resData == "error") {
        $Message({ message: `API res ${_resData}`, type: "error" });
        return console.error(`API res ${_resData}`);
      }

      let _res = _resData.result;
      if (_res.errCode != 0) {
        $Message({ message: _res.errMsg, type: "error" });
        return console.error(_res.errMsg);
      }

      $Message({ message: successMessage, type: "success" });
      onSuccess();
    };
  };

  if (routeNameType.indexOf("add") >= 0) {
    $WebAPI.InsertChatbotCard(
      userStore.token,
      _cardKey,
      _title,
      _keywords,
      _answer,
      _linkKeys,
      _priority,
      _sort,
      _state,
      handleResponse("新增成功", () =>
        $commonLib.GuideToPage("Chatbot_Card_DataList")
      )
    );
  }

  if (routeNameType.indexOf("edit") >= 0) {
    const _id = ids ? ids[0] : 0;
    if (_id == 0) return false;
    $WebAPI.UpdateChatbotCard(
      userStore.token,
      _id,
      _cardKey,
      _title,
      _keywords,
      _answer,
      _linkKeys,
      _priority,
      _sort,
      _state,
      handleResponse("編輯成功", () => _router.back())
    );
  }
}
</script>
