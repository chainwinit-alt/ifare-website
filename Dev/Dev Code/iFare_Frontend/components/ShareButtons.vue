<template>
  <!--
    2026-05-25 UIUX #35 — 統一社群分享按鈕組
    取代原本只有 LINE 的分享按鈕,擴展到 LINE / Facebook / 複製連結 / Email。
    用法:
      <ShareButtons />  <!-- 預設用 fixed 風格 -->
      <ShareButtons variant="inline" />  <!-- inline 行內排列 -->
  -->
  <div class="share-buttons" :class="`variant-${variant}`" role="group" aria-label="分享到">
    <button
      type="button"
      class="share-btn share-btn-line"
      aria-label="分享到 LINE"
      title="分享到 LINE"
      @click="onShareLine"
    >
      <span class="share-btn-icon" aria-hidden="true">L</span>
      <span class="share-btn-label">LINE</span>
    </button>
    <button
      type="button"
      class="share-btn share-btn-fb"
      aria-label="分享到 Facebook"
      title="分享到 Facebook"
      @click="onShareFB"
    >
      <span class="share-btn-icon" aria-hidden="true">f</span>
      <span class="share-btn-label">Facebook</span>
    </button>
    <button
      type="button"
      class="share-btn share-btn-copy"
      aria-label="複製連結"
      title="複製連結"
      @click="onCopyLink"
    >
      <span class="share-btn-icon" aria-hidden="true">⎘</span>
      <span class="share-btn-label">{{ copied ? '已複製' : '複製連結' }}</span>
    </button>
    <button
      type="button"
      class="share-btn share-btn-email"
      aria-label="用 Email 分享"
      title="用 Email 分享"
      @click="onShareEmail"
    >
      <span class="share-btn-icon" aria-hidden="true">@</span>
      <span class="share-btn-label">Email</span>
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** fixed = 老 ic-share 圓鈕風格(右上浮動);inline = 行內排列(預設) */
    variant?: 'inline' | 'fixed';
  }>(),
  { variant: 'inline' },
);

const { shareCurrentUrlToLine } = useShareToLine();
const { shareCurrentUrlToFacebook, shareCurrentUrlToEmail, copyCurrentUrl } = useShareUrl();
const { success, error } = useToast();

const copied = ref(false);

function onShareLine() {
  shareCurrentUrlToLine();
}

function onShareFB() {
  shareCurrentUrlToFacebook();
}

function onShareEmail() {
  shareCurrentUrlToEmail();
}

async function onCopyLink() {
  const ok = await copyCurrentUrl();
  if (ok) {
    copied.value = true;
    success('已複製連結到剪貼簿', { duration: 2500 });
    setTimeout(() => (copied.value = false), 2500);
  } else {
    error('複製失敗', {
      description: '瀏覽器拒絕存取剪貼簿。請手動選取網址列複製。',
    });
  }
}
</script>

<style lang="scss" scoped>
.share-buttons {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.share-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(23, 24, 24, 0.12);
  border-radius: 999px;
  background: #ffffff;
  color: #1f3640;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.share-btn:hover {
  transform: translateY(-1px);
  border-color: currentColor;
}

.share-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.share-btn-line {
  &:hover { color: #00b900; }
  .share-btn-icon { background: #00b900; }
}

.share-btn-fb {
  &:hover { color: #1877f2; }
  .share-btn-icon { background: #1877f2; }
}

.share-btn-copy {
  &:hover { color: #ea5504; }
  .share-btn-icon { background: #ea5504; }
}

.share-btn-email {
  &:hover { color: #606266; }
  .share-btn-icon { background: #606266; }
}

/* fixed 風格:右上浮動,只顯示 icon 不顯示 label */
.variant-fixed {
  position: absolute;
  top: -22px;
  right: 24px;
  background: #ffffff;
  border-radius: 999px;
  padding: 6px;
  box-shadow: 0 10px 24px -8px rgba(23, 24, 24, 0.18);

  .share-btn {
    padding: 6px;
    border: 0;
  }

  .share-btn-label {
    display: none;
  }
}

@media (max-width: 540px) {
  .share-btn-label {
    display: none;
  }
  .share-btn {
    padding: 8px;
  }
}
</style>
