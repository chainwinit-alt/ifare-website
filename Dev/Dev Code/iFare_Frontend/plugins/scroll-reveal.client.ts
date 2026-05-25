/**
 * 2026-05-25 UIUX #20 — 滾動觸發動畫 directive
 *
 * 用法:
 *   <section v-scroll-reveal>...</section>
 *   <section v-scroll-reveal="{ delay: 0.2, distance: 24 }">...</section>
 *
 * 進入 viewport 30% 時加 .is-revealed class,觸發 CSS transition。
 * 自動尊重 prefers-reduced-motion(直接顯示,不做動畫)。
 *
 * 樣式由全域 _animation.scss 統一處理,這裡只負責加 / 移除 class。
 */

interface ScrollRevealValue {
  delay?: number; // 秒
  distance?: number; // px
  threshold?: number; // 0-1
}

export default defineNuxtPlugin((nuxtApp) => {
  // 只在 client 跑(用 .client.ts 後綴已限定)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  nuxtApp.vueApp.directive('scroll-reveal', {
    mounted(el: HTMLElement, binding) {
      const opts: ScrollRevealValue = binding.value ?? {};
      const delay = opts.delay ?? 0;
      const distance = opts.distance ?? 16;
      const threshold = opts.threshold ?? 0.15;

      // 設定起始狀態(隱藏 + 下移)
      if (prefersReducedMotion) {
        el.classList.add('is-revealed');
        return;
      }

      el.style.opacity = '0';
      el.style.transform = `translateY(${distance}px)`;
      el.style.transition = `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`;
      el.style.willChange = 'opacity, transform';

      if (typeof IntersectionObserver === 'undefined') {
        // 老瀏覽器 fallback:直接顯示
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.classList.add('is-revealed');
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              el.style.opacity = '1';
              el.style.transform = 'none';
              el.classList.add('is-revealed');
              observer.unobserve(el);
              break;
            }
          }
        },
        { threshold, rootMargin: '0px 0px -80px 0px' },
      );

      observer.observe(el);
      (el as any).__scrollRevealObserver = observer;
    },
    unmounted(el) {
      const ob: IntersectionObserver | undefined = (el as any).__scrollRevealObserver;
      if (ob) ob.disconnect();
    },
  });
});
