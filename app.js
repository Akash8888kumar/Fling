/* FLING — premium motion layer
 *
 * Design is intentionally NOT defined here. This file only choreographs the
 * existing DOM using GSAP + ScrollTrigger. One motion system, no AOS, no
 * duplicate scroll listeners, no layout-property animation.
 *
 * Motion language: cinematic masks, scroll-linked depth, editorial parallax,
 * velocity-aware micro motion and tactile hover states.
 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;

  /* ---------------- AGE GATE ---------------- */
  const gate = $('#ageGate');
  const enter = $('#enterAge');
  const exit = $('#exitAge');

  if (gate) {
    if (sessionStorage.getItem('flingAgeOK') === '1') {
      gate.classList.add('hidden');
    }

    enter?.addEventListener('click', () => {
      sessionStorage.setItem('flingAgeOK', '1');
      if (!gsap || reduceMotion) {
        gate.classList.add('hidden');
        return;
      }
      gsap.timeline({ onComplete: () => gate.classList.add('hidden') })
        .to('.age-card', { y: -8, scale: .99, duration: .32, ease: 'power3.inOut' })
        .to(gate, { autoAlpha: 0, duration: .55, ease: 'power2.out' }, '-=.08');
    });

    exit?.addEventListener('click', () => { location.href = 'about:blank'; });
  }

  /* ---------------- NAV ---------------- */
  const nav = $('.site-nav');
  const menu = $('.menu');
  const links = $('.nav-links');

  const syncNav = () => nav?.classList.toggle('scrolled', scrollY > 56);
  addEventListener('scroll', syncNav, { passive: true });
  syncNav();

  menu?.addEventListener('click', () => {
    const open = links?.classList.toggle('open') ?? false;
    document.body.classList.toggle('menu-open', open);
  });

  links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    document.body.classList.remove('menu-open');
  }));

  if (!gsap || !ST) return;
  gsap.registerPlugin(ST);
  gsap.config({ nullTargetWarn: false });
  gsap.defaults({ overwrite: 'auto' });

  /* ---------------- 3D CAN ---------------- */
  const model = $('#flingModel');
  const tabs = $$('.tab');
  const modelName = $('.lab-name');
  const modelLine = $('.lab-line');

  const setModelLook = type => {
    if (!model?.model) return;
    const palette = {
      lager: { body: [0.035, .13, .42, 1], band: [.10, .68, .76, 1] },
      strong: { body: [0.035, .13, .42, 1], band: [.94, .43, .48, 1] }
    }[type];
    model.model.materials.forEach(mat => {
      const name = (mat.name || '').toLowerCase();
      if (name.includes('canbody')) mat.pbrMetallicRoughness.setBaseColorFactor(palette.body);
      if (name.includes('topband')) mat.pbrMetallicRoughness.setBaseColorFactor(palette.band);
    });
  };

  model?.addEventListener('load', () => setModelLook('lager'));

  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const strong = tab.dataset.can === 'strong';
    if (modelName) modelName.textContent = strong ? 'FLING STRONG' : 'FLING LAGER';
    if (modelLine) modelLine.textContent = strong
      ? 'Bolder energy. Coral top. Late-sunset mood.'
      : 'Crisp energy. Aqua top. Beach-day mood.';
    setModelLook(strong ? 'strong' : 'lager');

    if (!reduceMotion) {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(modelName, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .42 })
        .fromTo(modelLine, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .34 }, '-=.24');
    }
  }));

  if (model) {
    const observer = new IntersectionObserver(([entry]) => {
      if (reduceMotion) return;
      entry.isIntersecting ? model.setAttribute('auto-rotate', '') : model.removeAttribute('auto-rotate');
    }, { threshold: .08 });
    observer.observe(model);
  }

  if (reduceMotion) {
    ST.getAll().forEach(t => t.kill());
    return;
  }

  /* ---------------- HELPERS ---------------- */
  const reveal = (el, opts = {}) => {
    if (!el) return;
    gsap.fromTo(el,
      { autoAlpha: 0, y: opts.y ?? 34, clipPath: opts.mask === false ? 'none' : 'inset(0 0 100% 0)' },
      {
        autoAlpha: 1,
        y: 0,
        clipPath: opts.mask === false ? 'none' : 'inset(0 0 0% 0)',
        duration: opts.duration ?? .9,
        delay: opts.delay ?? 0,
        ease: opts.ease ?? 'expo.out',
        scrollTrigger: {
          trigger: opts.trigger || el,
          start: opts.start || 'top 82%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  };

  const scrub = (trigger, targets, from, to, options = {}) => {
    if (!trigger) return;
    gsap.fromTo(targets, from, {
      ...to,
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: options.start || 'top bottom',
        end: options.end || 'bottom top',
        scrub: options.scrub ?? 1
      }
    });
  };

  /* ---------------- TYPOGRAPHY: editorial word-mask reveals ----------------
   * Inspired by the text-reveal / scroll-text language commonly featured on
   * Awwwards. Text is split at runtime so the source HTML stays clean. The
   * animation only transforms opacity/transform/clip-path; layout is untouched.
   */
  const prepareText = (el) => {
    if (!el || el.dataset.textPrepared) return;
    el.dataset.textPrepared = '1';
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!node.nodeValue.trim()) return;
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/\s+/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const mask = document.createElement('span');
          const word = document.createElement('span');
          mask.className = 'fling-word-mask';
          word.className = 'fling-word';
          word.textContent = part;
          mask.appendChild(word);
          frag.appendChild(mask);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  };

  const textReveal = (el, opts = {}) => {
    if (!el) return;
    prepareText(el);
    const words = $$('.fling-word', el);
    if (!words.length) return;
    gsap.set(words, { yPercent: 115, rotateX: -32, transformOrigin: '50% 100%', autoAlpha: 0 });
    gsap.to(words, {
      yPercent: 0,
      rotateX: 0,
      autoAlpha: 1,
      duration: opts.duration || 1.05,
      ease: 'power4.out',
      stagger: opts.stagger || 0.045,
      scrollTrigger: {
        trigger: opts.trigger || el,
        start: opts.start || 'top 82%',
        toggleActions: 'play none none reverse'
      }
    });
  };

  const textRevealScrub = (el, opts = {}) => {
    if (!el) return;
    prepareText(el);
    const words = $$('.fling-word', el);
    if (!words.length) return;
    gsap.fromTo(words,
      { yPercent: 105, rotateX: -22, autoAlpha: .08 },
      {
        yPercent: 0,
        rotateX: 0,
        autoAlpha: 1,
        ease: 'none',
        stagger: opts.stagger || 0.035,
        scrollTrigger: {
          trigger: opts.trigger || el,
          start: opts.start || 'top 90%',
          end: opts.end || 'top 38%',
          scrub: opts.scrub || 0.85
        }
      }
    );
  };

  /* ---------------- HERO: cinematic opener ---------------- */
  const hero = $('.hero');
  if (hero) {
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro
      .from('.hero-copy .eyebrow', { y: 20, autoAlpha: 0, letterSpacing: '.38em', duration: .7 })
      .from('.hero h1', { autoAlpha: 1, duration: .01 }, '-=.38')
      .from('.hero-sub', { y: 18, autoAlpha: 0, duration: .6 }, '-=.4')
      .from('.hero .actions', { y: 14, autoAlpha: 0, duration: .48 }, '-=.3')
      .from('.hero-art', { x: 50, scale: .93, autoAlpha: 0, duration: 1.15 }, '-=1')
      .from('.hero-note', { x: 20, autoAlpha: 0, duration: .42 }, '-=.48')
      .from('.hero-bottom', { y: 12, autoAlpha: 0, duration: .4 }, '-=.3');

    textReveal($('.hero h1'), { start: 'top 86%', duration: 1.15, stagger: .065 });
    scrub(hero, '.hero-art', { y: 0, scale: 1 }, { y: -42, scale: 1.035 }, { start: 'top top', end: 'bottom top', scrub: 1.15 });
    scrub(hero, '.hero-copy', { y: 0 }, { y: -24 }, { start: 'top top', end: 'bottom top', scrub: 1.2 });
    scrub(hero, '.sun-disc', { rotation: 0, scale: 1 }, { rotation: 14, scale: 1.14 }, { start: 'top top', end: 'bottom top', scrub: 1.1 });
    scrub(hero, '.orbit-one', { x: 0, y: 0 }, { x: 24, y: -30 }, { start: 'top top', end: 'bottom top', scrub: 1.3 });
    scrub(hero, '.orbit-two', { x: 0, y: 0 }, { x: -18, y: 20 }, { start: 'top top', end: 'bottom top', scrub: 1.3 });
    scrub(hero, '.hero-bottom', { autoAlpha: 1 }, { autoAlpha: 0 }, { start: 'top top', end: '45% top', scrub: .8 });
  }

  /* ---------------- INTRO STRIP: horizontal drift ---------------- */
  const strip = $('.intro-strip');
  if (strip) {
    scrub(strip, '.strip-word', { xPercent: -12, opacity: .45 }, { xPercent: 4, opacity: 1 }, { start: 'top bottom', end: 'bottom top', scrub: .9 });
    scrub(strip, '.strip-copy', { xPercent: 10, opacity: .5 }, { xPercent: -3, opacity: 1 }, { start: 'top bottom', end: 'bottom top', scrub: .9 });
    scrub(strip, '.strip-dot', { scale: .35, rotation: -80 }, { scale: 1, rotation: 12 }, { start: 'top 90%', end: 'bottom 10%', scrub: .8 });
  }

  /* ---------------- SECTION HEADS: editorial masks ---------------- */
  $$('.section-head').forEach((head, i) => {
    const kicker = $('.kicker', head);
    const title = $('.display', head);
    const body = $('.body', head);
    const tl = gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 78%', toggleActions: 'play none none reverse' } });
    tl.from(kicker, { autoAlpha: 0, y: 12, letterSpacing: '.3em', duration: .45, ease: 'power3.out' })
      .from(body, { autoAlpha: 0, y: 18, duration: .58, ease: 'power3.out' }, '-=.18');

    textRevealScrub(title, { trigger: head, start: 'top 88%', end: 'top 38%', scrub: .8, stagger: .045 });
    if (title) scrub(head, title, { y: 10 }, { y: -8 }, { start: 'top 88%', end: 'bottom 22%', scrub: 1.2 });
  });

  /* ---------------- BEER: layered product choreography ---------------- */
  $$('.product-card').forEach((card, i) => {
    const image = $('img', card);
    const label = $('.product-label', card);
    const copy = $('.product-copy', card);
    const sticker = $('.sticker', card);
    const arrow = $('.card-arrow', card);
    const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 82%', toggleActions: 'play none none reverse' } });

    tl.from(card, { autoAlpha: 0, y: 70, scale: .965, clipPath: 'inset(12% 0 0 0 round 28px)', duration: 1.05, delay: i * .08, ease: 'expo.out' })
      .from(label, { autoAlpha: 0, y: -10, duration: .35 }, '-=.6')
      .from(copy, { autoAlpha: 0, y: 24, duration: .55 }, '-=.38')
      .from(sticker, { autoAlpha: 0, scale: .55, rotation: i ? 18 : -18, duration: .62, ease: 'back.out(1.7)' }, '-=.5')
      .from(arrow, { autoAlpha: 0, x: 12, duration: .3 }, '-=.28');

    if (image) {
      scrub(card, image, { yPercent: 4, scale: 1.035 }, { yPercent: -4, scale: 1.0 }, { start: 'top bottom', end: 'bottom top', scrub: 1 });
    }
    if (sticker) scrub(card, sticker, { y: 16, rotation: i ? 6 : -6 }, { y: -16, rotation: i ? 12 : -12 }, { start: 'top bottom', end: 'bottom top', scrub: 1.2 });

    if (!coarsePointer) {
      const quickX = gsap.quickTo(arrow, 'x', { duration: .45, ease: 'power3.out' });
      const quickY = gsap.quickTo(arrow, 'y', { duration: .45, ease: 'power3.out' });
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        quickX(((e.clientX - r.left) / r.width - .5) * 10);
        quickY(((e.clientY - r.top) / r.height - .5) * 10);
      });
      card.addEventListener('pointerleave', () => { quickX(0); quickY(0); });
    }
  });

  /* ---------------- MANIFESTO: FLING signature ---------------- */
  const manifesto = $('.manifesto');
  if (manifesto) {
    const inner = $('.manifesto-inner');
    gsap.fromTo(inner, { autoAlpha: 0, y: 70, scale: .94, clipPath: 'inset(12% 0 0 0)' }, {
      autoAlpha: 1, y: 0, scale: 1, clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: manifesto, start: 'top 78%', toggleActions: 'play none none reverse' }
    });
    textRevealScrub($('.manifesto .display'), { trigger: manifesto, start: 'top 92%', end: 'top 34%', scrub: .75, stagger: .07 });
    scrub(manifesto, '.manifesto .display', { y: 20, scale: .975 }, { y: -20, scale: 1.015 }, { start: 'top bottom', end: 'bottom top', scrub: 1.1 });
    scrub(manifesto, '.manifesto p', { y: 12 }, { y: -12 }, { start: 'top bottom', end: 'bottom top', scrub: 1.15 });

    $$('.manifesto .doodle').forEach((d, i) => {
      gsap.fromTo(d, { autoAlpha: 0, scale: .55, rotation: i % 2 ? -16 : 16 }, {
        autoAlpha: 1, scale: 1, rotation: 0, duration: .7, delay: i * .07, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: manifesto, start: 'top 74%', toggleActions: 'play none none reverse' }
      });
      scrub(manifesto, d, { y: 18 + i * 3 }, { y: -18 - i * 3 }, { start: 'top bottom', end: 'bottom top', scrub: 1.3 });
    });
  }

  /* ---------------- UNIVERSE: staggered depth ---------------- */
  const universe = $('.universe');
  if (universe) {
    $$('.u-card', universe).forEach((card, i) => {
      const inner = $('.u-inner', card);
      gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 84%', toggleActions: 'play none none reverse' } })
        .from(card, { autoAlpha: 0, y: i % 2 ? 64 : 42, x: i % 2 ? 14 : -14, scale: .96, clipPath: 'inset(10% 0 0 0 round 24px)', duration: .95, delay: i * .045, ease: 'expo.out' })
        .from(inner, { autoAlpha: 0, y: 22, duration: .52, ease: 'power3.out' }, '-=.5');
      scrub(card, inner, { y: 12 }, { y: -10 }, { start: 'top bottom', end: 'bottom top', scrub: 1.2 });
    });

    const image = $('.u-image img');
    if (image) scrub($('.u-image'), image, { scale: 1.13, xPercent: -1 }, { scale: 1, xPercent: 1 }, { start: 'top bottom', end: 'bottom top', scrub: 1.15 });
  }

  /* ---------------- CAN LAB: depth without fighting model controls ---------------- */
  const lab = $('.canlab');
  if (lab) {
    gsap.timeline({ scrollTrigger: { trigger: lab, start: 'top 74%', toggleActions: 'play none none reverse' } })
      .from('.lab-copy', { autoAlpha: 0, x: -38, duration: .85, ease: 'expo.out' })
      .from('.lab-stage', { autoAlpha: 0, x: 38, scale: .97, duration: 1, ease: 'expo.out' }, '-=.68')
      .from('.lab-meta .meta', { autoAlpha: 0, y: 18, stagger: .07, duration: .4 }, '-=.46');

    scrub(lab, '.model-frame', { y: 34, rotation: -1 }, { y: -34, rotation: 1 }, { start: 'top bottom', end: 'bottom top', scrub: 1.15 });
    scrub(lab, '.model-glow', { scale: .92, opacity: .22 }, { scale: 1.08, opacity: .4 }, { start: 'top bottom', end: 'bottom top', scrub: 1.2 });
    scrub(lab, '.model-caption', { y: 8, opacity: .45 }, { y: -8, opacity: 1 }, { start: 'top 85%', end: 'bottom 15%', scrub: 1 });
  }

  /* ---------------- MERCH: editorial image reveal ---------------- */
  $$('.merch-card').forEach((card, i) => {
    const visual = $('.merch-visual', card);
    const copy = $('.merch-copy', card);
    gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 84%', toggleActions: 'play none none reverse' } })
      .from(card, { autoAlpha: 0, y: 58, scale: .97, clipPath: 'inset(8% 0 0 0 round 24px)', duration: .95, delay: i * .055, ease: 'expo.out' })
      .from(visual, { autoAlpha: 0, scale: .93, duration: .68 }, '-=.56')
      .from(copy, { autoAlpha: 0, y: 18, duration: .45 }, '-=.34');
    scrub(card, visual, { y: 18, scale: 1.015 }, { y: -18, scale: 1 }, { start: 'top bottom', end: 'bottom top', scrub: 1.1 });
  });

  /* ---------------- UPDATES + FOOTER ---------------- */
  const updates = $('.updates');
  if (updates) {
    gsap.timeline({ scrollTrigger: { trigger: updates, start: 'top 80%', toggleActions: 'play none none reverse' } })
      .from('.update-box', { autoAlpha: 0, y: 64, scale: .975, clipPath: 'inset(8% 0 0 0 round 30px)', duration: 1, ease: 'expo.out' })
      .from('.update-box h2', { autoAlpha: 1, duration: .01 }, '-=.62')
      .from('.update-doodles', { autoAlpha: 0, y: 10, duration: .35 }, '-=.3')
      .from('.form .body, .field, .form .btn', { autoAlpha: 0, y: 16, stagger: .08, duration: .4 }, '-=.38');

    textRevealScrub($('.update-box h2'), { trigger: updates, start: 'top 90%', end: 'top 42%', scrub: .8, stagger: .075 });
  }

  const footer = $('.footer');
  if (footer) {
    gsap.fromTo('.footer-top', { autoAlpha: 0, y: 42 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: footer, start: 'top 88%', toggleActions: 'play none none reverse' } });
    textRevealScrub($('.footer-top .display'), { trigger: footer, start: 'top 94%', end: 'top 48%', scrub: .85, stagger: .06 });
    gsap.fromTo('.footer-bottom', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .55, scrollTrigger: { trigger: footer, start: 'top 78%', toggleActions: 'play none none reverse' } });
  }

  /* ---------------- TACTILE MICRO-INTERACTIONS ---------------- */
  if (!coarsePointer) {
    $$('.btn, .nav-cta, .tab, .exit').forEach(el => {
      const x = gsap.quickTo(el, 'x', { duration: .32, ease: 'power3.out' });
      const y = gsap.quickTo(el, 'y', { duration: .32, ease: 'power3.out' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        x(((e.clientX - r.left) / r.width - .5) * 3);
        y(((e.clientY - r.top) / r.height - .5) * 3 - 1);
      });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  /* One refresh after fonts/layout settle. */
  addEventListener('load', () => ST.refresh(), { once: true });
  setTimeout(() => ST.refresh(), 250);
})();
