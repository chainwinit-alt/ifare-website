<template>
  <main-header>
    <template #subtitle>
      <span class="header-subtitle">GA4 預覽版，不會呼叫外部分析 API</span>
    </template>
    <template #btnsRight>
      <el-button
        :icon="Download"
        type="primary"
        size="large"
        :loading="isExporting"
        @click="downloadDashboard"
      >
        下載儀表板
      </el-button>
    </template>
  </main-header>

  <el-scrollbar class="main-scrollbar">
    <div ref="exportRoot" class="analytics-preview">
      <section class="section-main-card hero-shell">
        <div class="hero-panel">
          <div class="hero-copy">
            <span class="hero-kicker">GA4 Preview Dashboard</span>
            <h2 class="hero-title">先看後台 GA4 會長什麼樣子</h2>
            <p class="hero-desc">
              這一版先用前端模擬資料做畫面驗證，不打 GA4 API，不增加伺服器負載。後續確認版型後，再把資料來源換成排程同步即可。
            </p>
          </div>

          <div class="hero-status-grid">
            <article class="status-tile">
              <span class="status-label">資料模式</span>
              <strong class="status-value">Preview Mock</strong>
              <span class="status-note">目前只驗證介面與指標結構</span>
            </article>
            <article class="status-tile">
              <span class="status-label">建議同步方式</span>
              <strong class="status-value">背景排程快取</strong>
              <span class="status-note">每 30 至 60 分鐘更新一次</span>
            </article>
            <article class="status-tile">
              <span class="status-label">最後更新時間</span>
              <strong class="status-value">{{ lastSyncLabel }}</strong>
              <span class="status-note">正式版可改成資料庫同步時間</span>
            </article>
          </div>
        </div>
      </section>

      <section class="section-main-card filter-shell">
        <div class="filter-bar">
          <div class="filter-group">
            <span class="filter-label">期間快捷</span>
            <div class="preset-list">
              <button
                v-for="preset in presets"
                :key="preset.days"
                type="button"
                class="preset-chip"
                :class="{ 'is-active': selectedPreset === preset.days }"
                @click="applyPreset(preset.days)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <div class="filter-group range-group">
            <span class="filter-label">分析區間</span>
            <el-date-picker
              v-model="dateRange"
              class="date-range"
              type="daterange"
              range-separator="至"
              start-placeholder="起始日期"
              end-placeholder="結束日期"
              :disabled-date="disabledDate"
              :clearable="false"
            />
          </div>

          <div class="filter-group year-group">
            <span class="filter-label">年度總覽</span>
            <el-select v-model="selectedYear" size="large" class="year-select">
              <el-option
                v-for="year in availableYears"
                :key="year"
                :label="`${year} 年`"
                :value="year"
              />
            </el-select>
          </div>
        </div>

        <div class="compare-strip">
          <span class="compare-main">{{ rangeLabel }}</span>
          <span class="compare-sub">對比前一期 {{ comparisonRangeLabel }}</span>
        </div>
      </section>

      <section class="kpi-grid">
        <article v-for="card in kpiCards" :key="card.label" class="section-main-card kpi-card">
          <div class="kpi-head">
            <span class="kpi-label">{{ card.label }}</span>
            <span class="kpi-delta" :class="deltaClass(card.delta)">
              {{ formatDelta(card.delta) }}
            </span>
          </div>
          <strong class="kpi-value">{{ card.value }}</strong>
          <p class="kpi-note">{{ card.note }}</p>
        </article>
      </section>

      <section class="analytics-grid">
        <article class="section-main-card chart-card chart-wide">
          <div class="card-head">
            <div>
              <h3>流量趨勢</h3>
              <p>Sessions 與 Active Users 的日別走勢</p>
            </div>
          </div>
          <apexchart
            type="area"
            height="320"
            :options="trendChartOptions"
            :series="trendChartSeries"
          />
        </article>

        <article class="section-main-card chart-card">
          <div class="card-head">
            <div>
              <h3>流量來源</h3>
              <p>依通路彙總的 sessions 分布</p>
            </div>
          </div>
          <apexchart
            type="donut"
            height="320"
            :options="channelChartOptions"
            :series="channelChartSeries"
          />
        </article>

        <article class="section-main-card chart-card">
          <div class="card-head">
            <div>
              <h3>{{ selectedYear }} 年月度概況</h3>
              <p>每月 sessions 與 conversions</p>
            </div>
          </div>
          <apexchart
            type="line"
            height="320"
            :options="yearChartOptions"
            :series="yearChartSeries"
          />
        </article>

        <article class="section-main-card chart-card">
          <div class="card-head">
            <div>
              <h3>熱門內容</h3>
              <p>區間內最常被瀏覽的頁面</p>
            </div>
          </div>
          <apexchart
            type="bar"
            height="320"
            :options="topPagesChartOptions"
            :series="topPagesChartSeries"
          />
        </article>

        <article class="section-main-card insight-card">
          <div class="card-head">
            <div>
              <h3>判讀重點</h3>
              <p>把圖表翻成可讀的營運訊號</p>
            </div>
          </div>

          <div class="insight-list">
            <article v-for="item in insightCards" :key="item.title" class="insight-item">
              <span class="insight-tag">{{ item.tag }}</span>
              <strong>{{ item.title }}</strong>
              <p>{{ item.description }}</p>
            </article>
          </div>
        </article>

        <article class="section-main-card device-card">
          <div class="card-head">
            <div>
              <h3>裝置分布</h3>
              <p>目前流量主要來自哪種裝置</p>
            </div>
          </div>

          <div class="device-list">
            <article v-for="device in deviceBreakdown" :key="device.label" class="device-item">
              <div class="device-meta">
                <strong>{{ device.label }}</strong>
                <span>{{ device.share }}%</span>
              </div>
              <div class="device-track">
                <div class="device-bar" :style="{ width: `${device.share}%` }"></div>
              </div>
              <p>{{ device.sessionsLabel }} sessions</p>
            </article>
          </div>
        </article>
      </section>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { ElButton, ElDatePicker, ElOption, ElScrollbar, ElSelect } from "element-plus";
import { Download } from "@element-plus/icons-vue";
import html2canvas from "html2canvas";
import MainHeader from "@/components/MainHeader.vue";

type ChannelKey = "Organic Search" | "Direct" | "Referral" | "Social" | "Email";
type DeviceKey = "Mobile" | "Desktop" | "Tablet";

interface DailyRow {
  date: Date;
  activeUsers: number;
  sessions: number;
  newUsers: number;
  conversions: number;
  engagementSeconds: number;
  channels: Record<ChannelKey, number>;
  devices: Record<DeviceKey, number>;
  pages: Array<{
    path: string;
    title: string;
    views: number;
  }>;
}

interface SummaryResult {
  activeUsers: number;
  sessions: number;
  newUsers: number;
  conversions: number;
  avgEngagementSeconds: number;
  conversionRate: number;
}

const chartPalette = ["#e85d04", "#0f4c5c", "#ffb703", "#6a994e", "#bc4749"];

const presets = [
  { label: "近 7 天", days: 7 },
  { label: "近 28 天", days: 28 },
  { label: "近 90 天", days: 90 },
];

const exportRoot = ref<HTMLElement | null>(null);
const isExporting = ref(false);

const today = startOfDay(new Date());
const datasetStart = addDays(today, -179);
const mockRows = buildMockRows(datasetStart, 180);
const availableYears = Array.from(new Set(mockRows.map((row) => row.date.getFullYear()))).sort();
const selectedYear = ref(availableYears[availableYears.length - 1] ?? today.getFullYear());
const selectedPreset = ref(28);
const dateRange = ref<[Date, Date]>([addDays(today, -27), today]);
const lastSyncLabel = computed(() => formatDateTime(new Date()));

watch(
  dateRange,
  (value) => {
    if (!value || value.length !== 2) return;

    const [start, end] = value;
    const matchedPreset = presets.find((preset) => {
      const presetStart = addDays(today, -(preset.days - 1));
      return isSameDate(start, presetStart) && isSameDate(end, today);
    });

    selectedPreset.value = matchedPreset?.days ?? 0;
  },
  { deep: true },
);

const filteredRows = computed(() =>
  mockRows.filter((row) => isWithinRange(row.date, dateRange.value[0], dateRange.value[1])),
);

const comparisonRows = computed(() => {
  const days = getInclusiveDayCount(dateRange.value[0], dateRange.value[1]);
  const comparisonEnd = addDays(dateRange.value[0], -1);
  const comparisonStart = addDays(comparisonEnd, -(days - 1));
  return mockRows.filter((row) => isWithinRange(row.date, comparisonStart, comparisonEnd));
});

const currentSummary = computed(() => summarizeRows(filteredRows.value));
const previousSummary = computed(() => summarizeRows(comparisonRows.value));

const rangeLabel = computed(
  () => `${formatDate(dateRange.value[0])} 至 ${formatDate(dateRange.value[1])}`,
);

const comparisonRangeLabel = computed(() => {
  const days = getInclusiveDayCount(dateRange.value[0], dateRange.value[1]);
  const comparisonEnd = addDays(dateRange.value[0], -1);
  const comparisonStart = addDays(comparisonEnd, -(days - 1));
  return `${formatDate(comparisonStart)} 至 ${formatDate(comparisonEnd)}`;
});

const kpiCards = computed(() => [
  {
    label: "Active Users",
    value: formatNumber(currentSummary.value.activeUsers),
    delta: getDelta(currentSummary.value.activeUsers, previousSummary.value.activeUsers),
    note: `新使用者 ${formatNumber(currentSummary.value.newUsers)} 人`,
  },
  {
    label: "Sessions",
    value: formatNumber(currentSummary.value.sessions),
    delta: getDelta(currentSummary.value.sessions, previousSummary.value.sessions),
    note: `平均每位使用者 ${formatDecimal(
      currentSummary.value.sessions / Math.max(currentSummary.value.activeUsers, 1),
      2,
    )} 次`,
  },
  {
    label: "Conversions",
    value: formatNumber(currentSummary.value.conversions),
    delta: getDelta(currentSummary.value.conversions, previousSummary.value.conversions),
    note: `轉換率 ${formatPercent(currentSummary.value.conversionRate)}`,
  },
  {
    label: "平均互動時間",
    value: formatDuration(currentSummary.value.avgEngagementSeconds),
    delta: getDelta(
      currentSummary.value.avgEngagementSeconds,
      previousSummary.value.avgEngagementSeconds,
    ),
    note: "這裡之後可替換為 GA4 average engagement time",
  },
]);

const trendChartSeries = computed(() => [
  {
    name: "Sessions",
    type: "area",
    data: filteredRows.value.map((row) => row.sessions),
  },
  {
    name: "Active Users",
    type: "line",
    data: filteredRows.value.map((row) => row.activeUsers),
  },
]);

const trendChartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    foreColor: "#56606b",
  },
  colors: ["#e85d04", "#0f4c5c"],
  stroke: {
    curve: "smooth",
    width: [0, 3],
  },
  fill: {
    type: ["gradient", "solid"],
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.42,
      opacityTo: 0.08,
      stops: [0, 90, 100],
    },
  },
  dataLabels: { enabled: false },
  grid: {
    borderColor: "rgba(15, 76, 92, 0.12)",
    strokeDashArray: 4,
  },
  xaxis: {
    categories: filteredRows.value.map((row) => formatMonthDay(row.date)),
    labels: {
      rotate: -35,
      hideOverlappingLabels: true,
    },
  },
  yaxis: {
    labels: {
      formatter: (value: number) => formatCompact(value),
    },
  },
  legend: {
    position: "top",
    horizontalAlign: "left",
  },
  tooltip: {
    shared: true,
    intersect: false,
  },
}));

const channelTotals = computed(() => {
  const totals: Record<ChannelKey, number> = {
    "Organic Search": 0,
    Direct: 0,
    Referral: 0,
    Social: 0,
    Email: 0,
  };

  filteredRows.value.forEach((row) => {
    (Object.keys(totals) as ChannelKey[]).forEach((key) => {
      totals[key] += row.channels[key];
    });
  });

  return totals;
});

const channelChartSeries = computed(() =>
  (Object.keys(channelTotals.value) as ChannelKey[]).map((key) => channelTotals.value[key]),
);

const channelChartOptions = computed(() => ({
  labels: Object.keys(channelTotals.value),
  colors: chartPalette,
  legend: {
    position: "bottom",
    fontSize: "13px",
  },
  dataLabels: {
    enabled: true,
    formatter: (value: number) => `${Math.round(value)}%`,
  },
  stroke: {
    colors: ["#ffffff"],
  },
  plotOptions: {
    pie: {
      donut: {
        size: "62%",
        labels: {
          show: true,
          total: {
            show: true,
            label: "總 sessions",
            formatter: () => formatNumber(currentSummary.value.sessions),
          },
        },
      },
    },
  },
  tooltip: {
    y: {
      formatter: (value: number) => `${formatNumber(value)} sessions`,
    },
  },
}));

const yearRows = computed(() =>
  mockRows.filter((row) => row.date.getFullYear() === selectedYear.value),
);

const yearChartSeries = computed(() => {
  const sessionsByMonth = Array.from({ length: 12 }, () => 0);
  const conversionsByMonth = Array.from({ length: 12 }, () => 0);

  yearRows.value.forEach((row) => {
    const month = row.date.getMonth();
    sessionsByMonth[month] += row.sessions;
    conversionsByMonth[month] += row.conversions;
  });

  return [
    {
      name: "Sessions",
      type: "column",
      data: sessionsByMonth,
    },
    {
      name: "Conversions",
      type: "line",
      data: conversionsByMonth,
    },
  ];
});

const yearChartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    foreColor: "#56606b",
  },
  colors: ["#ffb703", "#bc4749"],
  stroke: {
    width: [0, 3],
    curve: "smooth",
  },
  dataLabels: {
    enabled: false,
  },
  plotOptions: {
    bar: {
      columnWidth: "48%",
      borderRadius: 6,
    },
  },
  grid: {
    borderColor: "rgba(15, 76, 92, 0.12)",
    strokeDashArray: 4,
  },
  xaxis: {
    categories: Array.from({ length: 12 }, (_, index) => `${index + 1} 月`),
  },
  yaxis: [
    {
      labels: {
        formatter: (value: number) => formatCompact(value),
      },
    },
    {
      opposite: true,
      labels: {
        formatter: (value: number) => formatCompact(value),
      },
    },
  ],
  legend: {
    position: "top",
    horizontalAlign: "left",
  },
}));

const topPages = computed(() => {
  const totals = new Map<
    string,
    {
      title: string;
      views: number;
    }
  >();

  filteredRows.value.forEach((row) => {
    row.pages.forEach((page) => {
      const current = totals.get(page.path);
      if (current) {
        current.views += page.views;
        return;
      }

      totals.set(page.path, {
        title: page.title,
        views: page.views,
      });
    });
  });

  return Array.from(totals.entries())
    .map(([path, value]) => ({
      path,
      title: value.title,
      views: value.views,
    }))
    .sort((left, right) => right.views - left.views)
    .slice(0, 6);
});

const topPagesChartSeries = computed(() => [
  {
    name: "Page Views",
    data: topPages.value.map((page) => page.views),
  },
]);

const topPagesChartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    foreColor: "#56606b",
  },
  colors: ["#6a994e"],
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 6,
      distributed: false,
      barHeight: "56%",
    },
  },
  dataLabels: {
    enabled: false,
  },
  grid: {
    borderColor: "rgba(15, 76, 92, 0.12)",
    strokeDashArray: 4,
  },
  xaxis: {
    categories: topPages.value.map((page) => page.title),
    labels: {
      formatter: (value: number) => formatCompact(value),
    },
  },
  tooltip: {
    y: {
      formatter: (value: number) => `${formatNumber(value)} page views`,
    },
  },
}));

const deviceBreakdown = computed(() => {
  const totals: Record<DeviceKey, number> = {
    Mobile: 0,
    Desktop: 0,
    Tablet: 0,
  };

  filteredRows.value.forEach((row) => {
    (Object.keys(totals) as DeviceKey[]).forEach((key) => {
      totals[key] += row.devices[key];
    });
  });

  const totalSessions = Object.values(totals).reduce((sum, value) => sum + value, 0);

  return (Object.keys(totals) as DeviceKey[]).map((key) => ({
    label: key,
    share: Math.round((totals[key] / Math.max(totalSessions, 1)) * 100),
    sessionsLabel: formatNumber(totals[key]),
  }));
});

const insightCards = computed(() => {
  const topChannelEntry = (Object.entries(channelTotals.value) as Array<[ChannelKey, number]>).sort(
    (left, right) => right[1] - left[1],
  )[0];

  const topPage = topPages.value[0];
  const conversionDelta = getDelta(
    currentSummary.value.conversionRate,
    previousSummary.value.conversionRate,
  );

  return [
    {
      tag: "Acquisition",
      title: `${topChannelEntry[0]} 是目前最大流量來源`,
      description: `本區間累積 ${formatNumber(
        topChannelEntry[1],
      )} sessions，正式版可以再往下拆 campaign / source / medium。`,
    },
    {
      tag: "Content",
      title: `${topPage?.title ?? "首頁"} 是最受關注的內容`,
      description: `目前模擬 page views 為 ${formatNumber(
        topPage?.views ?? 0,
      )}，後續可用來判斷哪些頁面需要 CTA 強化。`,
    },
    {
      tag: "Conversion",
      title: `轉換率 ${formatPercent(currentSummary.value.conversionRate)}`,
      description: `相較前一期 ${formatDelta(
        conversionDelta,
      )}。正式串接 GA4 後可改看表單送出、LINE 點擊或補助查詢完成率。`,
    },
  ];
});

function applyPreset(days: number) {
  selectedPreset.value = days;
  dateRange.value = [addDays(today, -(days - 1)), today];
}

function disabledDate(date: Date) {
  return date.valueOf() > today.valueOf() || date.valueOf() < datasetStart.valueOf();
}

async function downloadDashboard() {
  if (!exportRoot.value) return;

  isExporting.value = true;

  try {
    await nextTick();
    const canvas = await html2canvas(exportRoot.value, {
      useCORS: true,
      backgroundColor: "#f6f2ea",
      scale: 1.6,
    });

    const base64 = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `ga4-dashboard-preview-${formatFileDate(today)}.png`;
    link.href = base64;
    link.click();
  } finally {
    isExporting.value = false;
  }
}

function buildMockRows(startDate: Date, totalDays: number): DailyRow[] {
  const pageTemplates = [
    { path: "/", title: "首頁", weight: 1.28 },
    { path: "/subsidy-guide", title: "補助指南", weight: 1.11 },
    { path: "/ifare/policy", title: "i-Fare 補助政策", weight: 0.95 },
    { path: "/ifare/faq", title: "常見問答", weight: 0.82 },
    { path: "/news", title: "最新消息", weight: 0.76 },
    { path: "/contact", title: "聯絡我們", weight: 0.41 },
  ];

  return Array.from({ length: totalDays }, (_, index) => {
    const date = addDays(startDate, index);
    const weekday = date.getDay();
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.84 : 1;
    const seasonalWave = Math.sin(index / 7) * 24 + Math.cos(index / 15) * 16;
    const campaignBoost = index % 48 >= 30 && index % 48 <= 36 ? 28 : 0;
    const activeUsers = Math.round((210 + seasonalWave + campaignBoost + (index % 5) * 5) * weekendFactor);
    const sessions = Math.round(activeUsers * (1.24 + ((index % 6) - 2) * 0.02));
    const newUsers = Math.round(activeUsers * (0.35 + (Math.sin(index / 11) + 1) * 0.045));
    const conversions = Math.max(5, Math.round(sessions * (0.026 + (Math.cos(index / 9) + 1) * 0.006)));
    const engagementSeconds = Math.round(72 + Math.sin(index / 6) * 8 + (weekday === 0 ? -6 : 4));

    const channelRatios = normalizeRatios([
      0.33 + Math.sin(index / 10) * 0.03,
      0.26 + Math.cos(index / 8) * 0.02,
      0.16 + Math.sin(index / 13) * 0.015,
      0.15 + Math.cos(index / 9) * 0.015,
      0.1 + Math.sin(index / 17) * 0.01,
    ]);
    const deviceRatios = normalizeRatios([
      0.66 + Math.sin(index / 14) * 0.02,
      0.27 + Math.cos(index / 12) * 0.02,
      0.07 + Math.sin(index / 10) * 0.01,
    ]);

    const channels = buildMetricMap<ChannelKey>(
      ["Organic Search", "Direct", "Referral", "Social", "Email"],
      sessions,
      channelRatios,
    );
    const devices = buildMetricMap<DeviceKey>(["Mobile", "Desktop", "Tablet"], sessions, deviceRatios);

    const pages = pageTemplates.map((page, pageIndex) => ({
      path: page.path,
      title: page.title,
      views: Math.round(
        sessions * page.weight * (0.34 + pageIndex * 0.035) * (0.92 + Math.sin((index + pageIndex) / 8) * 0.06),
      ),
    }));

    return {
      date,
      activeUsers,
      sessions,
      newUsers,
      conversions,
      engagementSeconds,
      channels,
      devices,
      pages,
    };
  });
}

function summarizeRows(rows: DailyRow[]): SummaryResult {
  if (!rows.length) {
    return {
      activeUsers: 0,
      sessions: 0,
      newUsers: 0,
      conversions: 0,
      avgEngagementSeconds: 0,
      conversionRate: 0,
    };
  }

  const totals = rows.reduce(
    (result, row) => {
      result.activeUsers += row.activeUsers;
      result.sessions += row.sessions;
      result.newUsers += row.newUsers;
      result.conversions += row.conversions;
      result.engagementSeconds += row.engagementSeconds;
      return result;
    },
    {
      activeUsers: 0,
      sessions: 0,
      newUsers: 0,
      conversions: 0,
      engagementSeconds: 0,
    },
  );

  return {
    activeUsers: totals.activeUsers,
    sessions: totals.sessions,
    newUsers: totals.newUsers,
    conversions: totals.conversions,
    avgEngagementSeconds: totals.engagementSeconds / rows.length,
    conversionRate: totals.conversions / Math.max(totals.sessions, 1),
  };
}

function buildMetricMap<T extends string>(keys: T[], total: number, ratios: number[]) {
  const result = {} as Record<T, number>;
  let used = 0;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      result[key] = Math.max(total - used, 0);
      return;
    }

    const value = Math.round(total * ratios[index]);
    result[key] = value;
    used += value;
  });

  return result;
}

function normalizeRatios(values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => value / total);
}

function getInclusiveDayCount(start: Date, end: Date) {
  return Math.max(Math.round((end.valueOf() - start.valueOf()) / 86400000) + 1, 1);
}

function getDelta(current: number, previous: number) {
  if (!previous) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function deltaClass(delta: number) {
  if (delta > 0.1) return "is-up";
  if (delta < -0.1) return "is-down";
  return "is-flat";
}

function formatDelta(delta: number) {
  if (Math.abs(delta) < 0.1) return "0.0%";
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-TW").format(Math.round(value));
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("zh-TW", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDecimal(value: number, digits = 1) {
  return value.toFixed(digits);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(Math.round(seconds), 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remain = safeSeconds % 60;
  return `${minutes} 分 ${remain} 秒`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatMonthDay(date: Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatFileDate(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function isWithinRange(target: Date, start: Date, end: Date) {
  return target.valueOf() >= start.valueOf() && target.valueOf() <= end.valueOf();
}

function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return startOfDay(result);
}
</script>

<style scoped lang="scss">
.analytics-preview {
  display: grid;
  gap: 18px;
  padding-bottom: 28px;
  color: #24303a;
}

.header-subtitle {
  display: inline-flex;
  margin-left: 12px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(232, 93, 4, 0.12);
  color: #a44200;
  font-size: 12px;
  font-weight: 700;
}

.hero-shell,
.filter-shell,
.kpi-card,
.chart-card,
.insight-card,
.device-card {
  overflow: hidden;
  border: 1px solid rgba(14, 48, 62, 0.08);
  box-shadow: 0 24px 60px -40px rgba(18, 38, 49, 0.45);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
  gap: 24px;
  padding: 30px 32px;
  background:
    radial-gradient(circle at top left, rgba(255, 183, 3, 0.24), transparent 34%),
    linear-gradient(135deg, #16323f 0%, #0f4c5c 45%, #f4a261 160%);
  color: #fffdf8;
}

.hero-kicker {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-title {
  margin: 0 0 12px;
  font-size: 34px;
  line-height: 1.15;
}

.hero-desc {
  max-width: 640px;
  margin: 0;
  color: rgba(255, 253, 248, 0.82);
  font-size: 15px;
  line-height: 1.8;
}

.hero-status-grid {
  display: grid;
  gap: 14px;
}

.status-tile {
  display: grid;
  gap: 6px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
}

.status-label {
  font-size: 12px;
  color: rgba(255, 253, 248, 0.72);
}

.status-value {
  font-size: 18px;
  font-weight: 700;
}

.status-note {
  font-size: 12px;
  color: rgba(255, 253, 248, 0.76);
}

.filter-shell {
  padding: 22px 24px 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(250, 247, 241, 0.95)),
    #fff;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 1.6fr) 220px;
  gap: 18px;
  align-items: end;
}

.filter-group {
  display: grid;
  gap: 10px;
}

.filter-label {
  color: #5f6d77;
  font-size: 13px;
  font-weight: 700;
}

.preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preset-chip {
  border: 1px solid rgba(15, 76, 92, 0.14);
  border-radius: 999px;
  background: #ffffff;
  padding: 11px 16px;
  color: #24303a;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.preset-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(232, 93, 4, 0.28);
}

.preset-chip.is-active {
  border-color: transparent;
  background: linear-gradient(135deg, #e85d04, #f4a261);
  color: #fff;
}

.date-range,
.year-select {
  width: 100%;
}

.compare-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed rgba(15, 76, 92, 0.15);
}

.compare-main {
  color: #24303a;
  font-size: 14px;
  font-weight: 700;
}

.compare-sub {
  color: #73818a;
  font-size: 13px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.kpi-card {
  padding: 22px 22px 20px;
  background: #fff;
}

.kpi-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.kpi-label {
  color: #5f6d77;
  font-size: 13px;
  font-weight: 700;
}

.kpi-delta {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.kpi-delta.is-up {
  background: rgba(106, 153, 78, 0.14);
  color: #3c6b22;
}

.kpi-delta.is-down {
  background: rgba(188, 71, 73, 0.12);
  color: #9b2c2f;
}

.kpi-delta.is-flat {
  background: rgba(15, 76, 92, 0.1);
  color: #0f4c5c;
}

.kpi-value {
  display: block;
  margin-top: 20px;
  color: #14232c;
  font-size: 34px;
  line-height: 1.1;
}

.kpi-note {
  margin: 10px 0 0;
  color: #73818a;
  font-size: 13px;
  line-height: 1.7;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.chart-wide {
  grid-column: 1 / -1;
}

.chart-card,
.insight-card,
.device-card {
  padding: 22px 22px 16px;
  background: #fff;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-head h3 {
  margin: 0 0 6px;
  color: #14232c;
  font-size: 22px;
}

.card-head p {
  margin: 0;
  color: #73818a;
  font-size: 13px;
}

.insight-list,
.device-list {
  display: grid;
  gap: 14px;
}

.insight-item {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #fffaf4, #ffffff);
  border: 1px solid rgba(232, 93, 4, 0.1);
}

.insight-tag {
  display: inline-flex;
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(232, 93, 4, 0.12);
  color: #a44200;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.insight-item strong {
  color: #1f2f38;
  font-size: 16px;
}

.insight-item p {
  margin: 0;
  color: #64737d;
  font-size: 13px;
  line-height: 1.75;
}

.device-item {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 18px;
  background: #f8fafb;
}

.device-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #24303a;
}

.device-track {
  width: 100%;
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(15, 76, 92, 0.08);
}

.device-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0f4c5c, #f4a261);
}

.device-item p {
  margin: 0;
  color: #73818a;
  font-size: 13px;
}

:deep(.apexcharts-legend-text) {
  color: #56606b !important;
}

@media (max-width: 1200px) {
  .filter-bar {
    grid-template-columns: 1fr;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .hero-panel,
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-panel,
  .filter-shell,
  .kpi-card,
  .chart-card,
  .insight-card,
  .device-card {
    padding-left: 18px;
    padding-right: 18px;
  }

  .hero-title {
    font-size: 28px;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .header-subtitle {
    display: none;
  }
}
</style>
