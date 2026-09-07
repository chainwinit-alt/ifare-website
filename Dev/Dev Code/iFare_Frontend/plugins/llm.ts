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

  /**
   * 串流停滯多久就放棄（毫秒）。
   *
   * fetch 與 reader.read() 都沒有內建逾時：供應商那端卡住時這個 await 永遠不會回來，
   * 呼叫端的 isLoading／isBotTyping 就一直是 true，追問框從此按不動，只能關掉分頁。
   * 這裡改成「距離上一次收到資料超過這個時間就中止」，呼叫端至少走得到錯誤處理。
   * 看間隔而不是總時長：長摘要本來就會跑很久，但正常情況下 chunk 是連續進來的。
   */
  const STREAM_STALL_TIMEOUT_MS = 30000;

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

    // 逾時要能真的把連線切掉，所以自己開一個 controller；呼叫端傳進來的 signal
    // 轉接到它身上，兩邊任何一個中止都會讓 fetch 與 reader 一起結束。
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    let stalled = false;
    let stallTimer: ReturnType<typeof setTimeout> | null = null;

    const clearStallTimer = () => {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = null;
    };
    const armStallTimer = () => {
      clearStallTimer();
      stallTimer = setTimeout(() => {
        stalled = true;
        controller.abort();
      }, STREAM_STALL_TIMEOUT_MS);
    };

    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener("abort", abortFromCaller, { once: true });
    }

    try {
      armStallTimer();
      const response = await fetch("/api/llm/summarize/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
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
        // 收到任何東西就重新計時：卡住的定義是「這一段時間內完全沒有新資料」
        armStallTimer();
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
              // done 另外帶 discard 旗標（見 server/api/llm/summarize/stream.post.ts），
              // 一樣走 onMeta 交給呼叫端判斷這一輪要不要整段丟掉。
              onMeta?.(data);
              if (typeof data?.summary === "string" && data.summary) {
                fullText = data.summary;
                onChunk?.("", fullText);
              }
            } else if (event === "error") {
              console.warn("[LLM][stream]", data);
              // 呼叫端必須知道這一輪是壞掉的：已經逐字長出來的半截草稿不能當成
              // 完整答案顯示，更不能寫進快取。沿用 onMeta 這條既有管道傳回去，
              // 免得為了一個旗標動到 $llm 的對外介面。
              onMeta?.({
                ...(data && typeof data === "object" ? data : { message: String(data ?? "") }),
                streamError: true,
              });
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
    } catch (error: any) {
      // 逾時中止時 fetch／reader 丟的一樣是 AbortError，會跟「呼叫端主動取消」混在一起，
      // 而呼叫端正是靠 name === "AbortError" 決定要不要顯示錯誤。換成看得出是逾時的錯誤，
      // 停滯才不會被當成使用者自己取消而靜靜吞掉。
      if (stalled) throw new Error("LLM stream stalled and was aborted.");
      throw error;
    } finally {
      clearStallTimer();
      signal?.removeEventListener("abort", abortFromCaller);
    }
  };

  return {
    provide: {
      llm: {
        streamSummarizeCases,
      },
    },
  };
});
