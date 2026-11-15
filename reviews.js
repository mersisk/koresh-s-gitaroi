// Reviews as two real piles of polaroids on a table: left = still to read, right = already read.
// "Next" lifts the top card on the left, carries it in an arc and drops it onto the right pile; "back" does the reverse.
// Cards can be dragged; past the threshold they fly over, otherwise they spring back.
(() => {
  const stack = document.querySelector('[data-stack]');
  if (!stack) return;
  const cards = [...stack.querySelectorAll('.polaroid')];
  const count = document.querySelector('[data-stack-count]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n = cards.length;
  const tilt = cards.map((_, i) => [-4, 3, -2, 4.5, -3, 2][i % 6]);   // each print lies a little crooked
  let left = cards.map((_, i) => i).slice(1).reverse();                // bottom -> top
  let right = [0];
  let busy = false;

  const geo = () => {
    const w = stack.clientWidth, cw = cards[0].offsetWidth;
    return { w, cw, lx: w * 0.26 - cw / 2, rx: w * 0.74 - cw / 2 };
  };
  // where card i rests: pile, depth from the top of that pile
  function rest(i, g = geo()) {
    const inLeft = left.includes(i), pile = inLeft ? left : right;
    const depth = pile.length - 1 - pile.indexOf(i), d = Math.min(depth, 3), side = inLeft ? -1 : 1;
    return { x: (inLeft ? g.lx : g.rx) + side * d * 4, y: d * 3, r: tilt[i] + side * d * 1.2, z: 10 + (pile.length - depth), depth };
  }
  const tf = p => `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg)`;
  // literal shadows: var() inside Web Animations keyframes is not reliable in every browser
  const SH = { rest: '0 6px 14px rgba(59,42,36,.18), 0 1px 2px rgba(59,42,36,.2)', lift: '0 18px 32px rgba(59,42,36,.24)', air: '0 38px 60px rgba(59,42,36,.26)' };

  function layout(skip) {
    const g = geo();
    cards.forEach((c, i) => {
      if (c === skip) return;
      const p = rest(i, g);
      c.style.transform = tf(p);
      c.style.zIndex = p.z;
      c.classList.toggle('is-top', p.depth === 0);
      c.classList.toggle('is-deep', p.depth > 2);
      c.inert = p.depth !== 0;
      c.setAttribute('aria-hidden', String(p.depth !== 0));
    });
    stack.style.height = `${cards[0].offsetHeight + 70}px`;
    count.textContent = `${right[right.length - 1] + 1} / ${n}`;
  }

  // arc flight from a transform to the card's resting place, with lift, a slight 3D turn and a soft landing
  function fly(card, from, to, dir) {
    card.style.zIndex = 60;
    if (reduce) { layout(); return Promise.resolve(); }
    const peak = Math.min(from.y, to.y) - 70, mx = (from.x + to.x) / 2;
    const anim = card.animate([
      { transform: tf(from), boxShadow: SH.rest },
      { offset: .2, transform: `translate(${from.x + dir * 10}px, ${from.y - 26}px) rotate(${from.r - dir * 3}deg) scale(1.05)`, boxShadow: SH.lift },
      { offset: .55, transform: `translate(${mx}px, ${peak}px) rotate(${(from.r + to.r) / 2 + dir * 6}deg) rotateY(${dir * -14}deg) scale(1.08)`, boxShadow: SH.air },
      { offset: .86, transform: `translate(${to.x}px, ${to.y + 5}px) rotate(${to.r + dir * 1.5}deg) scale(.985)`, boxShadow: SH.rest },
      { transform: tf(to), boxShadow: SH.rest }
    ], { duration: 780, easing: 'cubic-bezier(.45,.05,.25,1)' });
    return anim.finished.catch(() => {});
  }

  async function move(dir, fromOverride) {
    if (busy) return;
    const src = dir > 0 ? left : right, dst = dir > 0 ? right : left;
    if (!src.length) return;
    busy = true;
    const i = src[src.length - 1], card = cards[i];
    const from = fromOverride || rest(i);
    src.pop(); dst.push(i);
    let refill = null;
    if (!src.length) { refill = dst.shift(); src.push(refill); }          // pile ran out: slip the bottom card back under
    layout(card);
    const to = rest(i);
    card.style.transform = tf(to);
    const jobs = [fly(card, from, to, dir)];
    if (refill !== null && !reduce) {
      const rc = cards[refill], rTo = rest(refill);
      jobs.push(rc.animate([{ transform: tf({ ...rTo, x: dir > 0 ? geo().rx : geo().lx }), opacity: 0 }, { transform: tf(rTo), opacity: 1 }],
        { duration: 520, delay: 380, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'backwards' }).finished.catch(() => {}));
    }
    await Promise.all(jobs);
    layout();
    busy = false;
  }

  document.querySelector('[data-stack-next]').addEventListener('click', () => move(1));
  document.querySelector('[data-stack-prev]').addEventListener('click', () => move(-1));
  stack.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
  });

  // drag the top card of either pile
  let drag = null;
  stack.addEventListener('pointerdown', e => {
    const card = e.target.closest('.polaroid.is-top');
    if (!card || busy || e.button !== 0) return;
    const i = cards.indexOf(card);
    drag = { card, i, sx: e.clientX, sy: e.clientY, base: rest(i), dir: left.includes(i) ? 1 : -1, moved: false };
    try { card.setPointerCapture(e.pointerId); } catch (_) { /* pointer already gone */ }
    card.classList.add('is-dragging');
    card.style.zIndex = 60;
  });
  stack.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (Math.abs(dx) > 4) drag.moved = true;
    drag.now = { x: drag.base.x + dx, y: drag.base.y + dy * 0.35 - 18, r: drag.base.r + dx * 0.05 };
    drag.card.style.transform = `${tf(drag.now)} scale(1.04)`;
  });
  const end = e => {
    if (!drag) return;
    const { card, i, dir, now, base } = drag; drag = null;
    card.classList.remove('is-dragging');
    if (card.hasPointerCapture?.(e.pointerId)) card.releasePointerCapture(e.pointerId);
    const dx = now ? now.x - base.x : 0;
    if (now && dx * dir > stack.clientWidth * 0.14) { move(dir, now); return; }
    if (now && !reduce) {                                                   // not far enough: spring back
      card.animate([{ transform: `${tf(now)} scale(1.04)` }, { offset: .6, transform: `${tf({ ...base, x: base.x - dx * 0.06 })} scale(.99)` }, { transform: tf(base) }],
        { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' });
    }
    layout();
  };
  stack.addEventListener('pointerup', end);
  stack.addEventListener('pointercancel', end);
  addEventListener('resize', () => layout());
  if (document.fonts?.ready) document.fonts.ready.then(() => layout());
  layout();

  // self-check: every card belongs to exactly one pile, both piles non-empty
  console.assert(left.length + right.length === n && left.length && right.length, 'polaroid piles broken');
})();
