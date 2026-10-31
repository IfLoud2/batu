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

  function selectType(button) {
    var type = button.dataset.type;
    var names = [];
    typeButtons.forEach(function (b) {
      var on = b === button;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    pins.forEach(function (p) {
      var on = p.dataset.types.split(' ').indexOf(type) !== -1;
      p.classList.toggle('is-on', on);
      if (on && p.classList.contains('pin')) names.push(p.querySelector('.pin__label').textContent);
    });
    caption.textContent = I18N.cap_prefix + names.join(', ') + '.';
  }

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
  var steps = Array.prototype.slice.call(form.querySelectorAll('.qstep'));
  var prog = Array.prototype.slice.call(form.querySelectorAll('.qprog li'));
  var btnBack = form.querySelector('.qback');
  var btnNext = form.querySelector('.qnext');
  var btnSend = form.querySelector('.qsend');
  var recapList = form.querySelector('.recap__list');
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var step = 0;

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
    steps.forEach(function (s, k) { s.hidden = k !== step; });
    prog.forEach(function (li, k) {
      if (k === step) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      li.classList.toggle('is-done', k < step);
    });
    btnBack.hidden = step === 0;
    btnNext.hidden = step === steps.length - 1;
    btnSend.hidden = step !== steps.length - 1;
    status.textContent = '';
    if (step === steps.length - 1) recap();
    if (focus !== false) steps[step].querySelector('.qstep__h').focus({ preventScroll: false });
  }

  if (document.documentElement.classList.contains('js')) goTo(0, false);
  else {
    btnBack.hidden = true;
    btnNext.hidden = true;
  }

  btnNext.addEventListener('click', function () { goTo(step + 1); });
  btnBack.addEventListener('click', function () { goTo(step - 1); });

  function fail(field, message) {
    field.setAttribute('aria-invalid', 'true');
    status.classList.remove('is-ok');
    status.textContent = message;
    field.focus();
  }

  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && step < steps.length - 1 && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      goTo(step + 1);
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (step < steps.length - 1) return goTo(step + 1);
    var nom = form.elements.nom;
    var email = form.elements.email;
    nom.removeAttribute('aria-invalid');
    email.removeAttribute('aria-invalid');
    status.textContent = '';

    if (!nom.value.trim()) return fail(nom, I18N.err_name);
    if (!emailRe.test(email.value.trim())) return fail(email, I18N.err_email);

    var lines = [
      I18N.name + ': ' + nom.value.trim(),
      I18N.email + ': ' + email.value.trim(),
      I18N.company + ': ' + (val('entreprise') || '-'),
      I18N.profil + ': ' + (val('profil') || I18N.tbd2),
      I18N.place + ': ' + (val('lieu') || I18N.tbd),
      I18N.period + ': ' + (val('periode') || I18N.tbd),
      I18N.zone + ': ' + (val('zone') || '-'),
      I18N.start + ': ' + (val('debut') || '-'),
      '',
      val('message')
    ];

    var href = 'mailto:contact@bkconsult.be'
      + '?subject=' + encodeURIComponent(I18N.subject + nom.value.trim())
      + '&body=' + encodeURIComponent(lines.join('\n'));

    status.classList.add('is-ok');
    status.textContent = I18N.ok;
    window.location.href = href;
  });
})();
