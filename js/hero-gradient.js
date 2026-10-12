/* ═══════════════════════════════════════════════════════════════
   Hero animated gradient  (vanilla JS port of kardiologi-bg-gradient.jsx)

   Built to cost almost nothing on battery:
   • Phones / tablets / narrow windows → this script does NOTHING.
     The page just shows a tiny pre-made image (assets/hero-gradient.jpg),
     set in style.css. No canvas, no WebGL, no loop, no work at all.
   • Laptops / desktops (mouse + wide window) → animated, with the maths
     running on the GPU (WebGL), so the CPU barely works.
   • Pauses when the hero is off-screen, the tab is hidden, "reduce motion"
     or "data saver" is on.

   To tweak the look, only change the CONFIG block below.
   (If you change colours/settings, the pre-made image no longer matches the
    live gradient — ask for a new one to be generated.)
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

  // ─── 2. IS THIS A DEVICE THAT SHOULD ANIMATE? ───────────────────
  // Mouse/trackpad + a window wider than 768px = laptop or desktop.
  // IMPORTANT: this exact same query is used in style.css. Keep them equal.
  const DESKTOP = '(hover: hover) and (pointer: fine) and (min-width: 769px)';
  const desktopQuery = window.matchMedia(DESKTOP);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = !!(navigator.connection && navigator.connection.saveData);

  const canvas = document.getElementById('heroGradient');
  if (!canvas) return;
  const hero = canvas.closest('.hero') || canvas.parentElement;

  const canAnimate = () => desktopQuery.matches && !reducedMotion.matches && !saveData;

  // ─── 3. SHARED HELPERS ──────────────────────────────────────────
  const hexToRgb = (hex) => {            // "#F0574D" → [240, 87, 77]
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const colors = CONFIG.colors.map(hexToRgb);
  const distortion = CONFIG.distortion / 100;
  const swirl = CONFIG.swirl / 100;
  const zoom = 0.4 + (CONFIG.scale / 100) * 1.2;
  const fract = (v) => v - Math.floor(v);

  // Where is blob number `i` at animation time `t`? (x and y between 0 and 1)
  const blobPosition = (i, t) => {
    const offset = i * 0.37;
    const freqX = 0.6 + fract(i / 3) * 0.9;
    const freqY = 0.8 + fract((i + 1) / 4);
    return [
      0.5 + 0.5 * Math.sin(t * freqX + offset),
      0.5 + 0.5 * Math.cos(t * freqY + offset * 1.5)
    ];
  };

  // ─── 4. THE GPU PROGRAM ─────────────────────────────────────────
  // The gradient maths written in GLSL (the language GPUs understand).
  // The GPU runs it for all pixels at once, in parallel.
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

      // distortion: bend space, strongest near the middle
      float centreDist = smoothy(length(vec2(x - 0.5, y - 0.5)));
      float strength = 1.0 - centreDist;
      for (int i = 1; i <= 2; i++) {
        float k = float(i);
        x += (u_params.x * strength / k) * sin(t + k * 0.4 * smoothy(y)) * cos(0.2 * t + k * 2.4 * smoothy(y));
        y += (u_params.x * strength / k) * cos(t + k * 2.0 * smoothy(x));
      }

      // swirl: rotate the middle more than the edges
      float angle = -3.0 * u_params.y * centreDist;
      float c = cos(angle);
      float s = sin(angle);
      float dx = x - 0.5;
      float dy = y - 0.5;
      x = c * dx - s * dy + 0.5;
      y = s * dx + c * dy + 0.5;

      // mix the colours: nearer blobs get a much bigger say
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

  // ─── 5. FILM GRAIN (optional, very subtle) ──────────────────────
  // A 256×256 tile of random grey noise, handed to the CSS
  // (".hero::after" in style.css) through a CSS variable.
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

  // ─── 6. THE ANIMATOR (created only the first time it's needed) ──
  function createAnimator() {
    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;
    const draw = setupGpu();
    if (!draw) return null;          // no WebGL → the still image stays

    let time = CONFIG.startTime;     // the animation clock
    let lastStamp = 0;
    let rafId = 0;
    let allowed = true;              // desktop-ish + motion allowed?
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
    function update() {
      const shouldRun = allowed && isVisible && tabActive;
      if (shouldRun && !rafId) {
        lastStamp = performance.now();
        rafId = requestAnimationFrame(loop);
      } else if (!shouldRun && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
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
    // If the browser takes the GPU away, just stop quietly.
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      allowed = false;
      update();
    });

    draw(time);                              // first frame right away
    addGrain();
    canvas.classList.add('is-ready');        // CSS fades the canvas in...
    hero.classList.add('has-live-gradient'); // ...and hides the still image

    return {
      setAllowed: function (value) { allowed = value; update(); }
    };
  }

  // ─── 7. GO! ─────────────────────────────────────────────────────
  let animator = null;
  function sync() {
    if (canAnimate()) {
      if (!animator) animator = createAnimator();
      if (animator) animator.setAllowed(true);
    } else if (animator) {
      animator.setAllowed(false);            // e.g. window made narrow
    }
  }
  desktopQuery.addEventListener('change', sync);
  reducedMotion.addEventListener('change', sync);
  sync();   // on a phone this does nothing at all
})();
