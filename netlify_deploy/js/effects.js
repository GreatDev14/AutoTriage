/* ============================================
   AUTO TRIAGE — EFFECTS (NO THREE.JS, FAST)
   Pure Canvas 2D + CSS — Smooth 60fps
   ============================================ */
(function () {
  'use strict';

  // ============================================
  // 1. CANVAS 2D PARTICLE NETWORK
  // ============================================
  function initParticleCanvas() {
    // Skip canvas entirely on mobile — saves significant CPU/battery
    // Active on all devices
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
      const hero = document.getElementById('hero');
      if (!hero) return;
      W = canvas.width  = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Particles
    const COUNT = window.innerWidth < 768 ? 40 : 70;
    const LINK  = window.innerWidth < 768 ? 100 : 130;
    const particles = [];

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1.5 + Math.random() * 1.5
      });
    }

    let mx = W / 2, my = H / 2;
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    }, { passive: true });

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Move & draw particles
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,245,240,0.55)';
        ctx.fill();
      }

      // Draw lines between close particles
      ctx.lineWidth = 0.6;
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK) {
            const alpha = (1 - dist / LINK) * 0.2;
            ctx.strokeStyle = `rgba(230,57,70,${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Mouse repel — nearby particles drift away slightly
      for (const p of particles) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 80 && d > 0) {
          p.x += (dx / d) * 0.5;
          p.y += (dy / d) * 0.5;
        }
      }
    }

    // Use requestAnimationFrame properly — throttle to ~40fps to save CPU
    let last = 0;
    function loop(ts) {
      if (ts - last > 24) { // ~40fps cap
        draw();
        last = ts;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // ============================================
  // 2. GLOW ORBS (Pure CSS, appended once)
  // ============================================
  function initGlowOrbs() {
    ['glow-orb-1', 'glow-orb-2', 'glow-orb-3'].forEach(cls => {
      const el = document.createElement('div');
      el.className = 'glow-orb ' + cls;
      document.body.appendChild(el);
    });
  }

  // ============================================
  // 3. ECG WAVE
  // ============================================
  function initECG() {
    // Active on all devices // Skip ECG on mobile
    const hero = document.getElementById('hero');
    if (!hero) return;
    const c = document.createElement('div');
    c.id = 'ecg-container';
    const seg = 'M0,60 L40,60 L50,56 L60,60 L78,60 L88,22 L98,78 L108,46 L118,60 L160,60';
    c.innerHTML = `<svg id="ecg-svg" viewBox="0 0 320 80" preserveAspectRatio="none">
      <path class="ecg-path" d="${seg} M160,60 L200,60 L210,56 L220,60 L238,60 L248,22 L258,78 L268,46 L278,60 L320,60"/>
    </svg>`;
    hero.appendChild(c);
  }

  // ============================================
  // 4. GRID BG
  // ============================================
  function initGridBg() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const g = document.createElement('div');
    g.className = 'grid-bg';
    hero.appendChild(g);
  }

  // ============================================
  // 5. SCANLINE
  // ============================================
  function initScanline() {
    // Active on all devices // Skip scanline on mobile
    const hero = document.getElementById('hero');
    if (!hero) return;
    const sl = document.createElement('div');
    sl.className = 'hero-scanline';
    hero.appendChild(sl);
  }

  // ============================================
  // 6. FLOATING MINI PARTICLES
  // ============================================
  function initFloatingParticles() {
    // Skip entirely on mobile — CSS animations still drain battery
    // Active on all devices
    const hero = document.getElementById('hero');
    if (!hero) return;
    const n = 12;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'float-particle';
      p.style.cssText =
        `left:${Math.random()*100}%;bottom:0;` +
        `--dur:${8+Math.random()*8}s;` +
        `--drift:${(Math.random()-0.5)*50}px;` +
        `width:${2+Math.random()*3}px;height:${2+Math.random()*3}px;` +
        `animation-delay:-${Math.random()*10}s;` +
        `background:${Math.random()>0.5?'#e63946':'rgba(245,245,240,0.5)'};`;
      hero.appendChild(p);
    }
  }

  // ============================================
  // 7. TYPING TEXT
  // ============================================
  function initTyping() {
    const el = document.querySelector('.hero-eyebrow');
    if (!el) return;
    const txt = el.textContent.trim();
    el.textContent = '';
    el.style.opacity = '1';
    el.style.animation = 'none';
    let i = 0;
    function type() {
      if (i < txt.length) { el.textContent += txt[i++]; setTimeout(type, 40 + Math.random() * 20); }
    }
    setTimeout(type, 700);
  }

  // ============================================
  // 8. REVEAL ON SCROLL (REMOVED — Handled by GSAP/Base Logic)
  // ============================================
  
  // ============================================
  // 9. SECTION TITLE UNDERLINE (Handled by CSS/GSAP)
  // ============================================

  // ============================================
  // 10. ANIMATED COUNTERS
  // ============================================
  function initCounters() {
    const defs = [
      { target: 50,   suffix: 'K+' },
      { target: 98,   suffix: '%' },
      { target: 3200, suffix: '+' },
      { target: 30,   suffix: 's' }
    ];
    const els = document.querySelectorAll('.as-num');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const i = Array.from(els).indexOf(e.target);
        if (i < 0 || !defs[i]) return;
        const { target, suffix } = defs[i];
        const t0 = performance.now();
        const dur = 1600;
        (function tick(now) {
          const p = Math.min((now - t0) / dur, 1);
          e.target.textContent = Math.floor((1-(1-p)**3) * target).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    els.forEach(el => obs.observe(el));
  }

  // ============================================
  // 11. 3D TILT CARDS (Desktop Only)
  // ============================================
  function initTiltCards() {
    // Active on all devices
    document.querySelectorAll('.feature-block, .how-step').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  - 0.5) * 8;
        const y = -((e.clientY - r.top)  / r.height - 0.5) * 6;
        card.style.transform    = `perspective(700px) rotateX(${y}deg) rotateY(${x}deg)`;
        card.style.transition   = 'none';
      }, { passive: true });
      card.addEventListener('mouseleave', () => {
        card.style.transform  = '';
        card.style.transition = 'transform 0.5s ease';
      }, { passive: true });
    });
  }

  // ============================================
  // 12. MAGNETIC BUTTON GLOW
  // ============================================
  function initMagneticButtons() {
    // Active on all devices
    document.querySelectorAll('.btn-primary').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(0) + '%');
        btn.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100).toFixed(0) + '%');
      }, { passive: true });
    });
  }

  // ============================================
  // 13. CURSOR TRAIL (3 dots, desktop only)
  // ============================================
  function initCursorTrail() {
    // Active on all devices
    const TRAIL = 3;
    const dots = Array.from({ length: TRAIL }, (_, i) => {
      const d = document.createElement('div');
      d.style.cssText =
        `position:fixed;width:${5-i}px;height:${5-i}px;border-radius:50%;` +
        `background:#e63946;pointer-events:none;z-index:99997;` +
        `opacity:${(TRAIL-i)/TRAIL*0.45};transform:translate(-50%,-50%);` +
        `mix-blend-mode:screen;left:-100px;top:-100px;will-change:left,top;`;
      document.body.appendChild(d);
      return { el: d, x: -100, y: -100 };
    });

    let mx = -100, my = -100;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

    function loop() {
      dots[0].x += (mx - dots[0].x) * 0.4;
      dots[0].y += (my - dots[0].y) * 0.4;
      for (let i = 1; i < TRAIL; i++) {
        dots[i].x += (dots[i-1].x - dots[i].x) * 0.5;
        dots[i].y += (dots[i-1].y - dots[i].y) * 0.5;
      }
      dots.forEach(d => { d.el.style.left = d.x + 'px'; d.el.style.top = d.y + 'px'; });
      requestAnimationFrame(loop);
    }
    loop();
  }

  // ============================================
  // INIT ALL
  // ============================================
  function init() {
    initGlowOrbs();
    initGridBg();
    initScanline();
    initECG();
    initFloatingParticles();
    initParticleCanvas();
    initCounters();
    initTiltCards();
    initMagneticButtons();
    initCursorTrail();
    initTyping();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
