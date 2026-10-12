/* ═══════════════════════════════════════════════════════════════
   Hero animated gradient  (vanilla JS port of kardiologi-bg-gradient.jsx)

   How it works, in plain words:
   1. We have a tiny <canvas> (160 × 118 pixels) behind the hero content.
   2. 4 coloured "blobs" slowly drift around over time.
   3. For every pixel, we mix the 4 colours depending on how close the pixel
      is to each blob, after bending the space a little (the "distortion" and
      "swirl" settings) so the shapes look like flowing liquid.
   4. The canvas is stretched by CSS to fill the hero. Because it is so soft,
      the stretching is invisible, and drawing only ~19,000 pixels per frame
      keeps the animation light.

   To tweak the look, only change the CONFIG block below.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ─── 1. SETTINGS (copied from your exported gradient) ───────────
  const CONFIG = {
    colors: ['#EAF4FC', '#00A699', '#F09199', '#F0574D'], // the 4 blobs
    speed: 30,        // 0–100. Higher = faster drifting
    startTime: 78.73220480000163, // the "moment" of the animation shown first
    distortion: 60,   // 0–100. How much the blobs get bent/warped
    swirl: 10,        // 0–100. How much the centre twists
    scale: 50,        // 0–100. Zoom of the pattern (higher = bigger shapes)
    grain: 6,         // 0–100. Film-grain amount (0 = none)
    width: 160,       // canvas resolution. Small on purpose: soft + fast
    height: 118,      // keeps your export's proportions (2048 × 1506)
    maxFps: 30        // frame-rate cap to save battery (speed is unaffected)
  };

  // ─── 2. FIND THE ELEMENTS ───────────────────────────────────────
  const canvas = document.getElementById('heroGradient');
  if (!canvas) return;                       // no canvas on this page → stop
  const hero = canvas.closest('.hero') || canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;                          // very old browser → CSS fallback stays

  canvas.width = CONFIG.width;
  canvas.height = CONFIG.height;

  // ─── 3. PRE-CALCULATE THINGS THAT NEVER CHANGE ──────────────────
  // Turn "#F0574D" into [240, 87, 77]
  const hexToRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const colors = CONFIG.colors.map(hexToRgb);

  const distortion = CONFIG.distortion / 100;
  const swirl = CONFIG.swirl / 100;
  const zoom = 0.4 + (CONFIG.scale / 100) * 1.2;

  const image = ctx.createImageData(CONFIG.width, CONFIG.height);
  const pixels = image.data;

  // Smoothstep: an "ease" curve that turns 0→1 into a gentle S-shape
  const smooth = (v) => {
    const t = Math.min(1, Math.max(0, v));
    return t * t * (3 - 2 * t);
  };
  const fract = (v) => v - Math.floor(v);

  // Where is blob number `i` at animation time `t`? (x and y between 0 and 1)
  // Each blob moves on its own slow sine/cosine loop.
  const blobPosition = (i, t) => {
    const offset = i * 0.37;
    const freqX = 0.6 + fract(i / 3) * 0.9;
    const freqY = 0.8 + fract((i + 1) / 4);
    return [
      0.5 + 0.5 * Math.sin(t * freqX + offset),
      0.5 + 0.5 * Math.cos(t * freqY + offset * 1.5)
    ];
  };

  // ─── 4. DRAW ONE FRAME ──────────────────────────────────────────
  function drawFrame(t) {
    const w = CONFIG.width;
    const h = CONFIG.height;
    const blobs = colors.map((_, i) => blobPosition(i, t));

    for (let py = 0; py < h; py++) {
      const v = (py + 0.5) / h;
      for (let px = 0; px < w; px++) {
        // (a) pixel position, re-centred and zoomed
        let x = ((px + 0.5) / w - 0.5) / zoom + 0.5;
        let y = (v - 0.5) / zoom + 0.5;

        // (b) distortion: bend space, strongest near the middle
        const centreDist = smooth(Math.hypot(x - 0.5, y - 0.5));
        const strength = 1 - centreDist;
        for (let k = 1; k <= 2; k++) {
          x += (distortion * strength / k) *
               Math.sin(t + k * 0.4 * smooth(y)) *
               Math.cos(0.2 * t + k * 2.4 * smooth(y));
          y += (distortion * strength / k) *
               Math.cos(t + k * 2 * smooth(x));
        }

        // (c) swirl: rotate the middle more than the edges
        const angle = -3 * swirl * centreDist;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = x - 0.5;
        const dy = y - 0.5;
        x = cos * dx - sin * dy + 0.5;
        y = sin * dx + cos * dy + 0.5;

        // (d) mix the colours: nearer blobs get a much bigger say
        let r = 0, g = 0, b = 0, total = 0;
        for (let i = 0; i < colors.length; i++) {
          const bx = x - blobs[i][0];
          const by = y - blobs[i][1];
          const d2 = bx * bx + by * by;
          const weight = 1 / (d2 * d2 + 1e-4);
          r += colors[i][0] * weight;
          g += colors[i][1] * weight;
          b += colors[i][2] * weight;
          total += weight;
        }
        const inv = 1 / Math.max(1e-4, total);

        const o = (py * w + px) * 4;
        pixels[o] = r * inv;
        pixels[o + 1] = g * inv;
        pixels[o + 2] = b * inv;
        pixels[o + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  // ─── 5. FILM GRAIN (optional, very subtle) ──────────────────────
  // Makes a 256×256 tile of random grey noise and hands it to the CSS
  // (see ".hero::after" in style.css) through a CSS variable.
  function addGrain() {
    if (CONFIG.grain <= 0) return;
    const size = 256;
    const tile = document.createElement('canvas');
    tile.width = tile.height = size;
    const tctx = tile.getContext('2d');
    const noise = tctx.createImageData(size, size);
    for (let i = 0; i < noise.data.length; i += 4) {
      const grey = Math.round(((Math.random() + Math.random()) / 2) * 255);
      noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = grey;
      noise.data[i + 3] = 255;
    }
    tctx.putImageData(noise, 0, 0);
    hero.style.setProperty('--hero-grain', 'url(' + tile.toDataURL() + ')');
    hero.style.setProperty('--hero-grain-opacity', String(CONFIG.grain / 200));
  }

  // ─── 6. ANIMATION LOOP ──────────────────────────────────────────
  let time = CONFIG.startTime;     // the animation clock
  let lastStamp = 0;
  let rafId = 0;
  let isVisible = true;            // is the hero on screen?
  let tabActive = true;            // is the browser tab in front?

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const minGap = 1000 / CONFIG.maxFps;

  function loop(stamp) {
    rafId = requestAnimationFrame(loop);
    const gap = stamp - lastStamp;
    if (gap < minGap) return;                       // too soon → skip a frame
    // Advance the clock by real elapsed seconds (capped so a lag spike
    // doesn't make the gradient jump).
    time += (CONFIG.speed / 100) * 1.2 * Math.min(0.05, gap / 1000);
    lastStamp = stamp;
    drawFrame(time);
  }

  function start() {
    if (rafId || reducedMotion.matches) return;
    lastStamp = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  function update() {
    if (isVisible && tabActive && !reducedMotion.matches) start();
    else stop();
  }

  // Pause when scrolled away or tab hidden → no wasted battery.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      isVisible = entries[0].isIntersecting;
      update();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () {
    tabActive = !document.hidden;
    update();
  });
  // Respect "reduce motion" system setting: show one still frame instead.
  reducedMotion.addEventListener('change', update);

  // ─── 7. GO! ─────────────────────────────────────────────────────
  drawFrame(time);                  // first frame right away
  canvas.classList.add('is-ready'); // lets CSS fade the canvas in
  addGrain();
  update();
})();
