<template>
  <div class="app-body-child" :name="$route.name">
    <div class="compare-page">
      <section class="compare-header">
        <div>
          <h1>福利方案比較</h1>
          <p>已收藏 {{ compareCount }} 個方案，最多可比較 {{ maxItems }} 個。</p>
        </div>
        <div class="compare-actions">
          <NuxtLink class="compare-action compare-action--primary" to="/ifare/result">返回搜尋</NuxtLink>
          <button
            v-if="compareCount > 0"
            class="compare-action"
            type="button"
            @click="clearPolicies"
          >
            清空收藏
          </button>
        </div>
      </section>

      <ClientOnly>
        <section v-if="compareItems.length === 0" class="compare-empty">
          <h2>尚未收藏福利方案</h2>
          <p>可從搜尋結果或福利詳情頁加入比較。</p>
          <NuxtLink class="compare-action compare-action--primary" to="/ifare">開始查詢</NuxtLink>
        </section>

        <section v-else class="compare-table-wrap" aria-label="福利方案比較表">
          <table class="compare-table">
            <thead>
              <tr>
                <th scope="col">比較項目</th>
                <th v-for="item in compareItems" :key="item.id" scope="col">
                  <div class="compare-policy-title">
                    <NuxtLink :to="{ path: '/ifare/info', query: { id: item.id } }">
                      {{ item.title }}
                    </NuxtLink>
                    <span>{{ item.area || '未標示地區' }}</span>
                    <button type="button" @click="removePolicy(item.id)">移除</button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">申請條件</th>
                <td v-for="item in compareItems" :key="`qualification-${item.id}`">
                  {{ toSnippet(item.qualification, '詳情頁查看申請條件') }}
                </td>
              </tr>
              <tr>
                <th scope="row">應備文件</th>
                <td v-for="item in compareItems" :key="`documents-${item.id}`">
                  <ul class="compare-documents">
                    <li v-for="document in getDocumentLabels(item)" :key="document">{{ document }}</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <th scope="row">期限提醒</th>
                <td v-for="item in compareItems" :key="`deadline-${item.id}`">
                  <span
                    v-if="getDeadlineLabel(item.discontinuedTime)"
                    class="deadline-badge"
                    :class="`deadline-badge--${getDeadlineLevel(item.discontinuedTime)}`"
                  >
                    {{ getDeadlineLabel(item.discontinuedTime) }}
                  </span>
                  <span v-else>未進入近期截止提醒</span>
                </td>
              </tr>
              <tr>
                <th scope="row">承辦窗口</th>
                <td v-for="item in compareItems" :key="`office-${item.id}`">
                  <span>{{ item.officeUnitInfo || '詳情頁查看承辦窗口' }}</span>
                  <a v-if="item.welfareTel" :href="`tel:${item.welfareTel}`">{{ item.welfareTel }}</a>
                </td>
              </tr>
              <tr>
                <th scope="row">限制差異</th>
                <td v-for="item in compareItems" :key="`limits-${item.id}`">
                  <ul class="compare-tags">
                    <li>{{ item.hasRecipient ? '有年齡限制' : '無年齡限制' }}</li>
                    <li>{{ item.hasIncome ? '有經濟限制' : '無經濟限制' }}</li>
                    <li>{{ item.hasIndentity ? '有特殊身分限制' : '無特殊身分限制' }}</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <th scope="row">福利內容</th>
                <td v-for="item in compareItems" :key="`welfare-${item.id}`">
                  {{ toSnippet(item.welfareInfo, '詳情頁查看福利內容') }}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <template #fallback>
          <section class="compare-empty">
            <p>載入收藏方案...</p>
          </section>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: "ifare",
  toLinkName: "i-Fare",
  toLink: "/ifare",
});

const {
  items: compareItems,
  count: compareCount,
  maxItems,
  removePolicy,
  clearPolicies,
} = useWelfareCompare();
const { getDeadlineInfo } = usePolicyDeadline();
const { parseDocumentChecklist } = useDocumentChecklist();

function stripHtml(value?: string) {
  return (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSnippet(value: string | undefined, fallback: string) {
  const text = stripHtml(value);
  if (!text) return fallback;
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
}

function getDocumentLabels(item: { evidence?: string }) {
  const documents = parseDocumentChecklist(item.evidence ?? "")
    .slice(0, 5)
    .map((document) => document.text);

  return documents.length > 0 ? documents : ["詳情頁查看應備文件"];
}

function getDeadlineLabel(value?: string) {
  return getDeadlineInfo(value ?? "")?.label ?? "";
}

function getDeadlineLevel(value?: string) {
  return getDeadlineInfo(value ?? "")?.level ?? "normal";
}
</script>

<style scoped>
.compare-page {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 48px 0 80px;
}

.compare-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.compare-header h1 {
  margin: 0 0 8px;
  color: #171818;
  font-size: 2rem;
  line-height: 1.25;
}

.compare-header p {
  margin: 0;
  color: #52616b;
  line-height: 1.6;
}

.compare-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.compare-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid rgba(44, 80, 97, 0.2);
  border-radius: 999px;
  background: #fff;
  color: #1f3640;
  cursor: pointer;
  font-weight: 700;
  text-decoration: none;
}

.compare-action--primary {
  border-color: #ea5504;
  background: #ea5504;
  color: #fff;
}

.compare-empty {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 56px 24px;
  border: 1px solid rgba(44, 80, 97, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.compare-empty h2,
.compare-empty p {
  margin: 0;
}

.compare-empty p {
  color: #52616b;
}

.compare-table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(44, 80, 97, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
}

.compare-table {
  width: 100%;
  min-width: 820px;
  border-collapse: collapse;
}

.compare-table th,
.compare-table td {
  min-width: 190px;
  padding: 16px;
  border-bottom: 1px solid rgba(44, 80, 97, 0.12);
  border-left: 1px solid rgba(44, 80, 97, 0.1);
  color: #1f3640;
  line-height: 1.7;
  text-align: left;
  vertical-align: top;
}

.compare-table th:first-child,
.compare-table td:first-child {
  border-left: 0;
}

.compare-table thead th {
  background: #f7faf9;
}

.compare-table tbody th {
  width: 150px;
  min-width: 150px;
  background: #f7faf9;
  font-weight: 800;
}

.compare-policy-title {
  display: grid;
  gap: 8px;
}

.compare-policy-title a {
  color: #171818;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.45;
  text-decoration: none;
}

.compare-policy-title span {
  color: #52616b;
  font-size: 0.9rem;
}

.compare-policy-title button {
  justify-self: start;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(234, 85, 4, 0.24);
  border-radius: 999px;
  background: #fff;
  color: #c84804;
  cursor: pointer;
  font-weight: 700;
}

.compare-documents,
.compare-tags {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.compare-tags li,
.compare-documents li {
  padding: 7px 9px;
  border-radius: 8px;
  background: #f7faf9;
}

.deadline-badge {
  display: inline-flex;
  width: fit-content;
  padding: 4px 8px;
  border-radius: 6px;
  background: #eef6f4;
  color: #235447;
  font-size: 0.9rem;
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

@media (max-width: 768px) {
  .compare-page {
    width: min(100% - 24px, 1120px);
    padding-top: 32px;
  }

  .compare-header {
    align-items: stretch;
    flex-direction: column;
  }

  .compare-actions {
    justify-content: flex-start;
  }
}
</style>
