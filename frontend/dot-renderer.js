/**
 * dot-renderer.js — Renders per-section drill dot positions onto the SVG field.
 *
 * Each section has its own color and marker style:
 *   "dots"   → filled circle + section-relative number
 *   "xs"     → X shape
 *   "labels" → text like "T1", "T2" (label prefix + number)
 */

const DOT_RENDERER = (() => {
  const STEP_TO_SVG = 8;
  const SVG_CX = 640;
  const SVG_CY = 336;

  const DOT_RADIUS = 5;
  const X_SIZE = 4;
  const FONT_FAMILY = "'Inter','Segoe UI',sans-serif";

  function fieldToSVG(fx, fy) {
    return {
      x: SVG_CX + fx * STEP_TO_SVG,
      y: SVG_CY - fy * STEP_TO_SVG,
    };
  }

  /**
   * Render sections array. Each section:
   *   { positions: [{x,y}], color: string, style: 'dots'|'xs'|'labels', label: string }
   */
  function renderSections(sections) {
    const svg = document.getElementById('field-svg');
    if (!svg) return;

    const prev = svg.querySelector('#dot-layer');
    if (prev) prev.remove();

    const ns = 'http://www.w3.org/2000/svg';
    const group = document.createElementNS(ns, 'g');
    group.id = 'dot-layer';

    const defs = svg.querySelector('defs');
    if (defs && !svg.querySelector('#dot-shadow')) {
      const filter = document.createElementNS(ns, 'filter');
      filter.id = 'dot-shadow';
      filter.setAttribute('x', '-20%');
      filter.setAttribute('y', '-20%');
      filter.setAttribute('width', '140%');
      filter.setAttribute('height', '140%');
      const ds = document.createElementNS(ns, 'feDropShadow');
      ds.setAttribute('dx', '0');
      ds.setAttribute('dy', '1');
      ds.setAttribute('stdDeviation', '1');
      ds.setAttribute('flood-color', 'rgba(0,0,0,0.35)');
      filter.appendChild(ds);
      defs.appendChild(filter);
    }

    sections.forEach(section => {
      const { positions, color, style, label } = section;

      positions.forEach((pos, i) => {
        const { x, y } = fieldToSVG(pos.x, pos.y);

        if (style === 'dots') {
          const circle = document.createElementNS(ns, 'circle');
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
          circle.setAttribute('r', DOT_RADIUS);
          circle.setAttribute('fill', color);
          circle.setAttribute('stroke', '#ffffff');
          circle.setAttribute('stroke-width', '1');
          circle.setAttribute('opacity', '0.92');
          circle.setAttribute('filter', 'url(#dot-shadow)');
          group.appendChild(circle);

          const text = document.createElementNS(ns, 'text');
          text.setAttribute('x', x);
          text.setAttribute('y', y);
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'central');
          text.setAttribute('fill', '#ffffff');
          text.setAttribute('font-size', '6');
          text.setAttribute('font-weight', '600');
          text.setAttribute('font-family', FONT_FAMILY);
          text.textContent = i + 1;
          group.appendChild(text);

        } else if (style === 'xs') {
          const d = `M${x - X_SIZE},${y - X_SIZE}L${x + X_SIZE},${y + X_SIZE}M${x + X_SIZE},${y - X_SIZE}L${x - X_SIZE},${y + X_SIZE}`;
          const path = document.createElementNS(ns, 'path');
          path.setAttribute('d', d);
          path.setAttribute('stroke', color);
          path.setAttribute('stroke-width', '2');
          path.setAttribute('fill', 'none');
          path.setAttribute('opacity', '0.92');
          path.setAttribute('filter', 'url(#dot-shadow)');
          group.appendChild(path);

        } else if (style === 'labels') {
          const text = document.createElementNS(ns, 'text');
          text.setAttribute('x', x);
          text.setAttribute('y', y);
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'central');
          text.setAttribute('fill', color);
          text.setAttribute('font-size', '7');
          text.setAttribute('font-weight', '700');
          text.setAttribute('font-family', FONT_FAMILY);
          text.setAttribute('filter', 'url(#dot-shadow)');
          text.textContent = label + (i + 1);
          group.appendChild(text);
        }
      });
    });

    svg.appendChild(group);
  }

  function clear() {
    const layer = document.getElementById('field-svg')?.querySelector('#dot-layer');
    if (layer) layer.remove();
  }

  // ═══════════════════════════════════════════════════════════════
  // Bézier Curve Math
  // ═══════════════════════════════════════════════════════════════

  function cubicBezierPoint(t, P0, P1, P2, P3) {
    const u = 1 - t;
    return {
      x: u*u*u*P0.x + 3*u*u*t*P1.x + 3*u*t*t*P2.x + t*t*t*P3.x,
      y: u*u*u*P0.y + 3*u*u*t*P1.y + 3*u*t*t*P2.y + t*t*t*P3.y,
    };
  }

  /**
   * Compute evenly-spaced positions along a cubic Bézier curve.
   * Uses dense sampling + cumulative arc length for equal spacing.
   */
  function computeBezierPositions(P0, P1, P2, P3, count) {
    if (count <= 0) return [];
    if (count === 1) return [cubicBezierPoint(0.5, P0, P1, P2, P3)];

    const SAMPLES = 200;
    const samples = [];
    for (let i = 0; i <= SAMPLES; i++) {
      samples.push(cubicBezierPoint(i / SAMPLES, P0, P1, P2, P3));
    }

    const cum = [0];
    for (let i = 0; i < SAMPLES; i++) {
      const dx = samples[i + 1].x - samples[i].x;
      const dy = samples[i + 1].y - samples[i].y;
      cum.push(cum[i] + Math.hypot(dx, dy));
    }
    const totalLen = cum[SAMPLES];

    if (totalLen === 0) {
      return Array.from({ length: count }, () => ({ ...P0 }));
    }

    const positions = [];
    for (let i = 0; i < count; i++) {
      const target = count <= 1 ? 0 : (i / (count - 1)) * totalLen;
      for (let s = 0; s < SAMPLES; s++) {
        if (target >= cum[s] && target <= cum[s + 1]) {
          const segLen = cum[s + 1] - cum[s];
          const frac = segLen > 0 ? (target - cum[s]) / segLen : 0;
          positions.push({
            x: samples[s].x + frac * (samples[s + 1].x - samples[s].x),
            y: samples[s].y + frac * (samples[s + 1].y - samples[s].y),
          });
          break;
        }
      }
    }
    return positions;
  }

  return { renderSections, clear, fieldToSVG, cubicBezierPoint, computeBezierPositions };
})();
