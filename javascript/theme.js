/* ============================================================
   THEME MANAGER — Dark / Light / System
   javascript/theme.js  |  Include on EVERY page in <head>
   Runs BEFORE body renders — prevents flash of wrong theme.
   ============================================================ */
(function () {
  // Prevent transitions during page load
  document.documentElement.classList.add('preload');
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.documentElement.classList.remove('preload');
    }, 50);
  });

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

    // 1. Apply immediately to HTML element (this exists even in <head>)
    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.classList.toggle('dark-mode', isDark);

    // 2. Also toggle class on body when DOM is loaded
    if (document.body) {
      document.body.classList.toggle('dark-mode', isDark);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.toggle('dark-mode', isDark);
      });
    }

    // index.html background videos (only runs if elements are already loaded)
    const toggleVideos = () => {
      const lv = document.querySelector('.background-video.light-mode');
      const dv = document.querySelector('.background-video.dark-mode');
      if (lv && dv) {
        lv.style.display = isDark ? 'none' : 'block';
        dv.style.display = isDark ? 'block' : 'none';
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', toggleVideos);
    } else {
      toggleVideos();
    }

    // Update pill buttons active state
    const updateButtons = () => {
      document.querySelectorAll('.tp-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateButtons);
    } else {
      updateButtons();
    }
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
