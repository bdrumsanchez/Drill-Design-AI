/**
 * drill-math.js — In-browser implementations of drill formation math.
 *
 * Mirrors the Python backend (backend/math/):
 *   blocks.py   → computeBlock()
 *   circles.py  → computeCircle()
 *   wedges.py   → computeWedge()
 *   curves.py   → computePath()
 *
 * All positions use the project's field-coordinate convention:
 *   0,0 = center of field
 *   +x  = sideline to sideline (right)
 *   +y  = endzone to endzone   (upfield / toward back sideline)
 *
 * Each function returns an array of {x, y} objects.
 */

const DRILL_MATH = (() => {

  /**
   * Block formation — rectangular grid centered on (0,0).
   */
  function computeBlock(total, rows, stepInterval) {
    if (total <= 0) throw Error('total must be positive');
    if (rows <= 0) throw Error('rows must be positive');
    if (rows > total) throw Error('rows cannot exceed total');
    if (stepInterval <= 0) throw Error('stepInterval must be positive');

    const cols = Math.ceil(total / rows);
    const remainder = total % rows;
    const positions = [];

    for (let r = 0; r < rows; r++) {
      const fullRow = remainder === 0 || r < remainder;
      const thisCols = fullRow ? cols : cols - 1;
      const y = (r - (rows - 1) / 2) * stepInterval;

      for (let c = 0; c < thisCols; c++) {
        const x = (c - (thisCols - 1) / 2) * stepInterval;
        positions.push({ x, y });
      }
    }

    return positions;
  }

  /**
   * Circle formation — performers evenly spaced around a ring.
   */
  function computeCircle(total, radius, cx, cy) {
    if (total <= 0) throw Error('total must be positive');
    if (radius < 0) throw Error('radius cannot be negative');

    cx = cx ?? 0;
    cy = cy ?? 0;
    const positions = [];

    for (let i = 0; i < total; i++) {
      const angle = 2 * Math.PI * i / total;
      positions.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
    }

    return positions;
  }

  /**
   * Wedge formation — triangular arrow shape from a vertex point.
   */
  function computeWedge(total, vx, vy, stepInterval, direction) {
    if (total <= 0) throw Error('total must be positive');
    if (stepInterval <= 0) throw Error('stepInterval must be positive');

    vx = vx ?? 0;
    vy = vy ?? 0;
    direction = direction || 'pointing_forward';

    if (!['pointing_forward', 'pointing_backward'].includes(direction)) {
      throw Error("direction must be 'pointing_forward' or 'pointing_backward'");
    }

    const ySign = direction === 'pointing_forward' ? 1 : -1;
    const positions = [];
    let remaining = total;
    let rank = 0;

    while (remaining > 0) {
      const dotsInRank = Math.min(2 * rank + 1, remaining);
      const y = vy + ySign * rank * stepInterval;

      for (let c = 0; c < dotsInRank; c++) {
        const x = vx + (c - (dotsInRank - 1) / 2) * stepInterval;
        positions.push({ x, y });
      }

      remaining -= dotsInRank;
      rank++;
    }

    return positions;
  }

  /**
   * Path formation — performers evenly distributed along a polyline.
   * points: array of {x, y} control points.
   */
  function computePath(points, total, closed) {
    if (total <= 0) throw Error('total must be positive');
    if (!points || points.length < 2) throw Error('at least 2 control points required');

    const pts = points.map(p => ({ x: p.x, y: p.y }));
    const n = pts.length;
    let segCount = n - 1;
    if (closed) segCount++;

    // Cumulative distance at each vertex
    const cum = [0];
    for (let i = 0; i < n - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x;
      const dy = pts[i + 1].y - pts[i].y;
      cum.push(cum[cum.length - 1] + Math.hypot(dx, dy));
    }
    if (closed) {
      const dx = pts[0].x - pts[n - 1].x;
      const dy = pts[0].y - pts[n - 1].y;
      cum.push(cum[cum.length - 1] + Math.hypot(dx, dy));
    }

    const totalLen = cum[cum.length - 1];

    // Degenerate: all points coincident
    if (totalLen === 0) {
      return Array.from({ length: total }, () => ({ ...pts[0] }));
    }

    const positions = [];

    for (let i = 0; i < total; i++) {
      let target;
      if (total === 1) {
        target = 0;
      } else if (closed) {
        target = (i / total) * totalLen;
      } else {
        target = (i / (total - 1)) * totalLen;
      }
      target = Math.min(target, totalLen);

      let found = false;
      for (let s = 0; s < segCount; s++) {
        const segStart = cum[s];
        const segEnd = cum[s + 1];
        const segLen = segEnd - segStart;
        if (segLen === 0) continue;

        if (target >= segStart && target <= segEnd + 1e-9) {
          const frac = (target - segStart) / segLen;

          let p1, p2;
          if (s < n - 1) {
            p1 = pts[s];
            p2 = pts[s + 1];
          } else {
            p1 = pts[n - 1];
            p2 = pts[0];
          }

          positions.push({
            x: p1.x + frac * (p2.x - p1.x),
            y: p1.y + frac * (p2.y - p1.y),
          });
          found = true;
          break;
        }
      }

      if (!found) positions.push({ ...pts[pts.length - 1] });
    }

    return positions;
  }

  return { computeBlock, computeCircle, computeWedge, computePath };
})();
