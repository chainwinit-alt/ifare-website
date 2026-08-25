export default defineNuxtPlugin(() => {
  type ProviderName = "openai" | "gemini" | "groq" | "ollama";
  type SummarySearchContext = {
    policy?: string;
    recipient?: string;
    area?: string;
    income?: string;
    identity?: string;
    query?: string;
  };

  type SummaryCaseItem = {
    id: number;
    title: string;
    area: string;
    qualification: string;
    hasRecipient: boolean;
    hasIncome: boolean;
    hasIndentity: boolean;
  };

  const parseSseBlock = (block: string) => {
    const lines = block.split(/\r?\n/);
    let event = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim() || "message";
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    const dataText = dataLines.join("\n");
    let data: any = dataText;
    try {
      data = JSON.parse(dataText);
    } catch (_) {
      // Keep plain text payloads as-is.
    }

    return { event, data };
  };

  const summarizeCases = async (payload: {
    query?: string;
    context?: SummarySearchContext;
    cases: SummaryCaseItem[];
    conversation?: Array<{ role: "user" | "assistant"; content: string }>;
    /** 追問問到目前條件以外的範圍時，前端查回來的真實筆數 */
    scopeHint?: { field: string; label: string; value: string; count: number } | null;
    /** 使用者按了「重新摘要」：跳過伺服器端快取 */
    refresh?: boolean;
    provider?: ProviderName;
  }) => {
    return await $fetch("/api/llm/summarize", {
      method: "POST",
      body: payload,
    });
  };

  const streamSummarizeCases = async (payload: {
    query?: string;
    context?: SummarySearchContext;
    cases: SummaryCaseItem[];
    conversation?: Array<{ role: "user" | "assistant"; content: string }>;
    provider?: ProviderName;
    /** 政策明細頁：畫面上只有這一筆，每一輪都當成在問它 */
    focusPolicy?: boolean;
    onChunk?: (chunk: string, fullText: string) => void;
    onMeta?: (meta: any) => void;
    signal?: AbortSignal;
  }) => {
    const { onChunk, onMeta, signal, ...body } = payload;

    const response = await fetch("/api/llm/summarize/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`LLM stream request failed with status ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!response.body || !contentType.includes("text/event-stream")) {
      const data = await response.json();
      if (typeof data?.summary === "string" && data.summary) {
        onChunk?.(data.summary, data.summary);
        return data.summary as string;
      }
      return "";
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);

        if (block) {
          const { event, data } = parseSseBlock(block);
          if (event === "chunk") {
            const delta = typeof data?.delta === "string" ? data.delta : "";
            if (delta) {
              fullText += delta;
              onChunk?.(delta, fullText);
            }
          } else if (event === "meta") {
            onMeta?.(data);
          } else if (event === "done") {
            // done 也帶 provider/model：供應商全掛時是 fallback/script。伺服器端降級
            // 只推 done、不會再推一個 meta，若不在這裡把它轉給 onMeta，前端就無從得知
            // 這份摘要是本地腳本拼的、而非模型寫的（摘要卡靠這個顯示「非 AI 生成」）。
            onMeta?.(data);
            if (typeof data?.summary === "string" && data.summary) {
              fullText = data.summary;
              onChunk?.("", fullText);
            }
          } else if (event === "error") {
            console.warn("[LLM][stream]", data);
          }
        }

        boundary = buffer.indexOf("\n\n");
      }
    }

    const tail = buffer.trim();
    if (tail) {
      const { event, data } = parseSseBlock(tail);
      if (event === "chunk") {
        const delta = typeof data?.delta === "string" ? data.delta : "";
        if (delta) {
          fullText += delta;
          onChunk?.(delta, fullText);
        }
      } else if (event === "meta") {
        onMeta?.(data);
      }
    }

    return fullText;
  };

  return {
    provide: {
      llm: {
        summarizeCases,
        streamSummarizeCases,
      },
    },
  };
});
