/* ============================================================
   CHETAN PRAJAPAT — MAIN SCRIPT
   script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  /* ===================== NAVBAR — SCROLL SHADOW + HAMBURGER ===================== */
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navDrawer = document.getElementById('navDrawer');

  if (hamburger && navDrawer) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      navDrawer.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      navDrawer.setAttribute('aria-hidden', !isOpen);
    });

    navDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navDrawer.classList.remove('open');
      });
    });
  }

  // Global scroll listener for Navbar scroll shadow
  if (navbar) {
    window.addEventListener('scroll', () => {
      const scrollTop = document.documentElement.scrollTop;
      navbar.classList.toggle('scrolled', scrollTop > 10);
    });
  }

  /* ===================== SCROLL — PROGRESS + BACK TO TOP ===================== */
  const scrollBtn = document.getElementById('scrollTopBtn');
  const progressCircle = document.getElementById('progressCircle');

  if (scrollBtn && progressCircle) {
    const circleLength = progressCircle.getTotalLength();

    // Set dasharray via JS so it matches getTotalLength exactly
    progressCircle.style.strokeDasharray = circleLength;
    progressCircle.style.strokeDashoffset = circleLength;

    scrollBtn.style.display = 'none';

    window.addEventListener('scroll', () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrollPct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      progressCircle.style.strokeDashoffset =
        circleLength - (scrollPct / 100) * circleLength;

      scrollBtn.style.display = scrollTop > 100 ? 'flex' : 'none';
    });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
// Theme logic has been moved to javascript/theme.js
// It now runs from <head> before DOM paint — no flash.
