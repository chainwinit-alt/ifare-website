type WebApiDetailedResult<T = any> = {
  data: T | null;
  error: {
    category?: string;
    status?: number;
    message?: string;
    path?: string;
    method?: 'GET' | 'POST';
  } | null;
};

declare module '#app' {
  interface NuxtApp {
    $WebApiGet: <T = any>(path: string, query?: object) => Promise<T | null>;
    $WebApiPost: <T = any>(path: string, query?: object) => Promise<T | null>;
    $WebApiGetDetailed: <T = any>(path: string, query?: object) => Promise<WebApiDetailedResult<T>>;
    $WebApiPostDetailed: <T = any>(path: string, query?: object) => Promise<WebApiDetailedResult<T>>;
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $WebApiGet: <T = any>(path: string, query?: object) => Promise<T | null>;
    $WebApiPost: <T = any>(path: string, query?: object) => Promise<T | null>;
    $WebApiGetDetailed: <T = any>(path: string, query?: object) => Promise<WebApiDetailedResult<T>>;
    $WebApiPostDetailed: <T = any>(path: string, query?: object) => Promise<WebApiDetailedResult<T>>;
  }
}

export {};
