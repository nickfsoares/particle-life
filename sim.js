// Moteur de Particle Life : physique avec grille spatiale (≈ O(n)) et monde torique.
class Sim {
  constructor(w, h) {
    this.W = w;
    this.H = h;
    this.rmax = 80;        // rayon maximal d'interaction (px)
    this.beta = 0.3;       // fraction du rayon à répulsion universelle (évite le chevauchement)
    this.forceFactor = 10;
    this.halfLife = 0.04;  // demi-vie de la vitesse (frottement), en secondes
    this.K = 4;
    this.matrix = new Float32Array(16);
    this.n = 0;
    this.alloc(0);
  }

  alloc(n) {
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.t = new Uint8Array(n);
    this.cellOf = new Int32Array(n);
    this.items = new Int32Array(n);
    this.n = n;
  }

  // Crée n particules à des positions aléatoires, réparties entre K types.
  init(n, K) {
    this.K = K;
    if (n !== this.n) this.alloc(n);
    this.scatter();
  }

  scatter() {
    for (let i = 0; i < this.n; i++) {
      this.x[i] = Math.random() * this.W;
      this.y[i] = Math.random() * this.H;
      this.vx[i] = 0;
      this.vy[i] = 0;
      this.t[i] = i % this.K;
    }
  }

  setSize(w, h) {
    const sx = w / this.W, sy = h / this.H;
    for (let i = 0; i < this.n; i++) {
      this.x[i] *= sx;
      this.y[i] *= sy;
    }
    this.W = w;
    this.H = h;
  }

  // Redimensionne la matrice en conservant les valeurs existantes.
  resizeMatrix(K, randomFill) {
    const old = this.matrix, oldK = this.K;
    const m = new Float32Array(K * K);
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) {
        m[i * K + j] = i < oldK && j < oldK && old.length === oldK * oldK
          ? old[i * oldK + j]
          : (randomFill ? Math.random() * 2 - 1 : 0);
      }
    }
    this.matrix = m;
    this.K = K;
  }

  randomize() {
    const K = this.K;
    for (let i = 0; i < K * K; i++) this.matrix[i] = Math.random() * 2 - 1;
  }

  step(dt) {
    const { n, x, y, vx, vy, t, K, W, H, rmax, beta, matrix: m, cellOf, items } = this;
    if (n === 0) return;
    const cols = Math.max(3, Math.floor(W / rmax));
    const rows = Math.max(3, Math.floor(H / rmax));
    const cw = W / cols, ch = H / rows;
    const ncell = cols * rows;
    if (!this.cellStart || this.cellStart.length !== ncell + 1) {
      this.cellStart = new Int32Array(ncell + 1);
      this.cursor = new Int32Array(ncell);
    }
    const start = this.cellStart, cur = this.cursor;
    start.fill(0);

    // Grille spatiale par tri par comptage.
    for (let i = 0; i < n; i++) {
      let cx = (x[i] / cw) | 0, cy = (y[i] / ch) | 0;
      if (cx >= cols) cx = cols - 1;
      if (cy >= rows) cy = rows - 1;
      const c = cy * cols + cx;
      cellOf[i] = c;
      start[c + 1]++;
    }
    for (let c = 0; c < ncell; c++) start[c + 1] += start[c];
    for (let c = 0; c < ncell; c++) cur[c] = start[c];
    for (let i = 0; i < n; i++) items[cur[cellOf[i]]++] = i;

    const fric = Math.pow(0.5, dt / this.halfLife);
    const gain = rmax * this.forceFactor * dt;
    const invBeta = 1 / beta, inv1b = 1 / (1 - beta);
    const hw = W / 2, hh = H / 2, r2max = rmax * rmax;

    for (let i = 0; i < n; i++) {
      const xi = x[i], yi = y[i], row = t[i] * K;
      const c = cellOf[i];
      const cx = c % cols, cy = (c / cols) | 0;
      let fx = 0, fy = 0;
      for (let oy = -1; oy <= 1; oy++) {
        const ny = (cy + oy + rows) % rows;
        for (let ox = -1; ox <= 1; ox++) {
          const nc = ny * cols + ((cx + ox + cols) % cols);
          for (let s = start[nc], e = start[nc + 1]; s < e; s++) {
            const j = items[s];
            if (j === i) continue;
            let dx = x[j] - xi, dy = y[j] - yi;
            if (dx > hw) dx -= W; else if (dx < -hw) dx += W;
            if (dy > hh) dy -= H; else if (dy < -hh) dy += H;
            const d2 = dx * dx + dy * dy;
            if (d2 >= r2max || d2 === 0) continue;
            const r = Math.sqrt(d2), rr = r / rmax;
            const f = rr < beta
              ? rr * invBeta - 1
              : m[row + t[j]] * (1 - Math.abs(2 * rr - 1 - beta) * inv1b);
            fx += (f * dx) / r;
            fy += (f * dy) / r;
          }
        }
      }
      vx[i] = vx[i] * fric + fx * gain;
      vy[i] = vy[i] * fric + fy * gain;
    }

    for (let i = 0; i < n; i++) {
      let px = x[i] + vx[i] * dt, py = y[i] + vy[i] * dt;
      if (px < 0) px += W; else if (px >= W) px -= W;
      if (py < 0) py += H; else if (py >= H) py -= H;
      x[i] = px;
      y[i] = py;
    }
  }
}
