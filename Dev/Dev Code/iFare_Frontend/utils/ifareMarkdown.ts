/**
 * 模型輸出的 Markdown → HTML。
 *
 * 這段區塊解析原本只長在 IfareSummaryCard 裡。政策明細頁也要顯示模型回覆之後，
 * 與其把七十幾行的解析邏輯複製第二份（兩邊遲早會走鐘），改成把「區塊怎麼切」抽出來共用，
 * 「行內怎麼渲染」留給呼叫端決定——摘要卡要把 [參考 N] 變成可點的連結，
 * 明細頁只有一筆政策、引用編號沒有意義，直接拆掉。
 */

export function escapeHtml(value: string) {
  return (value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** 粗體、斜體、行內程式碼、外部連結。不處理引用編號 */
export function applyBasicInlineMarkdown(text: string) {
  const withLinks = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_match, label, url) =>
      `<a class="summary-inline-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
  );
  const withStrong = withLinks.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const withEm = withStrong.replace(/(^|[^*])\*(?!\s)(.+?)(?!\s)\*(?!\*)/g, "$1<em>$2</em>");
  return withEm.replace(/`([^`]+)`/g, "<code>$1</code>");
}

/**
 * 明細頁用的行內渲染：先跳脫、拆掉引用編號，再套基本標記。
 * 只有一筆政策時 [參考 1] 指的就是使用者正在看的這一頁，留著只是雜訊。
 */
export function renderInlineMarkdownWithoutReferences(text: string) {
  const withoutReferences = escapeHtml(text || "")
    .replace(/\s*[\[［]\s*參考\s*[\d\s,、和及]*[\]］]/gu, "")
    .replace(/\s+([。，、！？])/gu, "$1");
  return applyBasicInlineMarkdown(withoutReferences);
}

/**
 * 把已經正規化過的 Markdown 切成段落 / 清單 / 標題。
 * @param inline 每一行的行內渲染函式，需自行負責 HTML 跳脫
 */
export function renderMarkdownBlocks(source: string, inline: (text: string) => string) {
  // CRLF 先正規化成 LF，呼叫端就不必各自處理
  const CR = String.fromCharCode(13);
  const LF = String.fromCharCode(10);
  const trimmed = (source || "").split(CR + LF).join(LF).split(CR).join(LF).trim();
  if (!trimmed) return "";

  const blocks: string[] = [];
  const lines = trimmed.split("\n");
  let paragraph: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${paragraph.join("<br>")}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) {
      listType = null;
      listItems = [];
      return;
    }
    blocks.push(`<${listType}>${listItems.join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const unordered = line.match(/^[-*+]\s+(.*)$/);
    const ordered = line.match(/^\d+[.)]\s+(.*)$/);

    if (unordered || ordered) {
      flushParagraph();
      const nextType: "ul" | "ol" = unordered ? "ul" : "ol";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      const match = unordered || ordered;
      listItems.push(`<li>${inline(match![1])}</li>`);
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      // 模型偶爾會寫成「### ### 站內相符的福利」，多出來的記號要拆掉，
      // 不然標題會連 ### 一起顯示出來。已經存進快取的舊內容也靠這一步救回來。
      const headingText = heading[1].replace(/^(?:#{1,6}\s*)+/u, "");
      blocks.push(`<h4 class="summary-section-title">${inline(headingText)}</h4>`);
      continue;
    }

    flushList();
    paragraph.push(inline(line));
  }

  flushParagraph();
  flushList();

  if (!blocks.length) return `<p>${inline(trimmed)}</p>`;
  return blocks.join("");
}
