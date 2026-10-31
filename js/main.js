(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');

  function setNav(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (open) header.classList.remove('is-hidden');
  }

  toggle.addEventListener('click', function () {
    setNav(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setNav(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setNav(false);
      toggle.focus();
    }
  });

  window.matchMedia('(min-width: 821px)').addEventListener('change', function (e) {
    if (e.matches) setNav(false);
  });

  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var delta = y - lastY;
    header.classList.toggle('is-scrolled', y > 8);
    if (!reduced && toggle.getAttribute('aria-expanded') !== 'true') {
      if (delta > 4 && y > 140) header.classList.add('is-hidden');
      else if (delta < -4 || y <= 140) header.classList.remove('is-hidden');
    }
    if (Math.abs(delta) > 4) lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  header.addEventListener('focusin', function () {
    header.classList.remove('is-hidden');
  });

  onScroll();

  var I18N = {};
  try { I18N = JSON.parse(document.getElementById('i18n').textContent); } catch (err) { I18N = {}; }

  var tv = document.querySelector('.tv');
  var slides = Array.prototype.slice.call(tv.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(tv.querySelectorAll('.tv__dots button'));
  var pauseBtn = tv.querySelector('.tv__pause');
  var screen = tv.querySelector('.tv__stage');
  var current = 0;
  var timer = null;
  var userPaused = reduced;
  var hold = false;

  function show(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) {
      s.classList.toggle('is-active', k === current);
      s.setAttribute('aria-hidden', String(k !== current));
    });
    dots.forEach(function (d, k) {
      if (k === current) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function play() {
    stop();
    if (userPaused || hold) return;
    timer = window.setInterval(function () { show(current + 1); }, 4500);
  }

  function setPaused(value) {
    userPaused = value;
    pauseBtn.setAttribute('aria-pressed', String(value));
    pauseBtn.setAttribute('aria-label', value ? I18N.play : I18N.pause);
    screen.setAttribute('aria-live', value ? 'polite' : 'off');
    play();
  }

  pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });

  dots.forEach(function (d, k) {
    d.addEventListener('click', function () {
      show(k);
      play();
    });
  });

  tv.addEventListener('mouseenter', function () { hold = true; stop(); });
  tv.addEventListener('mouseleave', function () { hold = false; play(); });
  tv.addEventListener('focusin', function () { hold = true; stop(); });
  tv.addEventListener('focusout', function () { hold = false; play(); });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else play();
  });

  setPaused(userPaused);

  var targets = document.querySelectorAll('.reveal, [data-observe]');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) {
      t.classList.add('in');
    });
  }

  var typeButtons = Array.prototype.slice.call(document.querySelectorAll('.type'));
  var pins = Array.prototype.slice.call(document.querySelectorAll('[data-types]'));
  var caption = document.querySelector('.map__cap');

  var mapSvg = document.querySelector('.map__svg');
  var roads = Array.prototype.slice.call(mapSvg.querySelectorAll('.road'));
  var tags = Array.prototype.slice.call(mapSvg.querySelectorAll('.road__tag'));
  var cityPins = Array.prototype.slice.call(mapSvg.querySelectorAll('.pin'));
  var cursor = mapSvg.querySelector('.cursor');
  var currentType = typeButtons[0];
  var picked = null;

  function clearPick() {
    picked = null;
    cityPins.forEach(function (p) { p.classList.remove('is-picked'); });
    roads.forEach(function (r) { r.classList.remove('is-hot'); });
    tags.forEach(function (t) { t.classList.remove('is-hot'); });
  }

  function selectType(button) {
    var type = button.dataset.type;
    var names = [];
    currentType = button;
    clearPick();
    typeButtons.forEach(function (b) {
      var on = b === button;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    pins.forEach(function (p) {
      var on = p.dataset.types.split(' ').indexOf(type) !== -1;
      p.classList.toggle('is-on', on);
      if (!on) return;
      if (type === 'axe') {
        if (p.classList.contains('road')) names.push(p.dataset.name);
      } else if (p.classList.contains('pin')) names.push(p.querySelector('.pin__label').textContent);
    });
    caption.textContent = I18N.cap_prefix + names.join(', ') + '.';
  }

  function pickCity(pin) {
    var city = pin.dataset.city;
    var label = pin.getAttribute('aria-label');
    var kinds = pin.dataset.types.split(' ').map(function (t) { return I18N.types[['cc', 'event', 'axe'].indexOf(t)]; });
    var hot = [];
    clearPick();
    picked = pin;
    pin.classList.add('is-picked');
    roads.forEach(function (r) {
      if (r.dataset.cities.split(',').indexOf(city) === -1) return;
      r.classList.add('is-hot');
      hot.push(r.dataset.name);
    });
    tags.forEach(function (t) { t.classList.toggle('is-hot', hot.indexOf(t.dataset.name) !== -1); });
    caption.textContent = '';
    var strong = document.createElement('strong');
    strong.textContent = label;
    caption.appendChild(strong);
    caption.appendChild(document.createTextNode(' · ' + kinds.join(' · ') + (hot.length ? ' · ' + I18N.axes + hot.join(', ') : '') + ' '));
    var a = document.createElement('a');
    a.href = '#devis';
    a.textContent = I18N.cta_city.replace('{city}', label) + ' →';
    a.addEventListener('click', function () {
      var z = document.getElementById('f-zone');
      if (z) z.value = label;
    });
    caption.appendChild(a);
  }

  cityPins.forEach(function (pin) {
    pin.addEventListener('click', function (e) { e.stopPropagation(); pickCity(pin); });
    pin.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickCity(pin); }
    });
  });

  mapSvg.addEventListener('click', function () { if (picked) selectType(currentType); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && picked) selectType(currentType);
  });

  function moveCursor(e) {
    var m = mapSvg.getScreenCTM();
    if (!m) return;
    var pt = mapSvg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    pt = pt.matrixTransform(m.inverse());
    cursor.setAttribute('cx', pt.x.toFixed(1));
    cursor.setAttribute('cy', pt.y.toFixed(1));
  }
  mapSvg.addEventListener('pointermove', moveCursor);
  mapSvg.addEventListener('pointerdown', moveCursor);
  mapSvg.addEventListener('pointerleave', function () { cursor.setAttribute('cx', '-200'); cursor.setAttribute('cy', '-200'); });

  typeButtons.forEach(function (b) {
    b.addEventListener('click', function () { selectType(b); });
  });
  selectType(typeButtons[0]);

  var form = document.getElementById('contact-form');

  function setRadio(name, value) {
    Array.prototype.forEach.call(form.querySelectorAll('input[name="' + name + '"]'), function (r) {
      r.checked = r.value === value;
    });
  }

  document.querySelectorAll('[data-periode]').forEach(function (a) {
    a.addEventListener('click', function () { setRadio('periode', a.dataset.periode); goTo(0, false); });
  });
  document.querySelectorAll('[data-profil]').forEach(function (a) {
    a.addEventListener('click', function () { form.elements.profil.value = a.dataset.profil; goTo(0, false); });
  });

  var status = form.querySelector('.form__status');
  var giant = document.getElementById('giant');
  var steps = Array.prototype.slice.call(form.querySelectorAll('.qpanel'));
  var prog = Array.prototype.slice.call(form.querySelectorAll('.qprog li'));
  var after = form.querySelector('.giant__after');
  var mailLink = form.querySelector('.giant__mail');
  var recapList = form.querySelector('.recap__list');
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var step = 0;
  var timers = [];

  function val(name) {
    var f = form.elements[name];
    return f ? (f.value || '').trim() : '';
  }

  function recap() {
    var rows = [
      [I18N.profil, val('profil') || I18N.tbd2],
      [I18N.place, val('lieu') || I18N.tbd],
      [I18N.period, val('periode') || I18N.tbd],
      [I18N.zone, val('zone') || '-'],
      [I18N.start, val('debut') || '-']
    ];
    recapList.textContent = '';
    rows.forEach(function (r) {
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = r[0];
      dd.textContent = r[1].charAt(0).toUpperCase() + r[1].slice(1);
      recapList.appendChild(dt);
      recapList.appendChild(dd);
    });
  }

  function goTo(n, focus) {
    step = Math.max(0, Math.min(steps.length - 1, n));
    steps.forEach(function (s, k) {
      s.classList.toggle('is-docked', k <= step);
      s.classList.toggle('is-current', k === step);
      if (k > step) {
        s.setAttribute('inert', '');
        s.setAttribute('aria-hidden', 'true');
      } else {
        s.removeAttribute('inert');
        s.removeAttribute('aria-hidden');
      }
    });
    prog.forEach(function (li, k) {
      if (k === step) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      li.classList.toggle('is-done', k < step);
    });
    status.textContent = '';
    if (step === steps.length - 1) recap();
    if (focus !== false) {
      steps[step].querySelector('.qstep__h').focus({ preventScroll: true });
      if (window.innerWidth <= 900) steps[step].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  if (document.documentElement.classList.contains('js')) goTo(0, false);

  function fail(field, message) {
    field.setAttribute('aria-invalid', 'true');
    status.classList.remove('is-ok');
    status.textContent = message;
    field.focus();
  }

  function validateContact() {
    var nom = form.elements.nom;
    var email = form.elements.email;
    nom.removeAttribute('aria-invalid');
    email.removeAttribute('aria-invalid');
    status.textContent = '';
    var bad = !nom.value.trim() ? [nom, I18N.err_name] : !emailRe.test(email.value.trim()) ? [email, I18N.err_email] : null;
    if (!bad) return true;
    if (step !== 2) goTo(2, false);
    fail(bad[0], bad[1]);
    return false;
  }

  function next() {
    if (step === 2 && !validateContact()) return;
    goTo(step + 1);
  }

  form.addEventListener('click', function (e) {
    var b = e.target.closest('.qnext, .qback');
    if (!b) return;
    if (b.classList.contains('qnext')) next();
    else goTo(step - 1);
  });

  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && step < steps.length - 1 && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      next();
    }
  });

  function later(fn, ms) { timers.push(window.setTimeout(fn, reduced ? Math.min(ms, 300) : ms)); }

  var msgEl = form.querySelector('.giant__msg');
  var ledDone = false;

  function setMsg(k) { msgEl.textContent = msgEl.getAttribute('data-' + k); }

  function sendRequest(payload) {
    var ctl = new AbortController();
    var to = window.setTimeout(function () { ctl.abort(); }, 12000);
    return fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: ctl.signal })
      .then(function (r) { window.clearTimeout(to); return r.ok; })
      .catch(function () { window.clearTimeout(to); return false; });
  }

  function finale(payload) {
    steps.forEach(function (s) { s.setAttribute('inert', ''); });
    giant.classList.add('is-sending');
    setMsg('sending');
    ledDone = false;
    var sent = sendRequest(payload);
    var ready = new Promise(function (res) { later(function () { giant.classList.add('is-zoom'); }, 600); later(function () { giant.classList.add('is-led'); startLed(); }, 1700); later(res, reduced ? 400 : 6500); });
    Promise.all([sent, ready]).then(function (r) {
      if (r[0]) {
        setMsg('done');
        status.classList.add('is-ok');
        status.textContent = I18N.ok;
      } else {
        setMsg('fail');
        status.classList.remove('is-ok');
        status.textContent = I18N.err_send;
        after.hidden = false;
        mailLink.href = 'mailto:contact@bkconsult.be?subject=' + encodeURIComponent(I18N.subject + payload.nom);
      }
    });
  }

  var ledEl = form.querySelector('.giant__led');
  var cv = form.querySelector('.giant__canvas');
  var ctx = cv.getContext('2d');
  var ads = (cv.getAttribute('data-ads') || '').split('|');
  var adBmp = [], adW = 0, adH = 0, adR = null, W = 0, H = 0;
  var CELL = 16, cols = 0, rows = 0, heat = null, raf = 0, t0 = 0, last = null, dpr = 1;

  function sizeCanvas() {
    var r = ledEl.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    cols = Math.ceil(r.width / CELL);
    rows = Math.ceil(r.height / CELL);
    heat = new Float32Array(cols * rows);
    W = r.width; H = r.height;
    buildAds();
  }

  function buildAds() {
    var pw = Math.min(W * 0.62, 640);
    adW = Math.floor(pw / 8); adH = Math.floor(adW * 0.34);
    var o = document.createElement('canvas'); o.width = adW; o.height = adH;
    var c = o.getContext('2d');
    adBmp = ads.map(function (txt) {
      c.clearRect(0, 0, adW, adH);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      var fs = adH * 0.62;
      c.font = '800 ' + fs + 'px Inter, sans-serif';
      while (c.measureText(txt).width > adW * 0.9 && fs > 6) { fs -= 1; c.font = '800 ' + fs + 'px Inter, sans-serif'; }
      c.fillText(txt, adW / 2, adH / 2 + fs * 0.04);
      var d = c.getImageData(0, 0, adW, adH).data, m = new Uint8Array(adW * adH);
      for (var i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 120 ? 1 : 0;
      return m;
    });
    adR = new Float32Array(adW * adH);
    for (var i = 0; i < adR.length; i++) adR[i] = Math.random();
  }

  function person(x, fy, h, ph, still, lookUp) {
    var s = h / 100, sw = still ? Math.sin(ph * 0.4) * 0.03 : 0;
    var hipY = fy - 48 * s - (still ? 0 : Math.abs(Math.sin(ph)) * 2.2 * s);
    var shY = hipY - 34 * s, hd = shY - 11 * s;
    ctx.strokeStyle = '#E7EBF3'; ctx.fillStyle = '#E7EBF3'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function limb(x0, y0, a1, l1, a2, l2, w) {
      var kx = x0 + Math.sin(a1) * l1, ky = y0 + Math.cos(a1) * l1;
      ctx.lineWidth = w * s; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(kx, ky);
      ctx.lineTo(kx + Math.sin(a2) * l2, ky + Math.cos(a2) * l2); ctx.stroke();
    }
    var sA = still ? 0.1 : Math.sin(ph), sB = still ? -0.1 : Math.sin(ph + Math.PI);
    limb(x, hipY, sA * 0.55, 24 * s, sA * 0.55 - Math.max(0, -Math.cos(ph)) * 0.5 * (still ? 0 : 1), 24 * s, 7);
    limb(x, hipY, sB * 0.55, 24 * s, sB * 0.55 - Math.max(0, -Math.cos(ph + Math.PI)) * 0.5 * (still ? 0 : 1), 24 * s, 7);
    ctx.lineWidth = 11 * s; ctx.beginPath(); ctx.moveTo(x, hipY); ctx.lineTo(x + sw * 30 * s, shY); ctx.stroke();
    limb(x + sw * 30 * s, shY + 2 * s, sB * 0.5, 16 * s, sB * 0.5 + 0.4, 15 * s, 5);
    limb(x + sw * 30 * s, shY + 2 * s, sA * 0.5, 16 * s, sA * 0.5 + 0.4, 15 * s, 5);
    ctx.beginPath(); ctx.arc(x + (lookUp ? 2.5 * s : 0), hd - (lookUp ? 1.5 * s : 0), 8.5 * s, 0, 6.2832); ctx.fill();
  }

  function scene(s) {
    var pw = adW * 8, ph = adH * 8, px = (W - pw) / 2, py = H * 0.13, fy = H * 0.84;
    var g = ctx.createRadialGradient(W / 2, py + ph, 10, W / 2, py + ph, W * 0.55);
    g.addColorStop(0, 'rgba(251,146,60,.22)'); g.addColorStop(1, 'rgba(251,146,60,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#10192b'; ctx.fillRect(0, fy, W, H - fy);
    ctx.fillStyle = 'rgba(251,146,60,.25)'; ctx.fillRect(0, fy, W, 1.5);
    ctx.fillStyle = '#1B2640';
    ctx.fillRect(px + pw * 0.2, py + ph, 10, fy - py - ph);
    ctx.fillRect(px + pw * 0.8 - 10, py + ph, 10, fy - py - ph);
    ctx.fillStyle = '#0B1220'; ctx.strokeStyle = '#33425F'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(px - 12, py - 12, pw + 24, ph + 24, 8); ctx.fill(); ctx.stroke();
    var n = adBmp.length, cyc = 3.4, k = Math.floor(s / cyc) % n, f = (s % cyc) / cyc, k2 = (k + 1) % n;
    var tr = f > 0.82 ? (f - 0.82) / 0.18 : 0;
    for (var y = 0; y < adH; y++) for (var x = 0; x < adW; x++) {
      var i = y * adW + x, on = (adR[i] < tr ? adBmp[k2][i] : adBmp[k][i]);
      ctx.fillStyle = on ? (adR[i] < 0.12 ? '#FFE3C4' : '#FB923C') : 'rgba(251,146,60,.09)';
      ctx.beginPath(); ctx.arc(px + x * 8 + 4, py + y * 8 + 4, on ? 2.7 : 1.5, 0, 6.2832); ctx.fill();
    }
    var walkT = 5.2, u = Math.min(s / walkT, 1), e = 1 - Math.pow(1 - u, 2.2);
    var x0 = -W * 0.06, x1 = W * 0.27, pxm = x0 + (x1 - x0) * e, still = u >= 1;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(pxm, fy + 4, H * 0.08, 5, 0, 0, 6.2832); ctx.fill();
    person(pxm, fy, H * 0.22, s * 7.5, still, still);
  }


  function light(cx, cy, rad, amt) {
    var x0 = Math.max(0, Math.floor(cx - rad)), x1 = Math.min(cols - 1, Math.ceil(cx + rad));
    var y0 = Math.max(0, Math.floor(cy - rad)), y1 = Math.min(rows - 1, Math.ceil(cy + rad));
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
      var d = Math.hypot(x - cx, y - cy);
      if (d <= rad) {
        var i = y * cols + x;
        heat[i] = Math.max(heat[i], amt * (1 - d / (rad + 0.5)));
      }
    }
  }

  function frame(now) {
    var s = Math.max(0, (now - t0) / 1000);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    scene(s);
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var i = y * cols + x, v = heat[i];
      var a = 0.05 + v * 0.9;
      var g = Math.round(146 + v * 90), bl = Math.round(60 + v * 120);
      ctx.fillStyle = 'rgba(251,' + g + ',' + bl + ',' + a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 1.5 + v * 2.6, 0, 6.2832);
      ctx.fill();
      heat[i] = v > 0.004 ? v * 0.945 : 0;
    }
    raf = window.requestAnimationFrame(frame);
  }

  function startLed() {
    sizeCanvas();
    t0 = performance.now();
    last = null;
    window.cancelAnimationFrame(raf);
    if (reduced) { frame(t0 + 7000); window.cancelAnimationFrame(raf); return; }
    raf = window.requestAnimationFrame(frame);
  }

  function stopLed() { window.cancelAnimationFrame(raf); }

  giant.addEventListener('pointermove', function (e) {
    if (!giant.classList.contains('is-led') || !heat || reduced) return;
    var r = ledEl.getBoundingClientRect();
    var p = { x: (e.clientX - r.left) / CELL, y: (e.clientY - r.top) / CELL };
    var from = last || p;
    var n = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / 0.6));
    for (var k = 1; k <= n; k++) light(from.x + (p.x - from.x) * k / n, from.y + (p.y - from.y) * k / n, 2.6, 1);
    last = p;
  });
  giant.addEventListener('pointerleave', function () { last = null; });
  window.addEventListener('resize', function () { if (giant.classList.contains('is-led')) sizeCanvas(); });

  form.querySelector('.giant__again').addEventListener('click', function () {
    timers.forEach(window.clearTimeout);
    timers = [];
    giant.classList.remove('is-sending', 'is-zoom', 'is-led');
    stopLed();
    after.hidden = true;
    status.textContent = '';
    status.classList.remove('is-ok');
    goTo(steps.length - 1, true);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (giant.classList.contains('is-sending')) return;
    if (step < steps.length - 1) return next();
    if (!validateContact()) return;
    var nom = form.elements.nom;
    var email = form.elements.email;

    finale({
      nom: nom.value.trim(), email: email.value.trim(), entreprise: val('entreprise'),
      profil: val('profil'), lieu: val('lieu'), periode: val('periode'), zone: val('zone'),
      debut: val('debut'), message: val('message'), website: val('website'), lang: document.documentElement.lang
    });
  });
})();
