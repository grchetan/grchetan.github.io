/* ============================================================
   THEME MANAGER — Dark / Light / System
   javascript/theme.js  |  Include on EVERY page in <head>
   Runs BEFORE body renders — prevents flash of wrong theme.
   ============================================================ */
(function () {
  const KEY = 'cp-theme';

  function getEffective(mode) {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    // system
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(mode) {
    const effective = getEffective(mode);
    const isDark = effective === 'dark';

    // index.html style (body.dark-mode class)
    document.body.classList.toggle('dark-mode', isDark);

    // blog.html + other pages style (html[data-theme])
    document.documentElement.setAttribute('data-theme', effective);

    // index.html background videos
    const lv = document.querySelector('.background-video.light-mode');
    const dv = document.querySelector('.background-video.dark-mode');
    if (lv && dv) {
      lv.style.display = isDark ? 'none' : 'block';
      dv.style.display = isDark ? 'block' : 'none';
    }

    // Update pill buttons active state
    document.querySelectorAll('.tp-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  function setTheme(mode) {
    localStorage.setItem(KEY, mode);
    applyTheme(mode);
  }

  // React to OS-level preference changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if ((localStorage.getItem(KEY) || 'system') === 'system') {
        applyTheme('system');
      }
    });

  // Run immediately — before DOM paint, no flash
  applyTheme(localStorage.getItem(KEY) || 'system');

  // Expose globally
  window.ThemeManager = { setTheme, applyTheme };
})();
