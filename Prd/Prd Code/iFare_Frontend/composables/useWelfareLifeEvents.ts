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
