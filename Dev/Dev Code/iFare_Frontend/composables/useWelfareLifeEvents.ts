/**
 * 目前狀態：尚未接線（截至 2026-08-26）
 * 全站 pages / components / layouts / app.vue / error.vue 全域搜尋皆無呼叫端，
 * 這支 composable 目前不會被執行。
 *
 * 它原本要做什麼：提供以「人生事件」為入口的福利查詢捷徑。
 * 內建生育／失業／照顧／長照／身障／就學六個寫死的選項，每筆都備好顯示名稱、
 * 一句說明文案，以及一組事先寫好的搜尋關鍵字（query）——重點在於使用者不必自己想搜尋詞，
 * 點一下就能帶著關鍵字直接送出查詢；
 * getLifeEventByKey 則是給網址參數（例如 ?event=birth）反查該筆設定用的。
 *
 * 保留原因：使用者決定保留。這是規劃中尚未接上的功能，不是廢棄程式碼，
 * 日後要在首頁或搜尋頁放「人生階段」入口時可直接沿用，請勿因為「查無呼叫端」就刪掉。
 */
export interface WelfareLifeEvent {
  key: string;
  name: string;
  description: string;
  query: string;
}

const welfareLifeEvents: WelfareLifeEvent[] = [
  {
    key: 'birth',
    name: '生育',
    description: '懷孕、生產、育兒與托育補助',
    query: '生育 育兒 托育 補助',
  },
  {
    key: 'unemployment',
    name: '失業',
    description: '待業、轉職、急難與就業支持',
    query: '失業 就業 急難 補助',
  },
  {
    key: 'care',
    name: '照顧',
    description: '家庭照顧、兒少照顧與照顧者支持',
    query: '照顧 兒少 家庭 支持',
  },
  {
    key: 'longterm-care',
    name: '長照',
    description: '高齡、失能與長期照顧服務',
    query: '長照 高齡 失能 照顧',
  },
  {
    key: 'disability',
    name: '身障',
    description: '身心障礙生活、照顧與服務資源',
    query: '身障 身心障礙 補助 服務',
  },
  {
    key: 'school',
    name: '就學',
    description: '學費、助學、教育與學習支持',
    query: '就學 助學 教育 學費',
  },
];

export function useWelfareLifeEvents() {
  const getLifeEventByKey = (key: string | null | undefined) =>
    welfareLifeEvents.find((event) => event.key === key) ?? null;

  return {
    welfareLifeEvents,
    getLifeEventByKey,
  };
}
