 /**
 * Theme Engine - Full Light/Dark Mode Switcher
 */

window.themeModule = (() => {
  const getPreferredTheme = () => {
    const saved = localStorage.getItem('autotriage-theme');
    if (saved && (saved === 'light' || saved === 'dark')) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };

  const updateIcons = (theme) => {
    const isLight = theme === 'light';
    const headerBtn = document.getElementById('headerThemeToggle');
    if (headerBtn) {
      headerBtn.style.display = 'flex';
      headerBtn.innerHTML = isLight
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      headerBtn.style.color = isLight ? '#0EA5E9' : '#ffb03a';
    }

    const modalToggleBtn = document.getElementById('modalThemeToggleBtn');
    if (modalToggleBtn) {
      modalToggleBtn.innerHTML = isLight ? '☀️ LIGHT MODE' : '🌙 DARK MODE';
      modalToggleBtn.style.background = isLight ? 'rgba(14,165,233,0.12)' : 'rgba(255,176,58,0.12)';
      modalToggleBtn.style.borderColor = isLight ? 'rgba(14,165,233,0.3)' : 'rgba(255,176,58,0.3)';
      modalToggleBtn.style.color = isLight ? '#0EA5E9' : '#ffb03a';
    }

    const modalThemeSubtext = document.getElementById('modalThemeSubtext');
    if (modalThemeSubtext) {
      modalThemeSubtext.innerText = isLight ? 'Light Mode Active' : 'Dark Silk Mode Active';
    }
  };

  const setTheme = (theme) => {
    const validTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', validTheme);
    try { localStorage.setItem('autotriage-theme', validTheme); } catch(e) {}
    
    updateIcons(validTheme);

    if (window.app && typeof window.app.refreshTheme === 'function') {
      window.app.refreshTheme();
    }
  };

  const toggle = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  // Initial Load
  const initTheme = getPreferredTheme();
  setTheme(initTheme);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTheme(getPreferredTheme()));
  } else {
    setTheme(getPreferredTheme());
  }

  return { toggle, setTheme, getPreferredTheme };
})();
