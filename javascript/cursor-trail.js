/**
 * PREMIUM INTERACTIVE CURSOR TRAIL EFFECT
 * 
 * Features:
 * - Keeps default browser system cursor visible and fully functional.
 * - Draws smooth, organic, glowing canvas particle trails.
 * - Uses physics-based motion with velocity, friction, and natural ease-out decay.
 * - Uses a premium color palette (Purple, Cyan, Pink, Blue) with shadow-glowing properties.
 * - Fully responsive and self-contained; dynamically handles resizing.
 * - Optimized with requestAnimationFrame and strict resource cleanup to maintain 60 FPS.
 * - Ignores mouse events (pointer-events: none) so it never interferes with webpage clicks or hovers.
 */

(function () {
  // Prevent run on mobile/tablets for performance and touch friendliness
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice || window.innerWidth <= 1024) {
    return;
  }

  // Create Canvas Element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set Canvas Styles for fullscreen background coverage without blocking clicks
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.userSelect = 'none';
  canvas.style.zIndex = '99999'; // Keep on top of page content but behind overlays if necessary

  document.body.appendChild(canvas);

  // Set initial viewport bounds
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Dynamically handle window resize events
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const mouse = { x: null, y: null };

  // Premium Color Palette
  // Colors formatted with template values for flexible alpha transparency manipulation
  const colors = [
    'rgba(168, 85, 247, ', // Neon Purple
    'rgba(6, 182, 212, ',  // Cyan/Turquoise
    'rgba(236, 72, 153, ', // Hot Pink
    'rgba(59, 130, 246, '  // Vibrant Blue
  ];

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      
      // Random starting size to avoid repetitive, uniform trails
      this.size = Math.random() * 5 + 4;
      
      // Velocity vectors (random speed/direction)
      this.vx = (Math.random() - 0.5) * 2.2;
      this.vy = (Math.random() - 0.5) * 2.2 - 0.4; // Subtle upward float bias
      
      // Assign random color from color palette
      this.colorBase = colors[Math.floor(Math.random() * colors.length)];
      
      // Initialize transparency and ease-out decay properties
      this.alpha = 1.0;
      this.decay = Math.random() * 0.015 + 0.012; // Natural speed of fading out
      this.friction = 0.98; // Natural air resistance to slow down particle speed
    }

    update() {
      // Apply friction (physics) to slow particles down smoothly
      this.vx *= this.friction;
      this.vy *= this.friction;

      this.x += this.vx;
      this.y += this.vy;

      // Natural ease-out decay rate for alpha transparency and scale size
      this.alpha -= this.decay;
      this.size -= 0.06;
    }

    draw() {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);

      // Glow rendering configs using context shadows (optimized performance)
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.colorBase + '0.75)';
      ctx.fillStyle = this.colorBase + Math.max(0, this.alpha) + ')';

      ctx.fill();
      ctx.restore();
    }
  }

  // Handle Mouse Movement to update coordinates and spawn particles
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // Spawn 2 particles per mouse move increment for a rich, dense trail effect
    for (let i = 0; i < 2; i++) {
      particles.push(new Particle(mouse.x, mouse.y));
    }
  });

  // Main Render Loop utilizing requestAnimationFrame
  function render() {
    // Clear canvas viewport at 60 FPS
    ctx.clearRect(0, 0, width, height);

    // Render & clean up active particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();

      // Check decay threshold to remove dead items and prevent memory leaks
      if (p.alpha <= 0 || p.size <= 0) {
        particles.splice(i, 1);
      } else {
        p.draw();
      }
    }

    requestAnimationFrame(render);
  }

  // Start Animation Loop
  requestAnimationFrame(render);
})();
