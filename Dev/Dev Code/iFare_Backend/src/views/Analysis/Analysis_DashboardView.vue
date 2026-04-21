<template>
  <main-header>
    <template #btnsRight>
      <el-button
        :icon="Download"
        type="primary"
        size="large"
        :loading="isImgDownload"
        @click="DownloadChartImg"
        >資料下載</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div class="section-card-analysis" id="downloadImg" ref="downloadImg">
      <div class="section-row">
        <div class="section-main-card card-analysis data-ttl">
          <div class="card-info">
            <div class="item-group">
              <div class="item-info">
                <h5 class="ttl-today item-title">當日流量</h5>
                <span class="ttl-today item-date">{{ currentDate }}</span>
              </div>
              <div class="item-info">
                <label class="ttl-today ttl-people">人數</label>
                <span class="ttl-today ttl-people ttl-num">{{
                  currentPeopleNum
                }}</span>
              </div>
              <div class="item-info">
                <label class="ttl-today ttl-visits">次數</label>
                <span class="ttl-today ttl-visits ttl-num">{{
                  currentVisitNum
                }}</span>
              </div>
            </div>
            <div class="item-group">
              <div class="item-info">
                <h5 class="ttl-all item-title">總流量</h5>
                <span class="ttl-all item-date">{{ ttlStartDate }}</span>
              </div>
              <div class="item-info">
                <label class="ttl-all ttl-people">人數</label>
                <span class="ttl-all ttl-people ttl-num">{{
                  ttlPeopleNum
                }}</span>
              </div>
              <div class="item-info">
                <label class="ttl-all ttl-visits">次數</label>
                <span class="ttl-all ttl-visits ttl-num">{{
                  ttlVisitNum
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="section-main-card card-analysis data-year">
          <div class="card-info">
            <div class="item-head">
              <div class="item-info">
                <h5 class="year-all item-title">每年流量 (每月狀況)</h5>
                <div class="ttl-all item-date" v-show="!isImgDownload">
                  <el-select v-model="selectYear" class="p-select" size="large">
                    <el-option
                      v-for="item in selectYearList"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </el-select>
                </div>
                <div class="ttl-all item-date" v-show="isImgDownload">
                  <label>{{ selectYear }}</label>
                </div>
              </div>
            </div>
            <div class="item-chart">
              <apexchart
                type="line"
                height="240"
                :options="chartOptionsYear"
                :series="seriesDataYear"
                v-if="seriesDataYear && seriesDataYear.length"
              ></apexchart>
            </div>
          </div>
        </div>
      </div>
      <div class="section-row">
        <div class="section-main-card card-fullsize card-analysis data-search">
          <div class="card-info">
            <div class="item-head">
              <div class="item-info">
                <h5 class="year-all item-title">流量查詢</h5>
                <div class="ttl-all item-date" v-show="!isImgDownload">
                  <el-date-picker
                    v-model="datepicker_select"
                    class="m-datepicker-range"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="起始日期"
                    end-placeholder="結束日期"
                    :disabled-date="disabledDate"
                    :clearable="false"
                  />
                </div>
                <div class="ttl-all item-date" v-show="isImgDownload">
                  <label
                    >{{
                      $CommonLib.Date.GetFormatDateString(datepicker_select[0])
                    }}
                    至
                    {{
                      $CommonLib.Date.GetFormatDateString(datepicker_select[1])
                    }}</label
                  >
                </div>
              </div>
            </div>
            <div class="item-chart">
              <apexchart
                type="line"
                height="240"
                :options="chartOptions"
                :series="seriesData"
                v-if="seriesData && seriesData.length"
              ></apexchart>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { ref, reactive, getCurrentInstance, watch, nextTick } from "vue";
import { ElSelect, ElDatePicker, ElButton } from "element-plus";
import { Download } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user";
import MainHeader from "@/components/MainHeader.vue";
import html2canvas from "html2canvas";

const props = defineProps(["searchMode"]);

const app = getCurrentInstance();
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const $CommonLib = app?.appContext.config.globalProperties.$CommonLib;
const userStore = useUserStore();

const _d = new Date();

const datepicker_select: any = ref([
  new Date(new Date().setDate(new Date().getDate() - 15)),
  new Date(),
]);
const selectYear = ref(_d.getFullYear());

// download img options
const downloadImg = ref();
const isImgDownload = ref(false);

const currentDate = ref("");
const currentPeopleNum = ref(0);
const currentVisitNum = ref(0);
const ttlStartDate = ref("");
const ttlPeopleNum = ref(0);
const ttlVisitNum = ref(0);
const selectYearList = reactive<Array<number>>([]);

// Apexchart Data
const seriesDataYear = reactive<Array<any>>([]);
const seriesData = reactive<Array<any>>([]);

// Apexchart options
const chartOptionsYear = ref({
  chart: {
    type: "line",
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
    animations: {
      enabled: true,
      easing: "easeinout",
      speed: "800",
      animateGradually: {
        enabled: true,
        delay: 150,
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350,
      },
    },
  },
  stroke: {
    width: [0, 4],
  },
  title: {
    text: "",
  },
  dataLabels: {
    enabled: true,
    enabledOnSeries: [1],
  },
  labels: [],
  xaxis: {
    type: "string",
  },
  yaxis: [
    {
      title: {
        text: "",
      },
    },
    {
      opposite: true,
      title: {
        text: "",
      },
    },
  ],
  legend: {
    show: false,
  },
});
const chartOptions = ref({
  chart: {
    type: "line",
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
    animations: {
      enabled: true,
      easing: "easeinout",
      speed: "800",
      animateGradually: {
        enabled: true,
        delay: 150,
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350,
      },
    },
  },
  stroke: {
    width: [0, 4],
  },
  title: {
    text: "",
  },
  dataLabels: {
    enabled: true,
    enabledOnSeries: [1],
  },
  labels: [],
  xaxis: {
    type: "string",
  },
  yaxis: [
    {
      title: {
        text: "",
      },
    },
    {
      opposite: true,
      title: {
        text: "",
      },
    },
  ],
  legend: {
    show: false,
  },
});

watch(datepicker_select, (newS, oldS) => {
  console.log(newS);
  const _dRange = newS;
  WebAPI_VisitorChartData(
    undefined,
    $CommonLib.Date.GetFormatDateString(_dRange[0]),
    $CommonLib.Date.GetFormatDateString(_dRange[1])
  );
});
watch(selectYear, (newY, oldY) => {
  WebAPI_VisitorChartData(newY);
});

function WebAPI_VisitorSummary() {
  $WebAPI.GetVisitorSummary(userStore.token, (res: any) => {
    console.log(res);
    let _resData = res.data || "error";
    if (_resData == "error") return console.error(`API res ${_resData}`);

    let _res = _resData.result;

    if (_res.errCode != 0) return console.error(_res.errMsg);
    currentDate.value = _res.result.currentDate;
    currentPeopleNum.value = _res.result.currentPeople;
    currentVisitNum.value = _res.result.currentVisits;
    ttlStartDate.value = _res.result.ttlStartDate;
    ttlPeopleNum.value = _res.result.ttlPeople;
    ttlVisitNum.value = _res.result.ttlVisits;
    const dCurrent = new Date(_res.result.ttlStartDate);
    const dTTLStart = new Date(_res.result.ttlStartDate);
    for (
      let y = 0;
      y <= dCurrent.getFullYear() - dTTLStart.getFullYear();
      y++
    ) {
      selectYearList.push(dTTLStart.getFullYear() + y);
    }
  });
}

function WebAPI_VisitorChartData(
  _selectYear?: number,
  _startDate?: string,
  _endDate?: string
) {
  $WebAPI.GetVisitorChartData(
    userStore.token,
    _selectYear,
    _startDate,
    _endDate,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      if (_selectYear) {
        console.log("_selectYear");
        chartOptionsYear.value = {
          ...chartOptionsYear.value,
          labels: _res.result.labelXList,
        };
        seriesDataYear.splice(0);
        seriesDataYear.push(
          ...[
            {
              name: "次數",
              type: "column",
              data: _res.result.visitsNumList,
            },
            {
              name: "人數",
              type: "line",
              data: _res.result.peopleNumList,
            },
          ]
        );
      }

      if (_startDate && _endDate) {
        console.log("_startDate && _endDate");
        chartOptions.value = {
          ...chartOptions.value,
          labels: _res.result.labelXList,
        };
        seriesData.splice(0);
        seriesData.push(
          ...[
            {
              name: "次數",
              type: "column",
              data: _res.result.visitsNumList,
            },
            {
              name: "人數",
              type: "line",
              data: _res.result.peopleNumList,
            },
          ]
        );
      }
    }
  );
}

function disabledDate(_dTime: Date) {
  return _dTime.valueOf() > Date.now();
}

function DownloadChartImg() {
  isImgDownload.value = true;
  nextTick(() => {
    html2canvas(downloadImg.value, { useCORS: true }).then((canvas) => {
      const base64 = canvas
        .toDataURL()
        .replace(/^data:image\/(png|jpg);base64,/, "");
      const base64Img = `data:image/png;base64,${base64}`;
      downloadBase64(base64Img, "資料分析");
      isImgDownload.value = false;
    });
  });
}

function downloadBase64(content: string, fileName: string) {
  let base64ToBlob = (code: any) => {
    let parts = code.split(";base64,");
    let contentType = parts[0].split(":")[1];
    let raw = window.atob(parts[1]);
    let rawLength = raw.length;
    let uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; i++) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], {
      type: contentType,
    });
  };

  let aLink = document.createElement("a");
  let blob = base64ToBlob(content);
  aLink.download = `${fileName}.png`;
  aLink.href = URL.createObjectURL(blob);
  aLink.click();
}

WebAPI_VisitorSummary();
WebAPI_VisitorChartData(_d.getFullYear());
WebAPI_VisitorChartData(
  undefined,
  $CommonLib.Date.GetFormatDateString(new Date(_d.setDate(_d.getDate() - 15))),
  $CommonLib.Date.GetFormatDateString(new Date())
);
</script>
