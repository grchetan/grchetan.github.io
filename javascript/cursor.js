/**
 * PREMIUM INTERACTIVE MOUSE CURSOR EFFECT
 * High-performance, GPU-accelerated cursor follower with particle trail,
 * magnetic attraction, click ripples, and high-velocity electric spark distortion.
 */

(function () {
  // 1. Deactivate on Touch/Mobile devices and screens smaller than 1025px
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice || window.innerWidth <= 1024) {
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    // 2. Inject Cursor Elements
    const follower = document.createElement('div');
    follower.className = 'custom-cursor-follower';
    
    const glow = document.createElement('div');
    glow.className = 'custom-cursor-glow';
    
    const canvas = document.createElement('canvas');
    canvas.id = 'cursor-canvas';
    
    document.body.appendChild(follower);
    document.body.appendChild(glow);
    document.body.appendChild(canvas);
    
    follower.style.display = 'block';
    glow.style.display = 'block';
    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    
    // 3. Coordinate Tracking
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let followerPos = { x: mouse.x, y: mouse.y };
    let glowPos = { x: mouse.x, y: mouse.y };
    
    // Velocity calculation for quick-swipe electric trail
    let lastMouse = { x: mouse.x, y: mouse.y };
    let velocity = 0;
    
    // Lerp constants (spring delays)
    const followerLerp = 0.16;
    const glowLerp = 0.08;
    
    // Magnetic state tracking
    let isMagnetic = false;
    let magneticTarget = null;
    
    // Particles and Ripples pools
    const particles = [];
    const shockwaves = [];
    
    // Handle window resizing
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Update mouse positions
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    // Handle Clicks
    window.addEventListener('mousedown', () => {
      follower.style.transform = 'translate3d(-50%, -50%, 0) scale(0.8)';
      // Trigger a click ripple shockwave
      createShockwave(mouse.x, mouse.y, true);
    });
    
    window.addEventListener('mouseup', () => {
      follower.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
    });

    // Particle class for trail
    class Particle {
      constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.size *= 0.96; // fade out size
      }
      draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Spark particle class for fast swipes
    class Spark {
      constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx + (Math.random() - 0.5) * 4;
        this.vy = vy + (Math.random() - 0.5) * 4;
        this.color = color;
        this.life = 15 + Math.random() * 10;
        this.maxLife = this.life;
        this.length = 8 + Math.random() * 12;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.94;
        this.vy *= 0.94;
        this.life--;
      }
      draw() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        // Draw spark tail vector
        ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx.stroke();
      }
    }

    // Shockwave class for wave ripple distortion
    class Shockwave {
      constructor(x, y, isClick = false) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = isClick ? 50 : 80;
        this.opacity = 0.8;
        this.color = document.documentElement.getAttribute('data-theme') === 'light' 
          ? 'rgba(59, 130, 246, 0.4)' 
          : 'rgba(34, 211, 238, 0.6)';
        this.speed = isClick ? 4 : 8;
      }
      update() {
        this.radius += this.speed;
        this.opacity = 1 - (this.radius / this.maxRadius);
      }
      draw() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add subtle electric dash accent
        if (this.radius > 20) {
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius - 8, Math.PI * 0.25, Math.PI * 0.75);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius - 8, Math.PI * 1.25, Math.PI * 1.75);
          ctx.stroke();
        }
      }
    }

    function createShockwave(x, y, isClick) {
      shockwaves.push(new Shockwave(x, y, isClick));
    }

    // 4. Setup Interactive Event Listeners (Attraction + Glow pulse)
    const selectInteractive = 'a, button, .nav-link, .card, .service-card, .theme-pill, .hamburger, .visit-counter-badge, .btn-fill, .btn-out, input, textarea';
    
    function attachListeners() {
      const targets = document.querySelectorAll(selectInteractive);
      targets.forEach(target => {
        // Skip elements that already have listeners
        if (target.dataset.cursorListened) return;
        target.dataset.cursorListened = 'true';

        target.addEventListener('mouseenter', () => {
          follower.classList.add('cursor-hover');
          glow.classList.add('cursor-hover');
          
          // Check for magnetic attraction setting
          if (target.classList.contains('nav-link') || 
              target.classList.contains('hamburger') || 
              target.classList.contains('theme-pill') ||
              target.classList.contains('visit-counter-badge') ||
              target.tagName === 'BUTTON' ||
              target.classList.contains('nav-hire')) {
            isMagnetic = true;
            magneticTarget = target;
          }
        });

        target.addEventListener('mouseleave', () => {
          follower.classList.remove('cursor-hover');
          glow.classList.remove('cursor-hover');
          isMagnetic = false;
          magneticTarget = null;
        });
      });
    }

    attachListeners();
    // Run periodically to handle dynamic content updates
    const observer = new MutationObserver(attachListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    // 5. Main Animation loop (60fps optimized, RAF)
    function animate(time) {
      // Setup canvas clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'screen';

      // Velocity calculation
      const dx = mouse.x - lastMouse.x;
      const dy = mouse.y - lastMouse.y;
      velocity = Math.sqrt(dx * dx + dy * dy);
      
      // Target position
      let targetX = mouse.x;
      let targetY = mouse.y;

      // Apply Magnetic Attraction Pull
      if (isMagnetic && magneticTarget) {
        const rect = magneticTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Attraction pull coordinates
        targetX = centerX + (mouse.x - centerX) * 0.35;
        targetY = centerY + (mouse.y - centerY) * 0.35;
      }

      // Smooth Position Interpolation (Lerp)
      followerPos.x += (targetX - followerPos.x) * followerLerp;
      followerPos.y += (targetY - followerPos.y) * followerLerp;
      
      glowPos.x += (targetX - glowPos.x) * glowLerp;
      glowPos.y += (targetY - glowPos.y) * glowLerp;

      // Apply coordinates to DOM follower and glow
      follower.style.transform = `translate3d(${followerPos.x}px, ${followerPos.y}px, 0)`;
      glow.style.transform = `translate3d(${glowPos.x}px, ${glowPos.y}px, 0)`;

      // Spark / Trail particle Generation
      const isDarkMode = document.documentElement.getAttribute('data-theme') !== 'light';
      const particleColor = isDarkMode ? 'rgba(34, 211, 238, 0.45)' : 'rgba(59, 130, 246, 0.35)';
      const sparkColor = isDarkMode ? '#22D3EE' : '#3B82F6';

      // General trail dots
      if (velocity > 1.5 && particles.length < 60) {
        // Spawn small floating dot
        particles.push(new Particle(
          followerPos.x,
          followerPos.y,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5,
          particleColor,
          2.5 + Math.random() * 2.5,
          20 + Math.random() * 15
        ));
      }

      // MIND-BLOWING FAST SWIPE EFFECT: Neon Electric Sparks + Ripple Distortion
      if (velocity > 32) {
        // Spawn 4-7 directional sparks opposite to movement vector
        const sparkCount = Math.floor(Math.random() * 4) + 3;
        for (let i = 0; i < sparkCount; i++) {
          particles.push(new Spark(
            followerPos.x,
            followerPos.y,
            -dx * 0.25,
            -dy * 0.25,
            sparkColor
          ));
        }

        // Spawn a quick distortion shockwave ripple
        if (shockwaves.length < 5) {
          createShockwave(followerPos.x, followerPos.y, false);
        }
      }

      // Update and Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0 || p.size < 0.2) {
          particles.splice(i, 1);
        } else {
          p.draw();
        }
      }

      // Update and Draw Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.update();
        if (sw.opacity <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
        } else {
          sw.draw();
        }
      }

      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;

      requestAnimationFrame(animate);
    }
    
    // Begin main animation loop
    requestAnimationFrame(animate);
  });
})();
