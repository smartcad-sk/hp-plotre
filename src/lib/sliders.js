// Minimal re-implementation of the Swiper 3 behaviour the Layers slider widget uses
// (fade / slide effect, loop, autoplay, bullet pages, auto height).
export function initSliders(root, configs = {}) {
  const cleanups = [];

  root.querySelectorAll('.layers-slider-widget.swiper-container').forEach((container) => {
    const cfg = { effect: 'slide', loop: false, autoplay: 0, autoHeight: false, ...configs[container.id] };
    const wrapper = container.querySelector('.swiper-wrapper');
    const slides = [...wrapper.children].filter((el) => el.classList.contains('swiper-slide'));
    const bullets = [...container.querySelectorAll(':scope > .pages > a')];
    let index = 0;
    let timer;

    const layout = () => {
      const width = container.clientWidth;
      slides.forEach((slide, i) => {
        slide.style.width = `${width}px`;
        if (cfg.effect === 'fade') {
          slide.style.transform = `translate3d(${-i * width}px, 0, 0)`;
          slide.style.transitionDuration = '300ms';
        }
      });
      if (cfg.autoHeight) {
        const height = Math.max(...slides.map((s) => s.querySelector('.container')?.offsetHeight || s.offsetHeight));
        container.style.height = `${height}px`;
      }
      render(false);
    };

    const render = (animate = true) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle('swiper-slide-active', i === index);
        if (cfg.effect === 'fade') slide.style.opacity = i === index ? 1 : 0;
      });
      if (cfg.effect !== 'fade') {
        wrapper.style.transitionDuration = animate ? '300ms' : '0ms';
        wrapper.style.transform = `translate3d(${-index * container.clientWidth}px, 0, 0)`;
      }
      bullets.forEach((b, i) => b.classList.toggle('active', i === index));
    };

    const go = (i) => {
      index = cfg.loop ? (i + slides.length) % slides.length : Math.max(0, Math.min(slides.length - 1, i));
      render();
      restart();
    };

    const restart = () => {
      clearInterval(timer);
      if (cfg.autoplay && slides.length > 1) timer = setInterval(() => go(index + 1), cfg.autoplay);
    };

    const onBullet = (e) => {
      const i = bullets.indexOf(e.currentTarget);
      if (i < 0) return;
      e.preventDefault();
      e.stopPropagation();
      go(i);
    };

    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      if (e.key === 'ArrowLeft') go(index - 1);
      if (e.key === 'ArrowRight') go(index + 1);
    };

    container.classList.add(`swiper-container-${cfg.effect}`, 'swiper-container-horizontal');
    bullets.forEach((b) => b.addEventListener('click', onBullet));
    window.addEventListener('resize', layout);
    if (cfg.autoplay) window.addEventListener('keydown', onKey);
    // Images inside slides change the height once they load.
    container.querySelectorAll('img').forEach((img) => img.addEventListener('load', layout, { once: true }));
    layout();
    restart();

    cleanups.push(() => {
      clearInterval(timer);
      bullets.forEach((b) => b.removeEventListener('click', onBullet));
      window.removeEventListener('resize', layout);
      window.removeEventListener('keydown', onKey);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
