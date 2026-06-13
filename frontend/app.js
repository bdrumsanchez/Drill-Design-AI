/**
 * Grid layer for the drill design field (technical / drafting-paper mode).
 *
 * Three strictly-defined grid levels using modulo-8 math:
 *
 *   if step % 8 === 0  →  thick dark major yardline
 *   else if step % 4 === 0  →  medium grayish accent line
 *   else  →  very faint 1-step grid line
 *
 * Grid math:
 *   1 step = 8 pixels (exact integer scale — zero sub-pixel distortion)
 *   8 steps = 5 yards (aligns with every main yard line)
 *
 * The grid covers the field of play (goal line to goal line):
 *   x: 0 → 1280   (160 steps at 8 px/step)
 *   y: 0 → 672    (84 steps at 8 px/step)
 */

const STEP = 8;

const FIELD = {
  xStart: 0,
  xEnd:   1280,
  yStart: 0,
  yEnd:   672,
};

function buildGridPathData() {
  const { xStart, xEnd, yStart, yEnd } = FIELD;

  const oneStep = [];
  const fourStep = [];
  const eightStep = [];

  const vCount = (xEnd - xStart) / STEP;
  for (let i = 0; i <= vCount; i++) {
    const x = xStart + i * STEP;
    const d = `M${x},${yStart}L${x},${yEnd}`;
    if (i % 8 === 0) {
      eightStep.push(d);
    } else if (i % 4 === 0) {
      fourStep.push(d);
    } else {
      oneStep.push(d);
    }
  }

  const hCount = (yEnd - yStart) / STEP;
  for (let i = 0; i <= hCount; i++) {
    const y = yStart + i * STEP;
    const d = `M${xStart},${y}L${xEnd},${y}`;
    if (i % 8 === 0) {
      eightStep.push(d);
    } else if (i % 4 === 0) {
      fourStep.push(d);
    } else {
      oneStep.push(d);
    }
  }

  return { oneStep: oneStep.join(''), fourStep: fourStep.join(''), eightStep: eightStep.join('') };
}

function drawGrid() {
  const svg = document.getElementById('field-svg');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';

  const old = svg.querySelector('#grid-layer');
  if (old) old.remove();

  const group = document.createElementNS(ns, 'g');
  group.id = 'grid-layer';

  const { oneStep, fourStep, eightStep } = buildGridPathData();

  const path1 = document.createElementNS(ns, 'path');
  path1.setAttribute('d', oneStep);
  path1.setAttribute('fill', 'none');
  path1.setAttribute('stroke', 'rgba(80, 75, 68, 0.07)');
  path1.setAttribute('stroke-width', '1');
  group.appendChild(path1);

  const path4 = document.createElementNS(ns, 'path');
  path4.setAttribute('d', fourStep);
  path4.setAttribute('fill', 'none');
  path4.setAttribute('stroke', 'rgba(80, 75, 68, 0.25)');
  path4.setAttribute('stroke-width', '1');
  group.appendChild(path4);

  const path8 = document.createElementNS(ns, 'path');
  path8.setAttribute('d', eightStep);
  path8.setAttribute('fill', 'none');
  path8.setAttribute('stroke', 'rgba(80, 75, 68, 0.55)');
  path8.setAttribute('stroke-width', '2');
  group.appendChild(path8);

  // Insert the grid before the hardcoded yard lines
  const yardLines = svg.querySelector('#yard-lines');
  if (yardLines) {
    svg.insertBefore(group, yardLines);
  } else {
    svg.appendChild(group);
  }

  drawHashes(svg, ns);
}

function drawHashes(svg, ns) {
  const old = svg.querySelector('#hash-marks');
  if (old) old.remove();

  const group = document.createElementNS(ns, 'g');
  group.id = 'hash-marks';
  group.setAttribute('stroke', '#8a8275');
  group.setAttribute('stroke-width', '2.5');
  group.setAttribute('opacity', '0.85');

  // NCAA hash marks:
  //   Front hash: 32 steps up from front sideline  → y = 672 - 32*8 = 416
  //   Back hash:  52 steps up from front sideline  → y = 672 - 52*8 = 256
  //               (= 20 steps past front hash = 32 steps to back sideline)
  //   Each hash is ~3 steps (24px) wide, centered on the 5-yard line
  //   5-yard lines at x = 64, 128, ... 1216 (every 8 steps = 64px, skip goal lines)
  const STEPS_FRONT = 32;
  const STEPS_BACK = 52;
  const hashYFront = FIELD.yEnd - STEPS_FRONT * STEP;
  const hashYBack  = FIELD.yEnd - STEPS_BACK  * STEP;
  const halfW = 12;

  for (let yi = 0; yi < 2; yi++) {
    const y = yi === 0 ? hashYBack : hashYFront;
    for (let x = 8 * STEP; x < FIELD.xEnd; x += 8 * STEP) {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x - halfW);
      line.setAttribute('y1', y);
      line.setAttribute('x2', x + halfW);
      line.setAttribute('y2', y);
      group.appendChild(line);
    }
  }

  // Append at end of SVG so hashes sit above grid & yard lines
  svg.appendChild(group);
}

// ── Draw the grid when the DOM is ready ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', drawGrid);
} else {
  drawGrid();
}

// ═════════════════════════════════════════════════════════════════
// Field Theme Toggle — paper (drafting) ↔ green (stadium)
// ═════════════════════════════════════════════════════════════════

const FIELD_THEMES = {
  paper: {
    label: 'Paper',
    stripeA: '#f7f4ef',
    stripeB: '#f5f1ea',
    fieldStroke: '#8a8275',
    markingStroke: '#8a8275',
    numberFill: '#6b6358',
    markerFill: '#8a8275',
    hashStroke: '#8a8275',
  },
  green: {
    label: 'Green',
    stripeA: '#2d8a4e',
    stripeB: '#267a45',
    fieldStroke: '#ffffff',
    markingStroke: '#ffffff',
    numberFill: '#ffffff',
    markerFill: '#ffffff',
    hashStroke: '#ffffff',
  },
};

let currentTheme = 'paper';

function applyFieldTheme(themeName) {
  const theme = FIELD_THEMES[themeName];
  if (!theme) return;

  const svg = document.getElementById('field-svg');
  if (!svg) return;

  // Grass stripe pattern rects
  const pattern = svg.querySelector('#grass-stripe');
  if (pattern) {
    const rects = pattern.querySelectorAll('rect');
    if (rects[0]) rects[0].setAttribute('fill', theme.stripeA);
    if (rects[1]) rects[1].setAttribute('fill', theme.stripeB);
  }

  // Field border (the rect with fill="none")
  const border = svg.querySelector('rect[fill="none"]');
  if (border) border.setAttribute('stroke', theme.fieldStroke);

  // Yard lines
  const yards = svg.querySelector('#yard-lines');
  if (yards) yards.setAttribute('stroke', theme.markingStroke);

  // Hash marks
  const hashes = svg.querySelector('#hash-marks');
  if (hashes) hashes.setAttribute('stroke', theme.hashStroke);

  // Yard numbers
  const nums = svg.querySelector('#yard-numbers');
  if (nums) nums.setAttribute('fill', theme.numberFill);

  // Center field markers
  const markers = svg.querySelector('#field-markers');
  if (markers) {
    markers.setAttribute('stroke', theme.markingStroke);
    const circles = markers.querySelectorAll('circle');
    circles.forEach(c => {
      if (c.getAttribute('fill') && c.getAttribute('fill') !== 'none') {
        c.setAttribute('fill', theme.markerFill);
      }
    });
  }

  currentTheme = themeName;
}

const API_BASE = 'http://localhost:8000';

function closeColorGrids() {
  document.querySelectorAll('.srow-colors.open').forEach(g => g.classList.remove('open'));
}

document.addEventListener('click', e => {
  if (!e.target.closest('.srow-colors') && !e.target.closest('.srow-color-btn')) {
    closeColorGrids();
  }
});

const PRESET_COLORS = window.PRESET_COLORS || [
  ['#ff1744', '#ff9100', '#ffd600', '#c6ff00', '#00e676', '#1de9b6', '#00e5ff', '#40c4ff', '#2979ff', '#536dfe', '#7c4dff', '#d500f9', '#ff4081'],
  ['#d50000', '#ff6d00', '#ffc400', '#aeea00', '#00c853', '#00bfa5', '#00b8d4', '#0091ea', '#2962ff', '#304ffe', '#651fff', '#aa00ff', '#ff0090'],
  ['#b71c1c', '#e65100', '#ffab00', '#76b900', '#1b5e20', '#00695c', '#00838f', '#01579b', '#0d47a1', '#1a237e', '#311b92', '#4a148c', '#880e4f'],
  ['#c27a6f', '#bf8f5c', '#bea550', '#8f9b5a', '#6d9270', '#5d8474', '#5c868f', '#6a8b97', '#6c7b8c', '#786f87', '#846d87', '#88687d', '#966a72'],
];

// ═════════════════════════════════════════════════════════════════
// Bézier Curve Drawing Tool
// ═════════════════════════════════════════════════════════════════

const CURVE_TOOL = {
  active: false,
  points: [],
  dragIdx: -1,

  // ── Coordinate helpers (field ⇄ SVG) ──
  _svgToField(svgX, svgY) {
    return { x: (svgX - 640) / 8, y: (336 - svgY) / 8 };
  },

  _fieldToSVG(fx, fy) {
    return { x: 640 + fx * 8, y: 336 - fy * 8 };
  },

  _getSVGPoint(event) {
    const svg = document.getElementById('field-svg');
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  },

  // ── Mode management ──
  enterMode() {
    this.active = true;
    this.points = [];
    this.dragIdx = -1;
    this._clearLayer();
    const svg = document.getElementById('field-svg');
    if (svg) svg.style.cursor = 'crosshair';
    document.querySelector('.status-msg').textContent = 'Curve draw mode: click to place start point';
    document.getElementById('curve-draw-btn')?.classList.add('active');
    document.getElementById('apply-curve-btn')?.classList.remove('hidden');
    this._attachEvents();
  },

  exitMode() {
    this.active = false;
    this.points = [];
    this.dragIdx = -1;
    this._clearLayer();
    const svg = document.getElementById('field-svg');
    if (svg) svg.style.cursor = '';
    document.getElementById('curve-draw-btn')?.classList.remove('active');
    document.getElementById('apply-curve-btn')?.classList.add('hidden');
    document.querySelector('.status-msg').textContent = 'Ready';
    this._removeEvents();
  },

  clearHandles() {
    this.points = [];
    this.dragIdx = -1;
    this._clearLayer();
    document.getElementById('apply-curve-btn')?.classList.add('hidden');
    if (this.active) {
      document.querySelector('.status-msg').textContent = 'Curve draw mode: click to place start point';
    }
  },

  // ── Event binding ──
  _onMouseDown(e) {
    if (!CURVE_TOOL.active) return;
    const svgPt = CURVE_TOOL._getSVGPoint(e);
    if (!svgPt) return;
    const fieldPt = CURVE_TOOL._svgToField(svgPt.x, svgPt.y);

    // Hit-test existing handles (SVG radius ~12px)
    for (let i = 0; i < CURVE_TOOL.points.length; i++) {
      const svgH = CURVE_TOOL._fieldToSVG(CURVE_TOOL.points[i].x, CURVE_TOOL.points[i].y);
      const dx = svgPt.x - svgH.x;
      const dy = svgPt.y - svgH.y;
      if (Math.hypot(dx, dy) <= 14) {
        CURVE_TOOL.dragIdx = i;
        return;
      }
    }

    // Place new point
    if (CURVE_TOOL.points.length === 0) {
      CURVE_TOOL.points.push({ x: fieldPt.x, y: fieldPt.y });
      document.querySelector('.status-msg').textContent = 'Click to place end point';
    } else if (CURVE_TOOL.points.length === 1) {
      const P0 = CURVE_TOOL.points[0];
      const P3 = { x: fieldPt.x, y: fieldPt.y };
      const P1 = { x: P0.x + (P3.x - P0.x) / 3, y: P0.y + (P3.y - P0.y) / 3 };
      const P2 = { x: P0.x + 2 * (P3.x - P0.x) / 3, y: P0.y + 2 * (P3.y - P0.y) / 3 };
      CURVE_TOOL.points.push(P1, P2, P3);
      document.querySelector('.status-msg').textContent = 'Drag handles to shape the curve';
      document.getElementById('apply-curve-btn')?.classList.remove('hidden');
    }
    CURVE_TOOL._render();
  },

  _onMouseMove(e) {
    if (!CURVE_TOOL.active || CURVE_TOOL.dragIdx < 0) return;
    const svgPt = CURVE_TOOL._getSVGPoint(e);
    if (!svgPt) return;
    const fieldPt = CURVE_TOOL._svgToField(svgPt.x, svgPt.y);
    CURVE_TOOL.points[CURVE_TOOL.dragIdx] = { x: fieldPt.x, y: fieldPt.y };
    CURVE_TOOL._render();
  },

  _onMouseUp() {
    CURVE_TOOL.dragIdx = -1;
  },

  _attachEvents() {
    const svg = document.getElementById('field-svg');
    if (!svg) return;
    svg.addEventListener('mousedown', this._onMouseDown);
    svg.addEventListener('mousemove', this._onMouseMove);
    svg.addEventListener('mouseup', this._onMouseUp);
    svg.addEventListener('mouseleave', this._onMouseUp);
  },

  _removeEvents() {
    const svg = document.getElementById('field-svg');
    if (!svg) return;
    svg.removeEventListener('mousedown', this._onMouseDown);
    svg.removeEventListener('mousemove', this._onMouseMove);
    svg.removeEventListener('mouseup', this._onMouseUp);
    svg.removeEventListener('mouseleave', this._onMouseUp);
  },

  // ── SVG rendering ──
  _clearLayer() {
    const svg = document.getElementById('field-svg');
    if (!svg) return;
    const layer = svg.querySelector('#curve-draw-layer');
    if (layer) layer.remove();
  },

  _render() {
    const svg = document.getElementById('field-svg');
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';

    this._clearLayer();
    if (this.points.length === 0) return;

    const pts = this.points;
    const group = document.createElementNS(ns, 'g');
    group.id = 'curve-draw-layer';

    if (pts.length >= 2) {
      const p0s = this._fieldToSVG(pts[0].x, pts[0].y);
      const p3s = this._fieldToSVG(pts[pts.length - 1].x, pts[pts.length - 1].y);

      // Show a straight preview line if only 2 points
      if (pts.length < 4) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', p0s.x); line.setAttribute('y1', p0s.y);
        line.setAttribute('x2', p3s.x); line.setAttribute('y2', p3s.y);
        line.setAttribute('stroke', 'rgba(59,130,246,0.4)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '6,4');
        group.appendChild(line);
      }
    }

    // Full cubic Bézier
    if (pts.length === 4) {
      const p0s = this._fieldToSVG(pts[0].x, pts[0].y);
      const p1s = this._fieldToSVG(pts[1].x, pts[1].y);
      const p2s = this._fieldToSVG(pts[2].x, pts[2].y);
      const p3s = this._fieldToSVG(pts[3].x, pts[3].y);

      // Tangent lines (dashed)
      for (const [from, to] of [[p0s, p1s], [p3s, p2s]]) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', from.x); line.setAttribute('y1', from.y);
        line.setAttribute('x2', to.x); line.setAttribute('y2', to.y);
        line.setAttribute('stroke', 'rgba(255,255,255,0.25)');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '4,4');
        group.appendChild(line);
      }

      // Bézier curve path
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', `M${p0s.x},${p0s.y} C${p1s.x},${p1s.y} ${p2s.x},${p2s.y} ${p3s.x},${p3s.y}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#3b82f6');
      path.setAttribute('stroke-width', '3');
      path.setAttribute('opacity', '0.9');
      group.appendChild(path);
    }

    // Handle circles + labels
    const handleDefs = [
      { idx: 0, label: 'P0', fill: '#22c55e', r: 8 },
    ];
    if (pts.length >= 3) {
      handleDefs.push(
        { idx: 1, label: 'P1', fill: 'none', stroke: '#f59e0b', r: 7 },
        { idx: 2, label: 'P2', fill: 'none', stroke: '#f59e0b', r: 7 },
        { idx: 3, label: 'P3', fill: '#ef4444', r: 8 },
      );
    }

    for (const h of handleDefs) {
      if (h.idx >= pts.length) continue;
      const svgPt = this._fieldToSVG(pts[h.idx].x, pts[h.idx].y);

      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', svgPt.x);
      circle.setAttribute('cy', svgPt.y);
      circle.setAttribute('r', String(h.r));
      circle.setAttribute('fill', h.fill || '#fff');
      if (h.stroke) circle.setAttribute('stroke', h.stroke);
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('cursor', 'grab');
      circle.setAttribute('class', 'curve-handle');
      group.appendChild(circle);

      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', svgPt.x + h.r + 5);
      text.setAttribute('y', svgPt.y + 4);
      text.setAttribute('fill', '#94a3b8');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', "'Inter','Segoe UI',sans-serif");
      text.textContent = h.label;
      group.appendChild(text);
    }

    svg.appendChild(group);
  },

  // ── Compute evenly-spaced positions (delegates to DOT_RENDERER) ──
  computeBezierPositions(P0, P1, P2, P3, count) {
    return DOT_RENDERER.computeBezierPositions(P0, P1, P2, P3, count);
  },
};
