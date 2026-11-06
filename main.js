// Boucle principale et dessin sur le canvas.
(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const stats = document.getElementById('stats');

  const sim = new Sim(800, 600);
  const app = { sim, colors: PALETTE.slice(), paused: false, speed: 1 };
  let ui;

  app.setCount = (n) => sim.init(n, sim.K);
  app.setTypes = (k) => {
    sim.resizeMatrix(k, true);
    sim.init(sim.n, k);
    ui.renderTypes();
    ui.renderMatrix();
  };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sim.setSize(w, h);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  sim.resizeMatrix(4, false);
  sim.randomize();
  sim.init(1000, 4);
  ui = buildUI(app);
  ui.renderTypes();
  ui.renderMatrix();

  function draw() {
    ctx.fillStyle = '#070a10';
    ctx.fillRect(0, 0, sim.W, sim.H);
    const { n, x, y, t, K } = sim;
    for (let k = 0; k < K; k++) {
      ctx.fillStyle = app.colors[k];
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        if (t[i] !== k) continue;
        ctx.moveTo(x[i] + 2.5, y[i]);
        ctx.arc(x[i], y[i], 2.5, 0, 6.2832);
      }
      ctx.fill();
    }
  }

  let last = performance.now(), fps = 60;
  function frame(now) {
    const ft = now - last;
    last = now;
    if (ft > 0) fps += (1000 / ft - fps) * 0.1;
    if (!app.paused) {
      const sub = Math.max(1, Math.round(app.speed));
      const dt = (0.02 * app.speed) / sub;
      for (let s = 0; s < sub; s++) sim.step(dt);
    }
    draw();
    stats.textContent = T.stats(sim.n, Math.round(fps));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
