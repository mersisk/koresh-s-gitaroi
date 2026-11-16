// Loader: mini-Yura strums while the intro's pictures and fonts arrive; notes on the staff light up with progress.
(() => {
  const loader = document.querySelector('[data-loader]');
  if (!loader) return;
  const pct = loader.querySelector('[data-loader-pct]');
  const notes = [...loader.querySelectorAll('.ld-note')];
  const MIN_MS = 1300, MAX_MS = 7000, started = performance.now();
  const urls = ['assets/images/intro-yura-amp.webp', 'assets/images/logo-graffiti-v2.webp', 'assets/images/intro-guitar-v3.webp', 'assets/images/intro-fist.webp', 'assets/images/intro-lhand2.webp',
    'assets/images/yura-sheet.webp', 'assets/images/yura-suit-cutout.webp'];
  const tasks = urls.map(src => new Promise(done => { const im = new Image(); im.src = src; (im.decode ? im.decode() : Promise.reject()).then(done, () => { im.onload = im.onerror = done; if (im.complete) done(); }); }));
  if (document.fonts && document.fonts.ready) tasks.push(document.fonts.ready);
  let finished = 0, shown = 0, closed = false;
  const total = tasks.length;
  tasks.forEach(t => t.then(() => { finished++; }));

  // Ease the number towards the real progress so it never jumps backwards or stalls at 0.
  function frame() {
    if (closed) return;
    const real = finished / total, elapsed = performance.now() - started;
    const target = Math.min(real, elapsed / MIN_MS) * 100;
    shown += (target - shown) * 0.18;
    const value = Math.min(100, Math.round(shown));
    pct.textContent = `${value}%`;
    notes.forEach((n, i) => n.classList.toggle('on', value >= (i + 1) * (100 / notes.length) - 1));
    if ((real === 1 && elapsed >= MIN_MS && value >= 99) || elapsed > MAX_MS) close();
    else requestAnimationFrame(frame);
  }
  function close() {
    closed = true;
    pct.textContent = '100%';
    notes.forEach(n => n.classList.add('on'));
    loader.classList.add('is-done');
    setTimeout(() => {
      document.body.classList.remove('is-loading');   // intro animations start only now
      loader.hidden = true;
    }, 450);
  }
  requestAnimationFrame(frame);
})();
