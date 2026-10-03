import { colorForCode } from './colors';
import { el } from './dom';
import type { MapPiece } from './types';

export interface MapPuzzleOptions {
  title: string;
  backHash: string;
  storageKey: string;
  pieces: MapPiece[];
  /** 図鑑詳細への hash（例: #/japan/encyclopedia?code=01） */
  encyclopediaHref?: (code: string) => string;
}

const TRAY_SCROLL_STEP = 88;

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const tenth = Math.floor((ms % 1000) / 100);
  return `${min}:${sec.toString().padStart(2, '0')}.${tenth}`;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function measurePathBounds(pathD: string): DOMRect {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  svg.style.position = 'fixed';
  svg.style.left = '-9999px';
  svg.style.visibility = 'hidden';
  document.body.appendChild(svg);
  const box = path.getBBox();
  document.body.removeChild(svg);
  return box;
}

function unionBounds(pieces: MapPiece[]): DOMRect {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const p of pieces) {
    const b = measurePathBounds(p.path);
    left = Math.min(left, b.x);
    top = Math.min(top, b.y);
    right = Math.max(right, b.x + b.width);
    bottom = Math.max(bottom, b.y + b.height);
  }
  if (!Number.isFinite(left)) {
    return new DOMRect(0, 0, 1000, 1000);
  }
  return new DOMRect(left, top, right - left, bottom - top);
}

interface Transform {
  scale: number;
  tx: number;
  ty: number;
}

function computeTransform(width: number, height: number, bounds: DOMRect): Transform {
  const pad = 6;
  const availW = width - pad * 2;
  const availH = height - pad * 2;
  const scale = Math.min(availW / bounds.width, availH / bounds.height);
  const tx = pad + (availW - bounds.width * scale) / 2 - bounds.left * scale;
  const ty = pad + (availH - bounds.height * scale) / 2 - bounds.top * scale;
  return { scale, tx, ty };
}

function pieceViewBox(piece: MapPiece): string {
  const b = measurePathBounds(piece.path);
  const m = 2;
  return `${b.x - m} ${b.y - m} ${b.width + m * 2} ${b.height + m * 2}`;
}

export function renderMapPuzzle(root: HTMLElement, options: MapPuzzleOptions): void {
  const { title, backHash, storageKey, pieces, encyclopediaHref } = options;
  const bounds = unionBounds(pieces);

  const placed = new Set<string>();
  let selectedPiece: MapPiece | null = null;
  let timerMs = 0;
  let timerRunning = true;
  let cleared = false;
  let transform: Transform = { scale: 1, tx: 0, ty: 0 };
  let mapContentGroup: SVGGElement | null = null;
  let lastDialogCode = '';
  let lastDialogAt = 0;
  let trayOrder: MapPiece[] = [];

  const screen = el('div', 'screen puzzle-screen');
  const header = el('div', 'puzzle-header');
  const backBtn = el('button', 'btn-ghost', '← 戻る');
  backBtn.type = 'button';
  backBtn.addEventListener('click', () => {
    window.location.hash = backHash;
  });
  const titleEl = el('h1', 'puzzle-title', title);
  const timerEl = el('span', 'puzzle-timer', '0:00.0');
  const remainEl = el('span', 'puzzle-remaining', '');
  const stats = el('div', 'puzzle-stats');
  stats.append(timerEl, remainEl);
  header.append(backBtn, titleEl, stats);

  const toolbar = el('div', 'puzzle-toolbar');
  const resetBtn = el('button', 'btn-secondary', 'リセット');
  resetBtn.type = 'button';
  toolbar.append(resetBtn);

  const mapWrap = el('div', 'puzzle-map-wrap');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'puzzle-map');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', '地図パズル');
  const mapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(mapGroup);
  mapWrap.appendChild(svg);

  const trayPanel = el('div', 'puzzle-tray-panel');
  const trayUp = el('button', 'puzzle-tray-arrow', '▲');
  trayUp.type = 'button';
  trayUp.setAttribute('aria-label', 'ピースを上へ');
  const trayViewport = el('div', 'puzzle-tray-viewport');
  const trayGrid = el('div', 'puzzle-tray');
  trayViewport.appendChild(trayGrid);
  const trayDown = el('button', 'puzzle-tray-arrow', '▼');
  trayDown.type = 'button';
  trayDown.setAttribute('aria-label', 'ピースを下へ');
  trayPanel.append(trayUp, trayViewport, trayDown);

  trayUp.addEventListener('click', () => {
    trayViewport.scrollTop -= TRAY_SCROLL_STEP;
  });
  trayDown.addEventListener('click', () => {
    trayViewport.scrollTop += TRAY_SCROLL_STEP;
  });

  screen.append(header, toolbar, mapWrap, trayPanel);
  root.replaceChildren(screen);

  const tick = window.setInterval(() => {
    if (timerRunning) timerMs += 200;
    timerEl.textContent = formatTime(timerMs);
  }, 200);

  function updateRemaining(): void {
    const left = pieces.length - placed.size;
    remainEl.textContent = `のこり ${left}`;
  }

  function checkClear(): void {
    if (placed.size !== pieces.length || cleared) return;
    cleared = true;
    timerRunning = false;
    const prev = localStorage.getItem(storageKey);
    const prevMs = prev ? parseInt(prev, 10) : Infinity;
    if (timerMs < prevMs) {
      localStorage.setItem(storageKey, String(timerMs));
    }
    const dialog = el('div', 'puzzle-dialog');
    dialog.innerHTML = `<div class="puzzle-dialog-card"><h2>クリア！</h2><p>タイム: ${formatTime(timerMs)}</p><button type="button" class="btn-primary">もう一度</button></div>`;
    screen.append(dialog);
    dialog.querySelector('button')?.addEventListener('click', () => {
      dialog.remove();
      resetPuzzle();
    });
  }

  function placePiece(piece: MapPiece): void {
    if (placed.has(piece.code)) return;
    placed.add(piece.code);
    if (selectedPiece?.code === piece.code) selectedPiece = null;
    rebuildTray(true);
    drawMap();
    updateRemaining();
    checkClear();
  }

  function resetPuzzle(): void {
    placed.clear();
    selectedPiece = null;
    cleared = false;
    timerMs = 0;
    timerRunning = true;
    rebuildTray(true);
    drawMap();
    updateRemaining();
  }

  resetBtn.addEventListener('click', resetPuzzle);

  function updateTransform(): void {
    const rect = svg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      transform = computeTransform(rect.width, rect.height, bounds);
    }
  }

  function appendPath(
    parent: SVGGElement,
    piece: MapPiece,
    mode: 'slot' | 'placed',
  ): void {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', piece.path);
    if (mode === 'slot') {
      const highlight = selectedPiece?.code === piece.code;
      path.setAttribute('fill', highlight ? 'rgba(45, 212, 191, 0.15)' : 'none');
      path.setAttribute('stroke', highlight ? '#2dd4bf' : '#94a3b8');
      path.setAttribute('stroke-width', String((highlight ? 2.25 : 1.75) / transform.scale));
      path.setAttribute('class', 'puzzle-map-path--slot');
    } else {
      path.setAttribute('fill', colorForCode(piece.code));
      path.setAttribute('stroke', '#115e59');
      path.setAttribute('stroke-width', String(1.25 / transform.scale));
      path.setAttribute('class', 'puzzle-map-path--placed');
    }
    parent.appendChild(path);
  }

  function drawMap(): void {
    updateTransform();
    mapGroup.replaceChildren();
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute(
      'transform',
      `translate(${transform.tx} ${transform.ty}) scale(${transform.scale})`,
    );

    for (const p of pieces) {
      if (!placed.has(p.code)) {
        appendPath(g, p, 'slot');
      }
    }
    for (const p of pieces) {
      if (placed.has(p.code)) {
        appendPath(g, p, 'placed');
      }
    }
    mapContentGroup = g;
    mapGroup.appendChild(g);
  }

  function clientToMapPoint(clientX: number, clientY: number): DOMPoint | null {
    if (!mapContentGroup) return null;
    const ctm = mapContentGroup.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(ctm.inverse());
  }

  function findPlacedAt(clientX: number, clientY: number): MapPiece | null {
    const mapPt = clientToMapPoint(clientX, clientY);
    if (!mapPt) return null;
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      if (!placed.has(p.code)) continue;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', p.path);
      if (path.isPointInFill(mapPt)) return p;
    }
    return null;
  }

  function findSlotAt(clientX: number, clientY: number): MapPiece | null {
    const mapPt = clientToMapPoint(clientX, clientY);
    if (!mapPt) return null;
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      if (placed.has(p.code)) continue;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', p.path);
      if (path.isPointInFill(mapPt)) return p;
    }
    return null;
  }

  function onMapTap(clientX: number, clientY: number): void {
    const placedHit = findPlacedAt(clientX, clientY);
    if (placedHit) {
      showPieceDialog(placedHit);
      return;
    }
    if (!selectedPiece) return;
    const slotHit = findSlotAt(clientX, clientY);
    if (slotHit && slotHit.code === selectedPiece.code) {
      placePiece(selectedPiece);
    }
  }

  function rebuildTray(reshuffle: boolean): void {
    trayGrid.replaceChildren();
    const remaining = pieces.filter((p) => !placed.has(p.code));
    if (reshuffle || trayOrder.length === 0) {
      trayOrder = shuffle(remaining);
    } else {
      trayOrder = trayOrder.filter((p) => !placed.has(p.code));
      for (const p of remaining) {
        if (!trayOrder.some((t) => t.code === p.code)) trayOrder.push(p);
      }
    }
    for (const piece of trayOrder) {
      const btn = el('button', 'puzzle-tray-item');
      btn.type = 'button';
      btn.setAttribute('aria-label', '地図ピースを選ぶ');
      if (selectedPiece?.code === piece.code) {
        btn.classList.add('puzzle-tray-item--selected');
      }
      const mini = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      mini.setAttribute('viewBox', pieceViewBox(piece));
      mini.setAttribute('class', 'puzzle-tray-svg');
      const mp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      mp.setAttribute('d', piece.path);
      mp.setAttribute('fill', colorForCode(piece.code));
      mp.setAttribute('stroke', '#0f766e');
      mp.setAttribute('stroke-width', '1');
      mini.appendChild(mp);
      btn.append(mini);

      btn.addEventListener('click', () => {
        selectedPiece = selectedPiece?.code === piece.code ? null : piece;
        rebuildTray(false);
        drawMap();
      });
      trayGrid.appendChild(btn);
    }
    if (reshuffle) trayViewport.scrollTop = 0;
  }

  function showPieceDialog(piece: MapPiece): void {
    const now = Date.now();
    if (piece.code === lastDialogCode && now - lastDialogAt < 400) return;
    lastDialogCode = piece.code;
    lastDialogAt = now;

    const dialog = el('div', 'puzzle-dialog');
    const card = el('div', 'puzzle-dialog-card');
    card.appendChild(el('h2', '', piece.name));
    if (encyclopediaHref) {
      card.appendChild(el('p', 'puzzle-dialog-question', '図鑑を見ますか？'));
      const actions = el('div', 'puzzle-dialog-actions');
      const yesBtn = el('button', 'btn-primary', 'はい');
      yesBtn.type = 'button';
      yesBtn.addEventListener('click', () => {
        dialog.remove();
        window.location.hash = encyclopediaHref(piece.code);
      });
      const noBtn = el('button', 'btn-secondary', 'いいえ');
      noBtn.type = 'button';
      noBtn.addEventListener('click', () => dialog.remove());
      actions.append(yesBtn, noBtn);
      card.appendChild(actions);
    } else {
      const closeBtn = el('button', 'btn-primary', '閉じる');
      closeBtn.type = 'button';
      closeBtn.addEventListener('click', () => dialog.remove());
      card.appendChild(closeBtn);
    }
    dialog.appendChild(card);
    screen.append(dialog);
    dialog.addEventListener('click', (ev) => {
      if (ev.target === dialog) dialog.remove();
    });
  }

  svg.addEventListener('click', (e) => {
    onMapTap(e.clientX, e.clientY);
  });
  svg.addEventListener(
    'touchend',
    (e) => {
      if (e.changedTouches.length !== 1) return;
      const t = e.changedTouches[0];
      onMapTap(t.clientX, t.clientY);
    },
    { passive: true },
  );

  const ro = new ResizeObserver(() => {
    drawMap();
  });
  ro.observe(mapWrap);

  rebuildTray(true);
  updateRemaining();
  requestAnimationFrame(() => drawMap());

  const onLeave = () => {
    clearInterval(tick);
    ro.disconnect();
  };
  window.addEventListener('hashchange', onLeave, { once: true });
}
