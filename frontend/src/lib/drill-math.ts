/**
 * drill-math.ts — Formation math powered by @openmarch/core.
 *
 * Coordinate convention (field space, in steps):
 *   0,0 = center of field
 *   +x  = right (S1 → S2)
 *   +y  = upfield (front → back sideline)
 *
 * All functions return { x, y }[] in field-step coordinates.
 * Use fieldToSVG() from field-coords.ts to convert to canvas pixels.
 */

import { Spline } from "./openmarch-core";
import type { Point } from "./openmarch-core";

export type FieldPoint = { x: number; y: number };

// ─── Block ───────────────────────────────────────────────────────────────────

export function computeBlock(
    total: number,
    rows: number,
    stepInterval: number,
): FieldPoint[] {
    if (total <= 0) throw Error("total must be positive");
    if (rows <= 0) throw Error("rows must be positive");
    if (rows > total) throw Error("rows cannot exceed total");
    if (stepInterval <= 0) throw Error("stepInterval must be positive");

    const cols = Math.ceil(total / rows);
    const remainder = total % rows;
    const positions: FieldPoint[] = [];

    for (let r = 0; r < rows; r++) {
        const fullRow = remainder === 0 || r < remainder;
        const thisCols = fullRow ? cols : cols - 1;
        const y = (r - (rows - 1) / 2) * stepInterval;

        for (let c = 0; c < thisCols; c++) {
            if (positions.length >= total) break;
            const x = (c - (thisCols - 1) / 2) * stepInterval;
            positions.push({ x, y });
        }
    }

    return positions;
}

// ─── Circle ──────────────────────────────────────────────────────────────────

export function computeCircle(
    total: number,
    radius: number,
    cx = 0,
    cy = 0,
): FieldPoint[] {
    if (total <= 0) throw Error("total must be positive");
    if (radius < 0) throw Error("radius cannot be negative");

    return Array.from({ length: total }, (_, i) => {
        const angle = (2 * Math.PI * i) / total;
        return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    });
}

// ─── Wedge ───────────────────────────────────────────────────────────────────

export function computeWedge(
    total: number,
    vx = 0,
    vy = 0,
    stepInterval: number,
    direction: "pointing_forward" | "pointing_backward" = "pointing_forward",
): FieldPoint[] {
    if (total <= 0) throw Error("total must be positive");
    if (stepInterval <= 0) throw Error("stepInterval must be positive");

    const ySign = direction === "pointing_forward" ? 1 : -1;
    const positions: FieldPoint[] = [];
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

// ─── Spline path (replaces linear computePath) ───────────────────────────────

/**
 * Distribute `total` performers evenly along a Catmull-Rom spline through
 * the given control points. When closed=true the path wraps back to start.
 *
 * This replaces the old linear-interpolation computePath() with smooth
 * cubic curves from OpenMarch's Spline class.
 */
export function computeSplinePath(
    points: FieldPoint[],
    total: number,
    closed = false,
    tension = 0.5,
): FieldPoint[] {
    if (total <= 0) throw Error("total must be positive");
    if (!points || points.length < 2) throw Error("at least 2 control points required");

    const spline = Spline.fromPoints(points as Point[], tension, closed);
    return spline.getEquidistantPoints(total) as FieldPoint[];
}

// ─── Transition interpolation ────────────────────────────────────────────────

/**
 * Interpolate each performer's position between two sets (setA → setB).
 * t=0 → setA, t=1 → setB. Returns intermediate positions for animation.
 */
export function interpolateSets(
    setA: FieldPoint[],
    setB: FieldPoint[],
    t: number,
): FieldPoint[] {
    const count = Math.min(setA.length, setB.length);
    return Array.from({ length: count }, (_, i) => ({
        x: setA[i].x + (setB[i].x - setA[i].x) * t,
        y: setA[i].y + (setB[i].y - setA[i].y) * t,
    }));
}
