/* ============================================
   AUTO TRIAGE — GSAP ANIMATIONS
   ScrollTrigger • Timelines • Parallax
   ============================================ */

(function () {
  'use strict';

  function initGSAP() {
    if (typeof gsap === 'undefined') return;

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // ============================================
    // 2. ENTRANCES (Nav & Hero)
    // ============================================
    gsap.from('nav', { duration: 0.8, opacity: 0, y: -20, ease: 'power2.out' });

    // App Hero Timeline (if on app.html)
    if (document.querySelector('.hero-logo-center')) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-logo-center img', { duration: 0.9, opacity: 0, scale: 0.6, ease: 'back.out(1.8)' }, 0.2)
        .from('.hero-title', { duration: 1, opacity: 0, y: 60, skewY: 3 }, 0.5)
        .from('.hero-sub', { duration: 0.8, opacity: 0, y: 24 }, 0.85)
        .from('.hero-btns > *', { duration: 0.6, opacity: 0, y: 16, stagger: 0.1 }, 1.05)
        .from('.hero-stats > div', { duration: 0.6, opacity: 0, y: 20, stagger: 0.12 }, 1.2);
    }

    // ============================================
    // 3. MARQUEE PARALLAX
    // ============================================
    gsap.to('.marquee-track', {
      scrollTrigger: {
        trigger: '.marquee',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      },
      x: -60,
      ease: 'none'
    });

    // ============================================
    // 4. ABOUT SECTION — SPLIT REVEAL
    // ============================================
    gsap.to('.about-left', {
      scrollTrigger: {
        trigger: '#about',
        start: 'top 75%',
        toggleActions: 'play none none none'
      },
      duration: 1.1,
      opacity: 1,
      x: 0,
      ease: 'power3.out'
    });

    gsap.to('.about-right', {
      scrollTrigger: {
        trigger: '#about',
        start: 'top 75%',
        toggleActions: 'play none none none'
      },
      duration: 1.1,
      opacity: 1,
      x: 0,
      ease: 'power3.out'
    });

    gsap.from('.about-stat', {
      scrollTrigger: {
        trigger: '.about-right',
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      duration: 0.7,
      opacity: 0,
      y: 30,
      stagger: 0.12,
      ease: 'power2.out'
    });

    // ============================================
    // 5. HOW IT WORKS — STAGGER STEPS
    // ============================================
    gsap.to('.how-step', {
      scrollTrigger: {
        trigger: '#how',
        start: 'top 70%',
        toggleActions: 'play none none none'
      },
      duration: 0.8,
      opacity: 1,
      y: 0,
      stagger: 0.18,
      ease: 'power3.out'
    });

    // ============================================
    // 6. VIDEO SECTION — SCALE IN
    // ============================================
    gsap.to('.video-wrap', {
      scrollTrigger: {
        trigger: '#video',
        start: 'top 75%',
        toggleActions: 'play none none none'
      },
      duration: 1.2,
      opacity: 1,
      scale: 1,
      ease: 'power3.out'
    });

    // ============================================
    // 7. FEATURES — ALTERNATING SLIDE
    // ============================================
    gsap.utils.toArray('.feature-block').forEach((block, i) => {
      gsap.to(block, {
        scrollTrigger: {
          trigger: block,
          start: 'top 80%',
          toggleActions: 'play none none none'
        },
        duration: 0.9,
        opacity: 1,
        x: 0,
        ease: 'power3.out'
      });
    });

    // ============================================
    // 8. JOIN SECTION — SPLIT REVEAL
    // ============================================
    if (document.querySelector('.join-left')) {
      gsap.to('.join-left', {
        scrollTrigger: {
          trigger: '#join',
          start: 'top 75%',
          toggleActions: 'play none none none'
        },
        duration: 1,
        opacity: 1,
        x: 0,
        ease: 'power3.out'
      });
    }

    if (document.querySelector('.join-right')) {
      gsap.to('.join-right', {
        scrollTrigger: {
          trigger: '#join',
          start: 'top 75%',
          toggleActions: 'play none none none'
        },
        duration: 1,
        opacity: 1,
        x: 0,
        ease: 'power3.out',
        delay: 0.15
      });
    }

    if (document.querySelector('.join-benefit')) {
      gsap.from('.join-benefit', {
        scrollTrigger: {
          trigger: '.join-benefits',
          start: 'top 80%',
          toggleActions: 'play none none none'
        },
        duration: 0.6,
        opacity: 0,
        y: 20,
        stagger: 0.1,
        ease: 'power2.out'
      });
    }

    // ============================================
    // 9. DOWNLOAD OPTIONS — SCALE IN STAGGER
    // ============================================
    if (document.querySelector('.dl-card')) {
      gsap.fromTo('.dl-card', 
        { opacity: 0, y: 40, scale: 0.96 },
        {
          scrollTrigger: {
            trigger: '#download',
            start: 'top 75%',
            toggleActions: 'play none none none'
          },
          duration: 0.9,
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.2,
          ease: 'back.out(1.4)'
        }
      );
    }

    // ============================================
    // 10. PLATFORM BADGES — BOUNCE IN
    // ============================================
    if (document.querySelector('.plat-badge')) {
      gsap.from('.plat-badge', {
        scrollTrigger: {
          trigger: '.platform-badges',
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        duration: 0.7,
        opacity: 0,
        y: 25,
        scale: 0.9,
        stagger: 0.12,
        ease: 'back.out(1.8)'
      });
    }

    // ============================================
    // 11. GENERAL REVEAL HANDLER (.reveal)
    // ============================================
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none'
        },
        duration: 0.8,
        opacity: 1,
        y: 0,
        scale: 1,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    // ============================================
    // 11b. STAGGERED COMPONENTS (App-specific)
    // ============================================
    gsap.utils.toArray('.ai-box, .mech-card, .ride-card').forEach((el, i) => {
      gsap.from(el, { 
        scrollTrigger: { trigger: el, start: 'top 88%' }, 
        duration: 0.7, opacity: 0, y: 24, scale: 0.97, 
        stagger: 0.1, ease: 'back.out(1.4)', delay: i * 0.05 
      });
    });

    // ============================================
    // 12. PARALLAX HERO BG (scroll depth)
    // ============================================
    gsap.to('.hero-bg', {
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      },
      y: 80,
      ease: 'none'
    });

    // ============================================
    // 13. HERO TITLE PARALLAX ON SCROLL
    // ============================================
    gsap.to('.hero-title', {
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5
      },
      y: -60,
      opacity: 0,
      ease: 'none'
    });

    // ============================================
    // 14. FOOTER REVEAL
    // ============================================
    gsap.from('footer', {
      scrollTrigger: {
        trigger: 'footer',
        start: 'top 90%',
        toggleActions: 'play none none none'
      },
      duration: 1,
      opacity: 0,
      y: 40,
      ease: 'power3.out'
    });

    // ============================================
    // 15. EMERGENCY BAR SLIDE UP
    // ============================================
    if (document.querySelector('.emergency-bar')) {
      gsap.from('.emergency-bar', {
        scrollTrigger: {
          trigger: '.emergency-bar',
          start: 'top 95%',
          toggleActions: 'play none none none'
        },
        duration: 0.8,
        opacity: 0,
        y: 30,
        ease: 'power2.out'
      });
    }

    // ============================================
    // 16. SCROLL-TRIGGERED COUNTER ANIMATION
    // ============================================
    gsap.utils.toArray('.badge-num').forEach(el => {
      const raw = el.textContent.replace(/[^0-9.]/g, '');
      const target = parseFloat(raw);
      const suffix = el.textContent.replace(/[0-9.]/g, '');
      if (isNaN(target)) return;

      const obj = { val: 0 };
      gsap.to(obj, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        duration: 1.8,
        val: target,
        ease: 'power2.out',
        onUpdate() {
          el.textContent = (Number.isInteger(target)
            ? Math.round(obj.val)
            : obj.val.toFixed(1)) + suffix;
        }
      });
    });

    console.log('[GSAP] All animations initialized ✅');
  }

  // Deferred scripts: GSAP loads after DOM, so check readyState
  function runInit() {
    if (typeof gsap !== 'undefined') initGSAP();
  }
  if (document.readyState === 'complete') {
    runInit();
  } else {
    window.addEventListener('load', runInit);
  }

})();
