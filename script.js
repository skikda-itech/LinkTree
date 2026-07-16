(() => {
  const canvas = document.getElementById('grid-canvas');
  const ctx = canvas.getContext('2d');

  const SPACING = 42;
  const RADIUS_BASE = 4.0;
  const REPEL_RADIUS = 130;
  const REPEL_STRENGTH = 34;
  const EASE = 0.12;
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HAS_GSAP = typeof gsap !== 'undefined';

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0, height = 0;
  let dots = [];

  const cursor = { x: -9999, y: -9999, active: false };

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildGrid();
  }

  function buildGrid() {
    dots = [];
    const cols = Math.ceil(width / SPACING) + 1;
    const rows = Math.ceil(height / SPACING) + 1;

    const offsetX = (width - (cols - 1) * SPACING) / 2;
    const offsetY = (height - (rows - 1) * SPACING) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = offsetX + c * SPACING;
        const oy = offsetY + r * SPACING;
        const dot = { ox, oy, offsetX: 0, offsetY: 0 };

        if (HAS_GSAP) {
          dot.xTo = gsap.quickTo(dot, 'offsetX', { duration: 0.5, ease: 'power3.out' });
          dot.yTo = gsap.quickTo(dot, 'offsetY', { duration: 0.5, ease: 'power3.out' });
        }

        dots.push(dot);
      }
    }
  }

  function setCursor(clientX, clientY) {
    cursor.x = clientX;
    cursor.y = clientY;
    cursor.active = true;
  }

  window.addEventListener('mousemove', (e) => setCursor(e.clientX, e.clientY));
  window.addEventListener('mouseleave', () => { cursor.active = false; });

  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) setCursor(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchend', () => { cursor.active = false; });

  window.addEventListener('resize', resize);

  function update() {
    for (const dot of dots) {
      let targetX = 0;
      let targetY = 0;

      if (cursor.active) {
        const dx = dot.ox - cursor.x;
        const dy = dot.oy - cursor.y;
        const dist = Math.hypot(dx, dy);

        if (dist < REPEL_RADIUS) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          const angle = Math.atan2(dy, dx);
          targetX = Math.cos(angle) * force * REPEL_STRENGTH;
          targetY = Math.sin(angle) * force * REPEL_STRENGTH;
        }
      }

      if (HAS_GSAP) {
        dot.xTo(targetX);
        dot.yTo(targetY);
      } else {
        dot.offsetX += (targetX - dot.offsetX) * EASE;
        dot.offsetY += (targetY - dot.offsetY) * EASE;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (const dot of dots) {
      const force = Math.min(Math.hypot(dot.offsetX, dot.offsetY) / REPEL_STRENGTH, 1);
      const radius = RADIUS_BASE + force * 2.2;
      const x = dot.ox + dot.offsetX;
      const y = dot.oy + dot.offsetY;

      const alpha = 0.35 + force * 0.65;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = force > 0.05
        ? `rgba(10, 10, 198, ${alpha})`
        : `rgba(10, 10, 198, ${alpha * 0.5})`;
      ctx.fill();

      if (force > 0.3) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(10, 10, 198, ${force * 0.12})`;
        ctx.fill();
      }
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  resize();

  if (REDUCED_MOTION) {
    draw();
  } else {
    loop();
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const emailLink = document.getElementById('email-link');
  const emailModal = document.getElementById('email-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const copyEmailBtn = document.getElementById('copy-email-btn');
  const emailText = document.getElementById('email-text');

  if (emailLink && emailModal && closeModalBtn && copyEmailBtn && emailText) {
    emailLink.addEventListener('click', (e) => {
      e.preventDefault();
      emailModal.classList.add('active');
    });

    const closeModal = () => {
      emailModal.classList.remove('active');
      copyEmailBtn.innerText = 'COPY';
    };
    closeModalBtn.addEventListener('click', closeModal);
    emailModal.addEventListener('click', (e) => {
      if (e.target === emailModal) closeModal();
    });

    copyEmailBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(emailText.innerText).then(() => {
        copyEmailBtn.innerText = 'COPIED!';
        setTimeout(() => {
          copyEmailBtn.innerText = 'COPY';
        }, 1500);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    });
  }

  const links = document.querySelectorAll('.link-btn:not(#email-link)');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || href === '') {
        e.preventDefault();
        link.classList.add('flash-active');
        setTimeout(() => {
          link.classList.remove('flash-active');
        }, 600);
      }
    });
  });
});