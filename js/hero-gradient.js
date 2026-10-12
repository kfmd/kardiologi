/* ═══════════════════════════════════════════════════════════════
   Hero animated gradient  (vanilla JS port of kardiologi-bg-gradient.jsx)

   Built to be LIGHT on battery:
   • Phones / tablets (touch screens)  → ONE still frame, no animation at all.
   • Laptops / desktops (mouse)        → animated, but the maths runs on the
                                         GPU (WebGL), so the CPU barely works.
   • Always pauses when the hero is off-screen, the tab is hidden,
     the visitor chose "reduce motion", or "data saver" is on.

   How the gradient works, in plain words:
   4 coloured "blobs" drift around over time. For every pixel we mix the 4
   colours depending on how close the pixel is to each blob, after bending the
   space a little ("distortion" + "swirl") so the shapes look like liquid.
   It is drawn on a tiny canvas and stretched by CSS, which hides the low
   resolution because the gradient is so soft.

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

  canvas.width = CONFIG.width;
  canvas.height = CONFIG.height;

  // ─── 3. SHOULD WE ANIMATE ON THIS DEVICE? ───────────────────────
  // "(hover: hover) and (pointer: fine)" = the main input is a mouse/trackpad,
  // i.e. a laptop or desktop. Phones and tablets are "coarse" (finger).
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const wantAnimation = hasMouse && !saveData && !reducedMotion.matches;

  // ─── 4. SHARED HELPERS ──────────────────────────────────────────
  // Turn "#F0574D" into [240, 87, 77]
  const hexToRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const colors = CONFIG.colors.map(hexToRgb);
  const distortion = CONFIG.distortion / 100;
  const swirl = CONFIG.swirl / 100;
  const zoom = 0.4 + (CONFIG.scale / 100) * 1.2;
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

  // ─── 5A. DRAWING ON THE CPU (used for the single still frame) ───
  // Slow-ish per frame, but we only run it ONCE, so it doesn't matter.
  function drawStill(t) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const w = CONFIG.width;
    const h = CONFIG.height;
    const image = ctx.createImageData(w, h);
    const pixels = image.data;
    const smooth = (v) => {                       // an "ease" S-curve for 0→1
      const k = Math.min(1, Math.max(0, v));
      return k * k * (3 - 2 * k);
    };
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
    return true;
  }

  // ─── 5B. DRAWING ON THE GPU (used for the animation) ────────────
  // This is the SAME maths as above, written in GLSL (the language GPUs
  // understand). The GPU runs it for all pixels at once, in parallel.
  const VERTEX_SHADER = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;
  const FRAGMENT_SHADER = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif
    uniform vec2  u_res;        // canvas size in pixels
    uniform float u_time;       // animation clock
    uniform vec3  u_params;     // distortion, swirl, zoom
    uniform vec3  u_colors[4];  // the 4 colours (0–1)
    uniform vec2  u_blobs[4];   // where the 4 blobs are right now

    float smoothy(float v) { float k = clamp(v, 0.0, 1.0); return k * k * (3.0 - 2.0 * k); }

    void main() {
      float t = u_time;
      // pixel position (y flipped: GPUs count from the bottom)
      float x = (gl_FragCoord.x / u_res.x - 0.5) / u_params.z + 0.5;
      float y = ((1.0 - gl_FragCoord.y / u_res.y) - 0.5) / u_params.z + 0.5;

      // distortion
      float centreDist = smoothy(length(vec2(x - 0.5, y - 0.5)));
      float strength = 1.0 - centreDist;
      for (int i = 1; i <= 2; i++) {
        float k = float(i);
        x += (u_params.x * strength / k) * sin(t + k * 0.4 * smoothy(y)) * cos(0.2 * t + k * 2.4 * smoothy(y));
        y += (u_params.x * strength / k) * cos(t + k * 2.0 * smoothy(x));
      }

      // swirl
      float angle = -3.0 * u_params.y * centreDist;
      float c = cos(angle);
      float s = sin(angle);
      float dx = x - 0.5;
      float dy = y - 0.5;
      x = c * dx - s * dy + 0.5;
      y = s * dx + c * dy + 0.5;

      // mix the colours
      vec3 sum = vec3(0.0);
      float total = 0.0;
      for (int i = 0; i < 4; i++) {
        vec2 d = vec2(x, y) - u_blobs[i];
        float d2 = dot(d, d);
        float weight = 1.0 / (d2 * d2 + 0.0001);
        sum += u_colors[i] * weight;
        total += weight;
      }
      gl_FragColor = vec4(sum / max(0.0001, total), 1.0);
    }
  `;

  // Sets up WebGL. Returns a function draw(t), or null if WebGL isn't available.
  function setupGpu() {
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power'   // ask for the battery-friendly GPU
    });
    if (!gl) return null;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    // One big triangle that covers the whole canvas.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // Values that never change → send them once.
    gl.viewport(0, 0, CONFIG.width, CONFIG.height);
    gl.uniform2f(gl.getUniformLocation(program, 'u_res'), CONFIG.width, CONFIG.height);
    gl.uniform3f(gl.getUniformLocation(program, 'u_params'), distortion, swirl, zoom);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_colors'),
      new Float32Array(colors.flat().map((v) => v / 255)));

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uBlobs = gl.getUniformLocation(program, 'u_blobs');

    return function draw(t) {
      gl.uniform1f(uTime, t);
      gl.uniform2fv(uBlobs, new Float32Array(colors.flatMap((_, i) => blobPosition(i, t))));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
  }

  // ─── 6. FILM GRAIN (optional, very subtle) ──────────────────────
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

  // ─── 7. THE ANIMATION LOOP (laptops/desktops only) ──────────────
  function startAnimation(draw) {
    let time = CONFIG.startTime;     // the animation clock
    let lastStamp = 0;
    let rafId = 0;
    let isVisible = true;            // is the hero on screen?
    let tabActive = true;            // is the browser tab in front?
    const minGap = 1000 / CONFIG.maxFps;

    function loop(stamp) {
      rafId = requestAnimationFrame(loop);
      const gap = stamp - lastStamp;
      if (gap < minGap) return;                     // too soon → skip a frame
      // Advance the clock by real elapsed seconds (capped so a lag spike
      // doesn't make the gradient jump).
      time += (CONFIG.speed / 100) * 1.2 * Math.min(0.05, gap / 1000);
      lastStamp = stamp;
      draw(time);
    }
    function start() {
      if (rafId) return;
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
    reducedMotion.addEventListener('change', update);
    // If the browser takes the GPU away, just stop quietly.
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      stop();
    });

    draw(time);   // first frame right away
    update();
  }

  // ─── 8. GO! ─────────────────────────────────────────────────────
  let ready = false;
  if (wantAnimation) {
    const draw = setupGpu();
    if (draw) {
      startAnimation(draw);
      ready = true;
    }
  }
  if (!ready) {
    // Phone / tablet / reduce-motion / data-saver / no WebGL → one still frame.
    ready = drawStill(CONFIG.startTime);
  }
  if (ready) canvas.classList.add('is-ready');   // lets CSS fade the canvas in
  addGrain();
})();
