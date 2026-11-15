// Scroll reveals, hero entrance after the intro, light parallax, compact header, current-section nav.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  // Hero plays its entrance once the intro gate is gone.
  // classList.add re-fires the observer even for an existing class, so stop observing first.
  const gate = new MutationObserver(() => heroIn());
  const heroIn = () => {
    if (body.classList.contains('has-intro')) return;
    gate.disconnect();
    body.classList.add('hero-in');
  };
  gate.observe(body, { attributes: true, attributeFilter: ['class'] });
  heroIn();

  document.querySelectorAll('[data-stagger]').forEach(group =>
    [...group.children].forEach((child, i) => { child.style.transitionDelay = `${i * 80}ms`; }));

  const targets = document.querySelectorAll('[data-reveal],[data-stagger]');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-in'));
  } else {
    // A clip-path target has zero visible area, so watch its parent instead.
    const watched = new Map();
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      (watched.get(entry.target) || []).forEach(el => el.classList.add('is-in'));
      io.unobserve(entry.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => {
      const box = /^clip/.test(el.dataset.reveal || '') ? el.parentElement : el;
      watched.set(box, [...(watched.get(box) || []), el]);
      io.observe(box);
    });
  }

  const heroImg = document.querySelector('.lk-hero-photo img');
  let queued = false;
  const onScroll = () => {
    queued = false;
    body.classList.toggle('scrolled', scrollY > 40);
    if (!reduce && heroImg && scrollY < innerHeight) heroImg.style.setProperty('--py', `${scrollY * 0.12}px`);
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  const links = new Map([...document.querySelectorAll('.desktop-nav a[href^="#"]')].map(a => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const navIo = new IntersectionObserver(entries => entries.forEach(entry => {
      const link = links.get(entry.target.id);
      if (link) link.classList.toggle('is-current', entry.isIntersecting);
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => { const section = document.getElementById(id); if (section) navIo.observe(section); });
  }
})();

// "Куда позвать": tabs. Hover previews on desktop, click/tap or arrow keys select.
(() => {
  const root = document.querySelector('[data-formats]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (on && panel.hidden) { panel.hidden = false; panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering'); }
      else if (!on) panel.hidden = true;
    });
    if (focus) tab.focus();
    if (matchMedia('(max-width: 600px)').matches) tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    if (matchMedia('(hover: hover)').matches) tab.addEventListener('mouseenter', () => select(tab));
    tab.addEventListener('keydown', e => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      select(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });
})();
