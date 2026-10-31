(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const nav = document.getElementById('nav');
  const toggle = document.querySelector('.nav-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileNav = window.matchMedia('(max-width: 900px)');

  const setNav = (open) => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (open) header.classList.remove('is-hidden');
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setNav(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        toggle.focus();
      }
    });
    mobileNav.addEventListener('change', () => setNav(false));
  }

  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const navOpen = toggle && toggle.getAttribute('aria-expanded') === 'true';
    header.classList.toggle('is-scrolled', y > 8);
    if (!navOpen && Math.abs(y - lastY) > 4) {
      header.classList.toggle('is-hidden', y > lastY && y > 140);
    }
    lastY = y;
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  onScroll();

  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (reduceMotion.matches) {
      el.textContent = String(target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) window.requestAnimationFrame(tick);
    };
    el.textContent = '0';
    window.requestAnimationFrame(tick);
  };

  const targets = document.querySelectorAll('.reveal, [data-observe]');

  const reveal = (el) => {
    el.classList.add('in');
    el.querySelectorAll('[data-count]').forEach(countUp);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    targets.forEach((el) => observer.observe(el));
  } else {
    targets.forEach(reveal);
  }

  const form = document.getElementById('contact-form');

  if (form) {
    const status = form.querySelector('.form__status');
    const select = form.elements.formule;
    const recipient = 'contact@bkconsult.be';

    document.querySelectorAll('[data-formule]').forEach((link) => {
      link.addEventListener('click', () => {
        if (select) select.value = link.dataset.formule;
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      status.classList.remove('is-error');

      if (!form.checkValidity()) {
        form.reportValidity();
        status.textContent = 'Merci de renseigner votre nom et une adresse e-mail valide.';
        status.classList.add('is-error');
        return;
      }

      const data = new FormData(form);
      const nom = String(data.get('nom') || '').trim();
      const email = String(data.get('email') || '').trim();
      const entreprise = String(data.get('entreprise') || '').trim();
      const formule = String(data.get('formule') || '').trim();
      const message = String(data.get('message') || '').trim();

      const subject = `Demande de contact${formule ? ` — formule ${formule}` : ''}`;
      const lines = [
        `Nom : ${nom}`,
        `E-mail : ${email}`,
        entreprise ? `Entreprise : ${entreprise}` : null,
        formule ? `Formule : ${formule}` : null,
        '',
        message
      ].filter((line) => line !== null);

      const href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      status.textContent = `Votre messagerie va s'ouvrir avec le message prérempli. Si rien ne se passe, écrivez-nous à ${recipient}.`;
      window.location.href = href;
    });
  }

  root.classList.add('ready');
})();
