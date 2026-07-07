/**
 * PREMIUM CURSOR GLOW FOLLOWER
 * 
 * Features:
 * - Keeps browser default cursor fully visible and functional (no override).
 * - Spawns a soft glowing color spotlight orb that floats behind the default cursor.
 * - Buttery smooth spring inertia tracking (lerp).
 * - Reacts dynamically to dark and light modes.
 * - Interactive states: Eases in, grows larger, and shifts colors (Cyan/Blue to Pink/Purple) when hovering over interactive elements.
 * - Optimized 60 FPS rendering using translate3d (GPU accelerated).
 */

(function () {
  // 1. Deactivate on Touch/Mobile devices and screens smaller than 1025px
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice || window.innerWidth <= 1024) {
    return;
  }

  // 2. Inject CSS rules for the soft glow follower
  const style = document.createElement('style');
  style.textContent = `
    .cursor-glow-follower {
      position: fixed;
      top: 0;
      left: 0;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      /* Premium cyan to blue soft radial gradient */
      background: radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(59, 130, 246, 0.05) 60%, transparent 100%);
      pointer-events: none;
      z-index: 99998;
      transform: translate3d(-50%, -50%, 0);
      will-change: transform, width, height;
      transition: 
        width 0.3s cubic-bezier(0.25, 1, 0.5, 1),
        height 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      mix-blend-mode: screen;
      filter: blur(3px);
    }
    
    /* Light mode adjustments (blend mode change) */
    [data-theme='light'] .cursor-glow-follower,
    body.light-mode .cursor-glow-follower {
      background: radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(59, 130, 246, 0.03) 60%, transparent 100%);
      mix-blend-mode: multiply;
    }
    
    /* Expand and transition to pink/purple palette on hover */
    .cursor-glow-follower.hover {
      width: 76px;
      height: 76px;
      background: radial-gradient(circle, rgba(236, 72, 153, 0.38) 0%, rgba(168, 85, 247, 0.06) 60%, transparent 100%);
    }
    
    [data-theme='light'] .cursor-glow-follower.hover,
    body.light-mode .cursor-glow-follower.hover {
      background: radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.03) 60%, transparent 100%);
    }
    
    @media (max-width: 1024px) {
      .cursor-glow-follower {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  // 3. Inject follower DOM element
  const follower = document.createElement('div');
  follower.className = 'cursor-glow-follower';
  document.body.appendChild(follower);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let followerX = mouseX;
  let followerY = mouseY;

  const lerp = 0.1; // Smooth float lag factor

  // Track coordinates
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Render loop (RAF, GPU accelerated)
  function render() {
    followerX += (mouseX - followerX) * lerp;
    followerY += (mouseY - followerY) * lerp;
    
    follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;
    
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  // 4. Hover states on interactive components
  const selectTargets = 'a, button, .nav-link, .card, .service-card, .theme-pill, .hamburger, .visit-counter-badge, .blog-card, .mini-post, .filter-btn, input, textarea, [role="button"]';
  
  function addHoverEffects() {
    const elements = document.querySelectorAll(selectTargets);
    elements.forEach(el => {
      if (el.dataset.cursorRegistered) return;
      el.dataset.cursorRegistered = 'true';

      el.addEventListener('mouseenter', () => {
        follower.classList.add('hover');
      });
      el.addEventListener('mouseleave', () => {
        follower.classList.remove('hover');
      });
    });
  }

  addHoverEffects();
  
  // Watch for dynamic DOM modifications to apply effects on new elements
  const observer = new MutationObserver(addHoverEffects);
  observer.observe(document.body, { childList: true, subtree: true });
})();
