# iFare 圖片 alt 與裝飾圖語意規則

> 配合 UIUX #83「全站圖片 alt 與裝飾圖語意規則未統一」收尾。
> 適用範圍:前端 `iFare_Frontend/` 與後台 `iFare_Backend/`。

## 一、為什麼要區分「內容圖」與「裝飾圖」

| 圖片角色 | 給螢幕閱讀器 | 寫法 |
|----------|--------------|------|
| **內容圖**(資訊性) | 朗讀 alt | `<img src="..." alt="描述文字">` |
| **裝飾圖**(視覺) | 跳過 | `<img src="..." alt="">` 或 `aria-hidden="true"` |

寫錯結果:
- 內容圖 alt 寫成 `""` → 視障使用者錯過資訊
- 裝飾圖 alt 寫具體文字 → 噪音(閱讀器朗讀「裝飾圖案」等沒意義詞)

## 二、本專案的判斷標準

### 內容圖(要有 alt)

- **基金會 logo / 合作夥伴 logo** → alt = `"長穩社福基金會 logo"` / `"{夥伴名稱} logo"`
- **政策 / 文章 / 活動 主視覺圖** → alt = 主標題或圖片含意,例如 `"2026 兒少心理健康講座海報"`
- **使用者上傳圖**(動態頁面) → alt = `imageAlt` 欄位(後台讓編輯者填)
- **截圖 / 流程圖 / 圖表** → alt = 該圖傳達的重點,例如 `"申請流程:資格審查 → 文件準備 → 送件 → 審核 → 撥款"`

### 裝飾圖(alt 空或 aria-hidden)

- **CSS background-image** → 不需要 alt(本質就是 CSS 不可讀)
- **icon / 圖示** `<i class="ic-*">` → `aria-hidden="true"`
- **裝飾性插圖、分隔線、底紋** → `<img alt="">` 或 `<i aria-hidden>`
- **緊鄰文字標題的小圖示**(文字已說明清楚) → `aria-hidden="true"`

### 模糊地帶

- **首頁 hero 輪播大圖** → 視為裝飾(因為文字 H1 已說明品牌)
- **新聞列表縮圖** → 視為裝飾(新聞標題已說明)
- **footer 社群 icon** → `aria-label="LINE 官方帳號"` 在 `<a>` 上

## 三、編輯者(後台)實作建議

### PageBuilder / 動態頁面

- `image-text` section:**imageAlt 欄位必填**,後台 form 要提示「若是裝飾圖請留空」
- `hero` section:預設裝飾性,不要求 alt

### 既有頁面已套用的 fallback

`SectionImageText.vue` 在沒填 imageAlt 時的策略:
```ts
const resolvedAlt = computed(() => {
  const alt = (props.section.imageAlt ?? '').trim();
  if (alt) return alt;
  const title = (props.section.title ?? '').trim();
  return title || '';
});
```
1. 有填 imageAlt → 用 imageAlt
2. 沒填 → 用 section.title(段落標題)
3. 都沒 → `""`(視為裝飾)

## 四、檢查清單(PR review 時看)

- [ ] 新增的 `<img>` 都明確標記是內容圖還是裝飾圖
- [ ] 內容圖 alt 不是「圖片」「image」「photo」這種無意義字
- [ ] 內容圖 alt 不超過 125 字元(WCAG 建議)
- [ ] 裝飾圖 `<img alt="">` 或 `aria-hidden="true"`
- [ ] icon `<i>` / SVG 沒有文字內容 → `aria-hidden="true"`
- [ ] icon 是按鈕主體(沒文字 label)→ 父 `<button>` 要有 `aria-label="..."`
- [ ] background-image 上若有文字,文字本身要是 `<h>` / `<p>` 不能是 CSS pseudo-element 偽塞

## 五、自動檢查(未來可加)

可加入 lint rule:
- 禁止 `<img>` 沒有 alt 屬性(即使空也要寫 `alt=""`)
- 內容圖 alt 不能等於檔名(如 `alt="IMG_1234.jpg"`)

工具:
- `eslint-plugin-vuejs-accessibility` 的 `alt-text` rule
- 或 axe-core 自動掃描

---

最後更新:2026-05-25
維護者:Emma Chung
