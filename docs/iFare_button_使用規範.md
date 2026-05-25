# iFare 前端按鈕使用規範

> 配合 UIUX #74「按鈕樣式分散無統一規範」收尾。
> 適用範圍:`iFare_Frontend/` 前端網站。
> 後台 (`iFare_Backend/`) 用 Element Plus,另有自己的規範。

## 一、按鈕分類

依「視覺權重」分為 3 級:**主要 CTA / 次要動作 / 弱化動作**;依「用途語意」分為 6 類。

### 視覺權重(從強到弱)

| 等級 | 樣式 | 用途 |
|------|------|------|
| **L1 主要 CTA** | 填色背景 + 白字 + 圓角 + 陰影 | 一頁只該有 1 個(送出表單、搜尋、加入好友、開啟主要服務) |
| **L2 次要** | 框線 + 主色字 + 圓角 | 跟主 CTA 並列的選項(取消、了解更多) |
| **L3 弱化** | 純文字 + 主色或灰色 + 底線 hover | 跳轉連結、輔助動作(重新整理、清除、復原) |

### 用途語意對照(現有 class 角色)

| Class | 等級 | 用途 | 顏色語意 | 範例位置 |
|-------|------|------|----------|---------|
| `.btn-ifare-start` | L1 | 首頁主 CTA 進入 ifare | brand-primary(橘) | 首頁 hero |
| `.btn-filter` | L1 | 搜尋按鈕 | brand-primary | ifare 搜尋表單 |
| `.btn-social.btn-line` | L1 | LINE 加好友 | LINE 綠 | Footer / Callout |
| `.btn-social.btn-facebook` | L1 | FB 追蹤 | FB 藍 | Footer |
| `.btn-more` | L2 | 列表「更多」 | text 主色 + 邊框 | news / articles |
| `.btn-tag` | L3 | 標籤切換 | brand-primary 透明 | tags 篩選 |
| `.btn-icon` | L3 | 純 icon 按鈕 | 灰底 + 主色 hover | share / close |
| `.btn-reset` | L3 | 清除/重置文字連結 | text muted + 底線 | filter |
| `.btn-retry` | L2 | 錯誤重試 | 框線 | empty/error state |
| `.btn-page-prev/next` | L3 | 分頁箭頭 | 灰 + hover 主色 | CompPage |
| `.btn-select-close` | L3 | dialog 關閉 | text muted | CompSelect 內 |
| `.btn-clear-query` | L3 | input 內清空 X | text muted | ifare 搜尋輸入框 |

## 二、新增按鈕的判斷流程

```
新增按鈕
  ├─ 是「這頁的主要動作」?(送出、加入、開啟服務)
  │     └─ Yes → L1 + 用 brand-primary / 對應社群色 / 對應 state 色
  │
  ├─ 是「次要選擇」?(取消、了解更多、其他選項)
  │     └─ Yes → L2 框線樣式
  │
  └─ 是「輔助動作」?(連結、清除、重試)
        └─ Yes → L3 純文字或 icon
```

## 三、視覺一致性檢查清單(PR review 用)

- [ ] 按鈕 padding 用 `$space-xs` ~ `$space-lg` token,不要 5px / 7px 等奇怪值
- [ ] 按鈕圓角用 `$radius-sm` (一般)/ `$radius-pill` (chip / 圓潤按鈕) token
- [ ] 字級用 `$fs-sm` ~ `$fs-md`,字重 `$fw-medium` 或 `$fw-bold`
- [ ] transition 用 `$duration-normal` + `$ease-out`,不要硬編碼
- [ ] 顏色用語意 token(`$color-brand-primary` 等),不用視覺命名(`$color-orange`)
- [ ] hover / focus-visible 兩種狀態都要有(無障礙)
- [ ] 主 CTA 加 `box-shadow: $shadow-cta` 視覺浮起
- [ ] 行動裝置 min-height: 44px(可點擊區域)

## 四、不要再做的事(已知反模式)

❌ 各 component 自己 inline 寫 `color: #ea5504; background: #fff; padding: 5px 10px`
✅ 改成 class + 引用 token 變數

❌ 同樣動作出現 3 種顏色(例如「送出」按鈕散落:橘 / 藍綠 / 紅)
✅ 主 CTA 統一橘(`$color-brand-primary`),例外才用其他顏色

❌ icon-only 按鈕沒 aria-label
✅ 必須有 `aria-label="..."` 或 `title="..."`

❌ 按鈕在不同頁面 hover 效果不一(有的浮起、有的變色、有的什麼都沒)
✅ 統一用 `@include island-hover` mixin 或共用 hover 規則(`_main.scss` 已定義 `data-island-style="button"`)

## 五、未來重整建議

當有時間重整時,可考慮:
1. 抽 `_button.scss` 集中所有按鈕樣式,各頁面只使用 class 不重複定義
2. 建 `<AppButton>` Vue 元件 wrap 上述 class + 提供 props(`variant="primary"` 等)
3. 加 Storybook / Figma 對照,設計與工程同源

---

最後更新:2026-05-25
維護者:Emma Chung
