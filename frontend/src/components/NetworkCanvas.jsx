import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 85;
const GOLDEN_RATIO = 0.12;
const CONNECTION_DISTANCE = 150;
const MOUSE_RADIUS = 200;
const MOUSE_STRENGTH = 0.02;
const PULSE_INTERVAL = 5500;
const BURST_DURATION = 1800;

function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function NetworkCanvas({ className }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef([]);
  const startTimeRef = useRef(null);
  const lastPulseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let width, height;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      const particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const isGolden = Math.random() < GOLDEN_RATIO;
        const targetX = Math.random() * width;
        const targetY = Math.random() * height;
        particles.push({
          x: width / 2,
          y: height / 2,
          targetX,
          targetY,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: isGolden ? 2.2 : 1.2 + Math.random() * 0.8,
          baseAlpha: isGolden ? 0.8 : 0.15 + Math.random() * 0.35,
          alpha: 0,
          golden: isGolden,
          pulseBoost: 0,
        });
      }
      particlesRef.current = particles;
      startTimeRef.current = performance.now();
      lastPulseRef.current = performance.now();
    }

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }

    function handleMouseLeave() {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    }

    function animate(now) {
      ctx.clearRect(0, 0, width, height);
      const particles = particlesRef.current;
      const elapsed = now - startTimeRef.current;
      const burstProgress = Math.min(elapsed / BURST_DURATION, 1);
      const burstEased = easeOutExpo(burstProgress);

      // Pulse logic
      const timeSincePulse = now - lastPulseRef.current;
      let pulseRadius = -1;
      if (timeSincePulse < 1200) {
        pulseRadius =
          easeOutExpo(timeSincePulse / 1200) *
          Math.max(width, height) *
          0.7;
      }
      if (timeSincePulse > PULSE_INTERVAL) {
        lastPulseRef.current = now;
      }

      // Draw pulse ring
      if (pulseRadius > 0) {
        const pulseAlpha = 0.12 * (1 - timeSincePulse / 1200);
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212, 168, 67, ${Math.max(pulseAlpha, 0)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Update & draw particles
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Burst animation
        if (burstProgress < 1) {
          p.x = width / 2 + (p.targetX - width / 2) * burstEased;
          p.y = height / 2 + (p.targetY - height / 2) * burstEased;
          p.alpha = p.baseAlpha * burstEased;
        } else {
          // Normal movement
          p.x += p.vx;
          p.y += p.vy;

          // Bounce off edges
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          p.x = Math.max(0, Math.min(width, p.x));
          p.y = Math.max(0, Math.min(height, p.y));

          // Mouse attraction
          const mdx = mx - p.x;
          const mdy = my - p.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < MOUSE_RADIUS && mDist > 1) {
            p.vx += (mdx / mDist) * MOUSE_STRENGTH;
            p.vy += (mdy / mDist) * MOUSE_STRENGTH;
          }

          // Damping
          p.vx *= 0.99;
          p.vy *= 0.99;
          p.alpha = p.baseAlpha;
        }

        // Pulse boost
        if (pulseRadius > 0) {
          const pdx = p.x - width / 2;
          const pdy = p.y - height / 2;
          const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (Math.abs(pDist - pulseRadius) < 30) {
            p.pulseBoost = 0.6;
          }
        }
        p.pulseBoost *= 0.96;

        // Draw particle
        const drawAlpha = Math.min(p.alpha + p.pulseBoost, 1);
        if (p.golden) {
          ctx.shadowColor = 'rgba(212, 168, 67, 0.5)';
          ctx.shadowBlur = 8;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.golden
          ? `rgba(212, 168, 67, ${drawAlpha})`
          : `rgba(255, 255, 255, ${drawAlpha})`;
        ctx.fill();
        if (p.golden) {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            const lineAlpha =
              (1 - dist / CONNECTION_DISTANCE) *
              0.12 *
              burstEased;
            const isGoldenLine = a.golden || b.golden;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = isGoldenLine
              ? `rgba(212, 168, 67, ${lineAlpha})`
              : `rgba(255, 255, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    }

    resize();
    initParticles();
    animRef.current = requestAnimationFrame(animate);

    const parent = canvas.parentElement;
    parent.addEventListener('mousemove', handleMouseMove);
    parent.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resize);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
