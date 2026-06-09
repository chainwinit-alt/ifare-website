# iFare IP 互動流程


## 文件目的

這份文件是給接手前台互動的人看的，重點不是只說「IP 會動、會說話」，而是要說清楚目前這套 IP 互動是怎麼接起來的、資料從哪裡來、事件怎麼流、未來要加功能應該改哪裡。

目前這套 IP 並不是獨立 widget，而是綁在前台「智慧小幫手」入口旁的互動角色。它同時負責：

1. 待機巡邏與簡單角色演出
2. 泡泡文案輪播
3. 依頁面元素 hover/focus 說明功能
4. 拖曳互動
5. 配合智慧小幫手開關切換站姿 / 坐姿文案

## 相關檔案總覽

### 核心元件

- `Dev/Dev Code/iFare_Frontend/components/CompChatbotEntry.vue`
- `Dev/Dev Code/iFare_Frontend/components/CompChatbotMascot.vue`
- `Dev/Dev Code/iFare_Frontend/components/CompChatbotWelcome.vue`

### 已接入 IP 提示的主要頁面

- `Dev/Dev Code/iFare_Frontend/pages/ifare.vue`
- `Dev/Dev Code/iFare_Frontend/pages/ifare/result.vue`
- `Dev/Dev Code/iFare_Frontend/pages/about.vue`
- `Dev/Dev Code/iFare_Frontend/pages/news.vue`
- `Dev/Dev Code/iFare_Frontend/pages/articles.vue`
- `Dev/Dev Code/iFare_Frontend/pages/collaborator.vue`

## 整體分工

### `CompChatbotEntry.vue`

這個元件是整組入口的外層容器，主要責任是：

1. 控制智慧小幫手目前是否開啟
2. 決定入口按鈕和 IP 是否要一起呈現
3. 把 `isOpen` 傳給 `CompChatbotMascot`
4. 控制入口按鈕本身的 `data-mascot-tip`

這層不處理複雜動畫，也不處理泡泡邏輯。它比較像是「入口總控」。

目前 `isOpen` 是：

```ts
const isOpen = defineModel<boolean>('open', { default: false });
```

也就是說，外部如果控制這個 model，IP 狀態會跟著一起切。

### `CompChatbotMascot.vue`

這是整套 IP 的核心。角色本體、泡泡、拖曳、巡邏、泡泡輪播、頁面 hover 提示，幾乎都在這裡。

這層負責：

1. 根據 `isOpen` 決定站姿 / 坐姿文案
2. 顯示目前要說的泡泡內容
3. 接收 `data-mascot-tip` 並覆蓋預設文案
4. 管理拖曳狀態與回位動畫
5. 管理底部巡邏節奏

### `CompChatbotWelcome.vue`

這是智慧小幫手打開後的內容區。它本身不是 IP 邏輯核心，但很多互動點已經加了 `data-mascot-tip`，所以會直接影響 IP 泡泡顯示什麼。

目前這層已經接上提示的互動包含：

- 清除對話
- 關閉視窗
- 模式切換
- 快捷操作按鈕
- 建議 chip
- 輸入框
- 送出按鈕

## IP 泡泡文案機制

### 兩組文案來源

`CompChatbotMascot.vue` 目前有兩組固定文案：

- `bubbleMessages`
- `seatedBubbleMessages`

用途如下：

- `bubbleMessages`：站著、待機、巡邏時使用
- `seatedBubbleMessages`：智慧小幫手打開後，角色切到坐下狀態時使用

目前是透過 `props.isOpen` 決定使用哪一組：

```ts
const currentBubbleMessages = computed(() =>
  props.isOpen ? seatedBubbleMessages : bubbleMessages,
);
```

所以如果之後要調整「打開聊天面板後 IP 說什麼」，通常不是去改一般泡泡，而是改 `seatedBubbleMessages`。

### 實際畫面顯示哪一句

目前顯示中的文案是：

```ts
const activeBubbleMessage = computed(() =>
  hoverTip.value || currentBubbleMessages.value[activeBubbleIndex.value],
);
```

這裡有一個很重要的優先序：

1. 如果 `hoverTip` 有值，優先顯示 `hoverTip`
2. 如果 `hoverTip` 沒值，才顯示目前輪播到的泡泡文案

也就是說，只要使用者正在 hover 某個有提示的元素，預設輪播會被暫時蓋掉。

### 泡泡輪播節奏

泡泡輪播由 `startBubbleLoop()` 控制，目前每 `3600ms` 切下一句。

這個輪播是持續循環的，只是當 `hoverTip` 有值時，畫面上看起來像「被插話」。實際上輪播 index 還是照跑。

### 開關聊天面板時的重置

目前有這段監聽：

```ts
watch(() => props.isOpen, () => {
  activeBubbleIndex.value = 0
})
```

這代表：

- 關掉聊天面板，回到站姿時，從 `bubbleMessages[0]` 重新開始
- 打開聊天面板，切到坐姿時，從 `seatedBubbleMessages[0]` 重新開始

這樣做的好處是，使用者每次切換狀態，第一句都會比較可預期，不會接在上一次的中途句子。

## IP 導覽提示機制

### 核心觀念

這套「IP 會告訴你這個按鈕做什麼」的功能，不是模型自己看懂畫面，也不是根據按鈕文字自動生成。它完全是資料驅動：

- 頁面元素自己提供提示字串
- IP 只負責偵測目前滑到哪裡
- 然後把那段字顯示在泡泡上

所以維護上最重要的一件事是：

如果某個新功能要讓 IP 能說明，就在對應元素上加 `data-mascot-tip`。

### 觸發來源

`CompChatbotMascot.vue` 會監聽整個 document / window 層級的互動，核心是透過目標元素往上找：

```ts
target.closest<HTMLElement>('[data-mascot-tip]')
```

目前有處理的事件包含：

- `mouseover`
- `mouseout`
- `focusin`
- `focusout`

這樣做的目的，是同時支援：

- 滑鼠移入移出
- 鍵盤 tab focus

### 流程

當使用者滑入一個元素時，流程大致如下：

1. 事件觸發
2. 取出目前 target
3. 往上找最近的 `[data-mascot-tip]`
4. 如果找到，就把 `dataset.mascotTip` 寫進 `hoverTip`
5. 泡泡改顯示 `hoverTip`

移出時則會：

1. 檢查 `relatedTarget`
2. 如果下一個目標仍然在另一個有 `data-mascot-tip` 的元素內，就直接切換成下一段提示
3. 如果沒有，就把 `hoverTip` 清空
4. 畫面回到預設泡泡輪播

這一段邏輯的好處是，使用者在多個可提示按鈕之間移動時，泡泡不會一直閃成空白，再重出一句，而是能比較順地切換。

### 目前已接入的地方

#### 入口與小幫手本體

- `CompChatbotEntry.vue`
- `CompChatbotWelcome.vue`

#### 前台頁面

- `ifare.vue`
- `ifare/result.vue`
- `about.vue`
- `news.vue`
- `articles.vue`
- `collaborator.vue`

這些頁面目前已經把主要 CTA、搜尋欄位、卡片、篩選或部分操作按鈕接上了提示，但不是代表整站每一個元素都已經覆蓋。

### 新功能要怎麼接 IP 提示

最簡單的方式就是直接在元素上補：

```html
<button data-mascot-tip="點這裡會送出目前搜尋條件。">
```

如果元素是 component wrapper，原則上要確認最終 render 出來的 DOM 上真的有這個 attribute。

### 維護注意事項

1. `data-mascot-tip` 的字串長度不要太長，不然泡泡會難讀。
2. 文字盡量寫成「點了會發生什麼」，不要只寫元件名稱。
3. 如果是同一區塊的多個按鈕，盡量讓提示有區別，不然使用者會覺得 IP 一直在說重複的話。

## 拖曳互動流程

### 核心目標

拖曳這個功能的設計目標不是把 IP 當成一般 draggable icon，而是要有「把角色拎起來」的感覺。因此程式不只處理位置移動，還有額外處理：

- 角色被拉起來的位移
- 手腳垂吊晃動
- 放手後慢慢回家

### 主要狀態欄位

`CompChatbotMascot.vue` 內跟拖曳最相關的狀態包含：

- `dragOffsetX`
- `dragOffsetY`
- `dragSwingX`
- `dragSwingY`
- `dragLift`
- `activePointerId`

可大致理解成：

- `dragOffsetX/Y`：角色目前被拖離原位多少
- `dragSwingX/Y`：拖曳時手腳和身體的晃動量
- `dragLift`：被拎起來的上提感
- `activePointerId`：目前是哪一個 pointer 在控制拖曳

### 拖曳開始

角色根節點目前是：

```vue
@pointerdown="handleDragStart"
```

`handleDragStart(event: PointerEvent)` 會做幾件事：

1. 記錄目前控制拖曳的 `pointerId`
2. 計算拖曳起點
3. 進入拖曳狀態
4. 呼叫 `setPointerCapture(event.pointerId)`
5. 在可取消時 `preventDefault()`

`setPointerCapture` 很重要，因為它能確保即使手指或滑鼠拖出角色本體範圍，後續事件還是能穩定回到這個元素。

### 拖曳移動

目前移動主要由 `handlePointerMove(event)` 處理，掛在：

- `pointermove`
- `mousemove`

這裡同時保留 `pointermove` 和 `mousemove`，是為了兼顧不同輸入情境。不過邏輯上真正主要依賴的是 pointer flow。

在 move 階段會做的事情包含：

1. 檢查 `event.pointerId` 是否等於 `activePointerId`
2. 更新 `dragOffsetX/Y`
3. 計算 `dragSwingX/Y`
4. 計算 `dragLift`
5. 在可取消時 `preventDefault()`

所以角色不是只平移，而是會根據拖動方向一起改變姿態。

### 拖曳結束

目前結束事件掛在：

- `pointerup`
- `pointercancel`
- `mouseup`

`handleDragEnd(event?)` 主要做：

1. 檢查是不是目前那支 active pointer
2. 釋放 `releasePointerCapture(event.pointerId)`
3. 把 `activePointerId` 清掉
4. 結束拖曳狀態
5. 觸發 `animateReturnToHome()`

### 放手後回原位

放手後不會直接瞬移回原本位置，而是跑 `animateReturnToHome()`。

這段邏輯目前的設計方向是：

1. 每 frame 逐步把 `dragOffsetX/Y` 拉回 0
2. 回位速度維持固定步進感
3. `dragSwingX/Y`、`dragLift` 逐步衰減
4. 回到原位後恢復一般待機巡邏

目前固定步進值是：

```ts
2.6
```

因此它看起來會像慢慢走回去，不是吸附回去。

### 為什麼手機版之前會壞

之前手機版拖曳問題的根本原因，是事件鏈混用了：

- 起手用 `pointerdown`
- 但中途或收尾過度依賴 `mousemove` / `mouseup`

在 touch 情境下，這很容易導致：

- 拖曳中斷
- 放手偵測不到
- 滑動頁面和拖曳互相打架

目前已補上的修正是：

1. 用 `pointermove` 當主要拖曳移動事件
2. 用 `pointerup` / `pointercancel` 當主要收尾事件
3. 加入 `activePointerId`
4. 使用 `setPointerCapture` / `releasePointerCapture`
5. 在拖曳中 `preventDefault()`，避免手機滾動手勢把事件吃掉

這一版之後，手機板拖曳穩定度已經比原本好很多。

## 巡邏與待機節奏

### 巡邏

IP 在待機時不是固定不動，而是有一個底部巡邏節奏。這段由 `startPatrol()` 控制。

目前設定是每 `3200ms` 切一次方向。

如果之後覺得角色「太躁」或「太死」，通常可以先從這個數值下手。

### 泡泡輪播

泡泡輪播是另一條獨立節奏，由 `startBubbleLoop()` 控制，目前是每 `3600ms` 切一句。

巡邏和泡泡輪播彼此獨立，所以可以分開調。

## CSS / 版面上的維護重點

### 桌機與手機是分開調的

這套 IP 因為包含：

- 人物本體
- 泡泡
- 坐姿 / 站姿
- 開啟 / 關閉
- 手機 / 桌機

所以定位不是一組數值能通吃。過去實作上已經有針對手機版補過專用位置與手腳樣式。

維護時要特別注意：

1. 桌機正常，不代表手機正常
2. 站姿泡泡正常，不代表坐姿泡泡正常
3. 拖曳中的肢體角度調整，可能會影響手機縮放後的視覺

### `data-mascot-tip` 文案和 CSS 是兩件事

如果遇到「IP 有說話但泡泡被擋住」這種問題，要分開檢查：

1. JS 邏輯有沒有拿到 `hoverTip`
2. 泡泡定位 / `z-index` / `left` / `top` 是否正確

不要把提示內容錯誤和版面錯位混在一起查。

## 常見修改情境與建議改法

### 想改待機時說的內容

改 `CompChatbotMascot.vue` 的 `bubbleMessages`。

### 想改打開聊天面板後說的內容

改 `CompChatbotMascot.vue` 的 `seatedBubbleMessages`。

### 想讓某個按鈕也能被 IP 解說

在該按鈕或其實際 render DOM 上補 `data-mascot-tip`。

### 想讓整個新頁面也有這套導覽

做法通常是：

1. 先找出該頁最重要的 5 到 10 個互動點
2. 逐一補 `data-mascot-tip`
3. 實測 hover / focus 是否都有反應
4. 再檢查手機版泡泡有沒有被擋到

### 想調整拖曳手感

優先看：

- `handleDragStart`
- `handlePointerMove`
- `animateReturnToHome`
- 與 `dragSwingX/Y`、`dragLift` 相關的計算

### 想調整回家速度

優先看 `animateReturnToHome()` 內的步進值與衰減方式。

## 已知限制

1. 這套 IP 導覽不是語意理解系統，本質上還是手動標註。
2. 首頁 / 結果頁 / 內容頁雖然已接不少提示，但不是所有互動元件都已覆蓋。
3. IP 泡泡文案、頁面提示、拖曳動畫目前都集中在 `CompChatbotMascot.vue`，功能再加多時會開始變重。
4. 手機與桌機定位已經有分支樣式，後續如果再加更多姿態，CSS 維護成本會繼續上升。

## 後續如果要重構，建議方向

### 1. 把 IP 提示機制抽成 composable

目前 hover/focus 提示邏輯直接寫在 `CompChatbotMascot.vue`。如果未來還要有第二個導覽角色或其他浮動說明機制，可以考慮抽成 composable。

### 2. 把提示文案集中管理

現在很多 `data-mascot-tip` 是直接寫在 template 裡。短期很快，但長期如果要做統一文案風格或多語系，會比較難整理。

### 3. 拆分拖曳與角色演出邏輯

目前拖曳位移、肢體晃動、回位動畫都在同一元件。未來若互動繼續增加，可以考慮把「角色動作狀態」拆成更明確的 composable 或 state 模組。

## 總結

目前這套 IP 的核心觀念可以簡化成一句話：

「`CompChatbotEntry` 控入口，`CompChatbotMascot` 控角色與提示，`CompChatbotWelcome` 提供面板內互動，而所有頁面的解說能力都靠 `data-mascot-tip` 接進來。」

接手時如果先抓住這個結構，後面不管是補提示、調泡泡、修拖曳，定位都會比較快。
