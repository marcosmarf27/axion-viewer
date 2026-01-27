import { useEffect, useRef } from 'react';

const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*(){}[]|;:<>?/\\~^!+=_-';

export default function MatrixRainCanvas({
  className,
  fontSize = 14,
  color = '#22c55e',
  fps = 30,
  fadeOpacity = 0.05,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let columns = 0;
    let drops = [];
    let animationId = null;
    let lastTime = 0;
    let cssWidth = 0;
    let cssHeight = 0;
    const frameInterval = 1000 / fps;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      cssWidth = canvas.offsetWidth;
      cssHeight = canvas.offsetHeight;

      if (cssWidth === 0 || cssHeight === 0) return;

      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rows = Math.ceil(cssHeight / fontSize);
      columns = Math.floor(cssWidth / fontSize);
      // Start drops scattered across the visible area for immediate effect
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * rows));
    }

    function draw(timestamp) {
      animationId = requestAnimationFrame(draw);

      if (timestamp - lastTime < frameInterval) return;
      lastTime = timestamp;

      if (cssWidth === 0 || cssHeight === 0) return;

      // Fade effect — semi-transparent overlay (gray-950 rgb)
      ctx.fillStyle = `rgba(3,7,18,${fadeOpacity})`;
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leader character: white
        ctx.fillStyle = '#ffffff';
        ctx.fillText(char, x, y);

        // Trail character: configured color (emerald)
        if (drops[i] > 1) {
          const prevChar = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillStyle = color;
          ctx.fillText(prevChar, x, (drops[i] - 1) * fontSize);
        }

        drops[i]++;

        // Reset drop when it passes the bottom
        if (drops[i] * fontSize > cssHeight && Math.random() > 0.975) {
          drops[i] = 0;
        }
      }
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    animationId = requestAnimationFrame(draw);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [fontSize, color, fps, fadeOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
