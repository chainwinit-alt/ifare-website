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
 * 2026-05-25 fix — 從 .client.ts 改 universal,並補 getSSRProps,
 * 避免 SSR 找不到 directive → 'Cannot read properties of undefined
 * (reading getSSRProps)' 500 錯誤。
 */

interface ScrollRevealValue {
  delay?: number; // 秒
  distance?: number; // px
  threshold?: number; // 0-1
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('scroll-reveal', {
    // 提供 SSR 預設(必須有,即使是 noop;否則 SSR 用 ssrGetDirectiveProps 會炸)
    getSSRProps() {
      return {};
    },
    mounted(el: HTMLElement, binding) {
      // 只在 client 跑
      if (typeof window === 'undefined') return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const opts: ScrollRevealValue = binding.value ?? {};
      const delay = opts.delay ?? 0;
      const distance = opts.distance ?? 16;
      const threshold = opts.threshold ?? 0.15;

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
