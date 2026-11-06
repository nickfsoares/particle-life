// Interface : contrôles, couleurs et matrice d'interactions éditable.
const PALETTE = ['#ff5d5d', '#4dd2ff', '#ffd24d', '#7dff7a', '#c78bff', '#ff9a4d'];

function cellStyle(v) {
  const rgb = v >= 0 ? 'var(--pos)' : 'var(--neg)';
  return `background: rgba(${rgb}, ${(Math.abs(v) * 0.75).toFixed(2)})`;
}

function buildUI(app) {
  const $ = (id) => document.getElementById(id);
  const sim = app.sim;

  // --- Types (couleurs) ---
  function renderTypes() {
    const box = $('types');
    box.innerHTML = '';
    for (let k = 2; k <= 6; k++) {
      const b = document.createElement('button');
      b.textContent = k;
      b.className = k === sim.K ? 'on' : '';
      b.onclick = () => app.setTypes(k);
      box.appendChild(b);
    }
    const colors = $('colors');
    colors.innerHTML = '';
    for (let k = 0; k < sim.K; k++) {
      const c = document.createElement('input');
      c.type = 'color';
      c.value = app.colors[k];
      c.title = T.color(k + 1);
      c.setAttribute('aria-label', c.title);
      c.oninput = () => { app.colors[k] = c.value; renderMatrix(); };
      colors.appendChild(c);
    }
  }

  // --- Matrice ---
  function renderMatrix() {
    const K = sim.K, box = $('matrix');
    box.style.gridTemplateColumns = `28px repeat(${K}, 1fr)`;
    box.innerHTML = '<div class="corner"></div>';
    const dot = (k) => `<span class="dot" style="background:${app.colors[k]}"></span>`;
    for (let j = 0; j < K; j++) box.insertAdjacentHTML('beforeend', `<div class="head" title="${T.target}">${dot(j)}</div>`);
    for (let i = 0; i < K; i++) {
      box.insertAdjacentHTML('beforeend', `<div class="head" title="${T.particle}">${dot(i)}</div>`);
      for (let j = 0; j < K; j++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.tabIndex = 0;
        cell.dataset.i = i; cell.dataset.j = j;
        paintCell(cell);
        box.appendChild(cell);
      }
    }
  }

  function paintCell(cell) {
    const v = sim.matrix[cell.dataset.i * sim.K + +cell.dataset.j];
    cell.style.cssText = cellStyle(v);
    cell.textContent = num(v, 2);
    cell.title = (v >= 0 ? T.pulls : T.pushes)(+cell.dataset.i + 1, +cell.dataset.j + 1);
  }

  function setValue(cell, v) {
    sim.matrix[cell.dataset.i * sim.K + +cell.dataset.j] = Math.max(-1, Math.min(1, Math.round(v * 100) / 100));
    paintCell(cell);
  }

  function valueAt(cell, clientX) {
    const r = cell.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * 2 - 1;
  }

  const matrixEl = $('matrix');
  let dragging = null;
  matrixEl.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    dragging = cell;
    matrixEl.setPointerCapture(e.pointerId);
    setValue(cell, valueAt(cell, e.clientX));
  });
  matrixEl.addEventListener('pointermove', (e) => {
    if (dragging) setValue(dragging, valueAt(dragging, e.clientX));
  });
  matrixEl.addEventListener('pointerup', () => { dragging = null; });
  matrixEl.addEventListener('keydown', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    const cur = sim.matrix[cell.dataset.i * sim.K + +cell.dataset.j];
    setValue(cell, cur + (e.key === 'ArrowRight' ? 0.1 : -0.1));
  });

  // --- Curseurs et boutons ---
  $('count').oninput = (e) => {
    $('countOut').textContent = e.target.value;
    app.setCount(+e.target.value);
  };
  $('speed').oninput = (e) => {
    app.speed = +e.target.value;
    $('speedOut').textContent = num(app.speed, 2) + '×';
  };
  $('pause').onclick = () => {
    app.paused = !app.paused;
    $('pause').textContent = app.paused ? T.resume : T.pause;
  };
  $('reset').onclick = () => sim.scatter();
  $('random').onclick = () => { sim.randomize(); renderMatrix(); };

  return { renderTypes, renderMatrix };
}
