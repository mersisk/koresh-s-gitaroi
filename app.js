(() => {
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = motionPreference.matches;
  const showIntro = !new URLSearchParams(location.search).has('noIntro');
  // Reload must always land on the intro, so drop the one-time skip flag from the URL.
  if (!showIntro) history.replaceState(null, '', location.pathname + location.hash);
  history.scrollRestoration = 'manual';
  const menuButton = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-mobile-menu]');
  const poster = document.querySelector('[data-poster]');
  const dialog = document.querySelector('[data-dialog]');
  const dialogContent = document.querySelector('[data-dialog-content]');
  let previousFocus;
  let scrollQueued = false;

  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('is-locked', open);
    ['main', 'footer', '.section-nav', '.skip-link', '[data-mini-yura]'].forEach(selector => {
      document.querySelector(selector).inert = open;
    });
    if (!open) updatePoster();
    if (open) menu.querySelector('a')?.focus();
    else menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') { setMenu(false); return; }
    if (event.key !== 'Tab') return;
    const focusable = [menuButton, ...menu.querySelectorAll('a,button:not(:disabled)')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const sectionNav = document.querySelector('[data-section-nav]');
  function updatePoster() {
    scrollQueued = false;
    const visible = poster.getBoundingClientRect().bottom <= 76 && !document.body.classList.contains('menu-open') && !document.body.classList.contains('has-intro');
    sectionNav.classList.toggle('is-visible', visible);
    sectionNav.inert = !visible;
    sectionNav.setAttribute('aria-hidden', String(!visible));
  }
  addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updatePoster); }
  }, {passive:true});
  addEventListener('resize', updatePoster);
  updatePoster();

  const introGate = document.querySelector('[data-intro-gate]');
  const introEnter = document.querySelector('[data-intro-enter]');
  function resetIntroScroll() {
    const root = document.documentElement;
    const body = document.body;
    const previousBehavior = root.style.scrollBehavior;
    const previousBodyBehavior = body.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    body.style.scrollBehavior = 'auto';
    scrollTo({ top: 0, left: 0, behavior: 'instant' });
    root.scrollTop = 0;
    body.scrollTop = 0;
    root.style.scrollBehavior = previousBehavior;
    body.style.scrollBehavior = previousBodyBehavior;
  }
  if (showIntro) {
    resetIntroScroll();

    introGate.hidden = false;
    document.body.classList.add('has-intro');
    document.querySelector('header').inert = true;
    document.querySelector('main').inert = true;
    document.querySelector('footer').inert = true;
    document.querySelector('.skip-link').inert = true;
    document.querySelector('[data-mini-yura]').inert = true;
    introEnter.focus();
  } else {
    introGate.hidden = true;
    document.body.classList.remove('has-intro');
  }
  addEventListener('pageshow', () => {
    if (!introGate.hidden || !location.hash || location.hash === '#top') resetIntroScroll();
    updatePoster();
  });
  if (!location.hash || location.hash === '#top') resetIntroScroll();
  function closeIntro() {
    if (introGate.hidden || introGate.classList.contains('is-leaving')) return;
    resetIntroScroll();
    introGate.classList.add('is-leaving');
    const finish = () => { introGate.hidden = true; document.body.classList.remove('has-intro'); resetIntroScroll(); requestAnimationFrame(resetIntroScroll); document.querySelector('header').inert = false; document.querySelector('main').inert = false; document.querySelector('footer').inert = false; document.querySelector('.skip-link').inert = false; document.querySelector('[data-mini-yura]').inert = false; document.querySelector('.hero-book').focus({preventScroll:true}); syncMiniMotion(); };
    if (reduceMotion) finish(); else setTimeout(finish, 600);
  }
  introEnter.addEventListener('click', closeIntro);

  const miniYura = document.querySelector('[data-mini-yura]');
  const miniAudio = document.querySelector('[data-mini-audio]');
  const miniPlay = document.querySelector('[data-mini-play]');
  const miniMotion = document.querySelector('[data-mini-motion]');
  const miniFrame = document.querySelector('[data-mini-frame]');
  const miniDrag = document.querySelector('[data-mini-drag]');
  const miniClose = document.querySelector('[data-mini-close]');
  try { if (sessionStorage.getItem('miniYuraClosed') === '1') miniYura.hidden = true; } catch (_) { /* Storage may be unavailable in private or embedded pages. */ }
  miniPlay.addEventListener('click', async () => {
    if (miniAudio.paused) {
      try {
        await miniAudio.play();
        miniYura.classList.add('is-playing');
        miniFrame.contentWindow?.postMessage({ type: 'yura-widget-playing', playing: true }, location.origin);
        miniPlay.textContent = '❚❚';
        miniPlay.setAttribute('aria-label', 'Выключить звук');
        miniPlay.setAttribute('aria-pressed', 'true');
      } catch (_) {
        document.querySelector('[data-mini-track]').textContent = 'Нажми ещё раз для звука';
      }
    } else {
      miniAudio.pause();
      miniYura.classList.remove('is-playing');
      miniFrame.contentWindow?.postMessage({ type: 'yura-widget-playing', playing: false }, location.origin);
      miniPlay.textContent = '▶';
      miniPlay.setAttribute('aria-label', 'Включить звук');
      miniPlay.setAttribute('aria-pressed', 'false');
    }
  });
  miniAudio.addEventListener('ended', () => {
    miniYura.classList.remove('is-playing');
    miniFrame.contentWindow?.postMessage({ type: 'yura-widget-playing', playing: false }, location.origin);
    miniPlay.textContent = '▶';
    miniPlay.setAttribute('aria-label', 'Включить звук');
    miniPlay.setAttribute('aria-pressed', 'false');
  });
  let animationPaused = reduceMotion;
  function syncMiniMotion() {
    miniFrame.contentWindow?.postMessage({ type: 'yura-widget-motion', paused: animationPaused || miniYura.hidden || document.body.classList.contains('has-intro') }, location.origin);
    miniMotion.textContent = animationPaused ? '▷' : 'Ⅱ';
    miniMotion.setAttribute('aria-label', animationPaused ? 'Включить анимацию' : 'Приостановить анимацию');
    miniMotion.setAttribute('aria-pressed', String(animationPaused));
  }
  miniFrame.addEventListener('load', syncMiniMotion);
  syncMiniMotion();
  miniMotion.addEventListener('click', () => {
    animationPaused = !animationPaused;
    syncMiniMotion();
  });
  miniClose.addEventListener('click', () => {
    miniAudio.pause();
    miniYura.hidden = true;
    syncMiniMotion();
    try { sessionStorage.setItem('miniYuraClosed', '1'); } catch (_) { /* Closing still works for this page. */ }
  });

  // Use one pointer path for a mouse, pen or finger; only the figure owns the gesture.
  let miniPosition = null;
  let miniPointer = null;
  function placeMini(x, y) {
    const box = miniYura.getBoundingClientRect();
    const maxX = Math.max(8, innerWidth - box.width - 8);
    const maxY = Math.max(8, innerHeight - box.height - 8);
    miniPosition = { x: Math.max(8, Math.min(maxX, x)), y: Math.max(8, Math.min(maxY, y)) };
    miniYura.style.left = '0';
    miniYura.style.top = '0';
    miniYura.style.right = 'auto';
    miniYura.style.bottom = 'auto';
    miniYura.style.transform = `translate3d(${miniPosition.x}px, ${miniPosition.y}px, 0)`;
  }
  miniDrag.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || miniPointer) return;
    const box = miniYura.getBoundingClientRect();
    miniPointer = { id: event.pointerId, x: event.clientX, y: event.clientY, left: box.left, top: box.top };
    miniDrag.setPointerCapture(event.pointerId);
    miniYura.classList.add('is-dragging');
  });
  miniDrag.addEventListener('pointermove', event => {
    if (!miniPointer || miniPointer.id !== event.pointerId) return;
    placeMini(miniPointer.left + event.clientX - miniPointer.x, miniPointer.top + event.clientY - miniPointer.y);
  });
  function endMiniDrag(event) {
    if (!miniPointer || miniPointer.id !== event.pointerId) return;
    miniPointer = null;
    miniYura.classList.remove('is-dragging');
    if (miniDrag.hasPointerCapture(event.pointerId)) miniDrag.releasePointerCapture(event.pointerId);
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => miniDrag.addEventListener(type, endMiniDrag));
  miniDrag.addEventListener('keydown', event => {
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const box = miniYura.getBoundingClientRect();
    const step = event.shiftKey ? 40 : 12;
    placeMini(box.left + direction[0] * step, box.top + direction[1] * step);
  });
  addEventListener('resize', () => {
    if (miniPosition && !miniYura.hidden) placeMini(miniPosition.x, miniPosition.y);
  });

  function getNearestEvent(entries, today) {
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    return entries.filter(item => {
      if (typeof item?.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return false;
      const date = new Date(`${item.date}T00:00:00`);
      return date >= start && date.getDate() === Number(item.date.slice(8)) &&
        date.getMonth() + 1 === Number(item.date.slice(5, 7)) && date.getFullYear() === Number(item.date.slice(0, 4));
    }).sort((a, b) => a.date.localeCompare(b.date))[0] || null;
  }
  function getEventLink(value) {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  }
  function formatEventMonth(date) {
    return new Intl.DateTimeFormat('ru-RU', {day:'numeric', month:'long'}).format(date).replace(/^\d+\s+/, '');
  }
  const entries = Array.isArray(window.KORESH_EVENTS) ? window.KORESH_EVENTS : [];
  const nearest = getNearestEvent(entries, new Date());
  const eventArea = document.querySelector('[data-events]');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if (nearest) {
    const date = new Date(`${nearest.date}T00:00:00`);
    const month = formatEventMonth(date);
    const url = getEventLink(nearest.url);
    const venue = [nearest.venue, nearest.address].filter(Boolean).map(escapeHtml).join(' · ');
    const action = url ? `<a class="event-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Открыть афишу ↗</a>` : '<button class="event-link" type="button" data-contact-open>Уточнить подробности ↗</button>';
    eventArea.innerHTML = `<article class="event-feature"><time class="event-date" datetime="${escapeHtml(nearest.date)}"><strong>${date.getDate()}</strong><span>${month}${nearest.time ? ` · ${escapeHtml(nearest.time)}` : ''}</span></time><div class="event-details"><h3>${escapeHtml(nearest.title || 'Живое выступление')}</h3><p>${venue}${nearest.note ? `<br>${escapeHtml(nearest.note)}` : ''}</p></div>${action}</article>`;
  } else {
    eventArea.innerHTML = '<article class="event-feature event-empty"><div class="event-details"><h3>Новые даты скоро</h3><p>Как только подтвердится следующее открытое выступление, здесь появятся дата и площадка. А пригласить меня на своё событие можно уже сейчас.</p><button type="button" data-contact-open>Обсудить мой праздник ↗</button></div></article>';
  }

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver((items, current) => {
    items.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      current.unobserve(entry.target);
    });
  }, {threshold:.18}) : null;
  const eventFeatures = [...eventArea.querySelectorAll('.event-feature')];
  if (reduceMotion || !observer) eventFeatures.forEach(item => item.classList.add('is-visible'));
  else eventFeatures.forEach(item => observer.observe(item));

  function openDialog(content, source) {
    previousFocus = source;
    dialogContent.replaceChildren(content);
    dialog.showModal();
    document.body.classList.add('is-locked');
    if (!reduceMotion && source) {
      const from = source.getBoundingClientRect();
      const to = content.getBoundingClientRect();
      const dx = from.left + from.width/2 - (to.left + to.width/2);
      const dy = from.top + from.height/2 - (to.top + to.height/2);
      content.animate([{transform:`translate(${dx}px,${dy}px) scale(${Math.max(.15,from.width / Math.max(1,to.width))})`,opacity:.6},{transform:'none',opacity:1}],{duration:480,easing:'cubic-bezier(.23,1,.32,1)'});
    }
  }
  document.querySelectorAll('[data-photo]').forEach(button => button.addEventListener('click', () => {
    const img = new Image(); img.src = button.dataset.photo; img.alt = button.dataset.alt;
    openDialog(img, button);
  }));
  function closeDialog() { if (dialog.open) dialog.close(); }
  document.querySelector('[data-dialog-close]').addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener('close', () => {
    dialogContent.querySelector('video')?.pause();
    dialogContent.replaceChildren();
    const locked = document.querySelector('[data-gallery-dialog]')?.open || document.querySelector('[data-contact-dialog]').open || menuButton.getAttribute('aria-expanded') === 'true';
    document.body.classList.toggle('is-locked', locked);
    previousFocus?.focus({preventScroll:true});
  });

  const contactDialog = document.querySelector('[data-contact-dialog]');
  let contactOpener;
  document.querySelectorAll('[data-contact-open]').forEach(button => button.addEventListener('click', () => {
    const fromMenu = menuButton.getAttribute('aria-expanded') === 'true';
    contactOpener = fromMenu ? menuButton : button;
    if (fromMenu) setMenu(false);
    contactDialog.showModal();
    document.body.classList.add('is-locked');
  }));
  document.querySelector('[data-contact-close]').addEventListener('click', () => contactDialog.close());
  contactDialog.addEventListener('close', () => {
    const locked = document.querySelector('[data-gallery-dialog]')?.open || document.querySelector('[data-dialog]')?.open || menuButton.getAttribute('aria-expanded') === 'true';
    document.body.classList.toggle('is-locked', Boolean(locked));
    contactOpener?.focus({preventScroll:true});
  });
  contactDialog.addEventListener('click', event => { if (event.target === contactDialog) contactDialog.close(); });
  const string = document.querySelector('.booking-string');
  const pluck = () => { string.classList.remove('is-plucked'); void string.offsetWidth; string.classList.add('is-plucked'); };
  document.querySelector('.booking-action').addEventListener('pointerenter', pluck);
  document.querySelector('.booking-action').addEventListener('click', pluck);
  document.querySelector('[data-year]').textContent = new Date().getFullYear();
  motionPreference.addEventListener?.('change', event => {
    reduceMotion = event.matches;
    if (reduceMotion) animationPaused = true;
    syncMiniMotion();
  });
})();
