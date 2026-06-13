import { describe, it, expect } from "vitest";
import {
    computeBlock,
    computeCircle,
    computeWedge,
    computeSplinePath,
    interpolateSets,
} from "../drill-math";

// ─── computeBlock ─────────────────────────────────────────────────────────────

describe("computeBlock", () => {
    it("returns exactly `total` positions", () => {
        expect(computeBlock(12, 2, 2)).toHaveLength(12);
        expect(computeBlock(7, 3, 2)).toHaveLength(7);
        expect(computeBlock(1, 1, 2)).toHaveLength(1);
    });

    it("centres positions around (0,0)", () => {
        const pts = computeBlock(4, 2, 2);
        const xs = pts.map((p) => p.x);
        const ys = pts.map((p) => p.y);
        const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;
        const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
        expect(avgX).toBeCloseTo(0, 5);
        expect(avgY).toBeCloseTo(0, 5);
    });

    it("applies stepInterval to spacing", () => {
        const step = 3;
        const pts = computeBlock(2, 1, step);
        // Single row of 2: positions are at -step/2 and +step/2
        expect(Math.abs(pts[1].x - pts[0].x)).toBeCloseTo(step, 5);
    });

    it("handles a remainder row (total not divisible by rows)", () => {
        // 5 performers, 2 rows → row0 gets 3, row1 gets 2
        const pts = computeBlock(5, 2, 2);
        expect(pts).toHaveLength(5);
    });

    it("throws on invalid arguments", () => {
        expect(() => computeBlock(0, 1, 2)).toThrow();
        expect(() => computeBlock(2, 0, 2)).toThrow();
        expect(() => computeBlock(1, 2, 2)).toThrow(); // rows > total
        expect(() => computeBlock(4, 2, 0)).toThrow();
    });
});

// ─── computeCircle ────────────────────────────────────────────────────────────

describe("computeCircle", () => {
    it("returns exactly `total` positions", () => {
        expect(computeCircle(8, 5)).toHaveLength(8);
    });

    it("all points lie on the circle (correct radius)", () => {
        const r = 6;
        const pts = computeCircle(12, r);
        for (const p of pts) {
            const dist = Math.hypot(p.x, p.y);
            expect(dist).toBeCloseTo(r, 5);
        }
    });

    it("honours centre offset", () => {
        const cx = 3;
        const cy = -4;
        const r = 5;
        const pts = computeCircle(8, r, cx, cy);
        for (const p of pts) {
            const dist = Math.hypot(p.x - cx, p.y - cy);
            expect(dist).toBeCloseTo(r, 5);
        }
    });

    it("zero radius places all points at centre", () => {
        const pts = computeCircle(4, 0, 2, 2);
        for (const p of pts) {
            expect(p.x).toBeCloseTo(2, 5);
            expect(p.y).toBeCloseTo(2, 5);
        }
    });

    it("throws on invalid arguments", () => {
        expect(() => computeCircle(0, 5)).toThrow();
        expect(() => computeCircle(4, -1)).toThrow();
    });
});

// ─── computeWedge ─────────────────────────────────────────────────────────────

describe("computeWedge", () => {
    it("returns exactly `total` positions", () => {
        expect(computeWedge(9, 0, 0, 2)).toHaveLength(9);
        expect(computeWedge(1, 0, 0, 2)).toHaveLength(1);
    });

    it("pointing_forward: y increases with each rank", () => {
        const pts = computeWedge(7, 0, 0, 2, "pointing_forward");
        // rank 0 → y=0, rank 1 → y=2, rank 2 → y=4
        const uniqueYs = [...new Set(pts.map((p) => p.y))].sort(
            (a, b) => a - b,
        );
        expect(uniqueYs[0]).toBeCloseTo(0, 5);
        expect(uniqueYs[uniqueYs.length - 1]).toBeGreaterThan(0);
    });

    it("pointing_backward: y decreases with each rank", () => {
        const pts = computeWedge(7, 0, 0, 2, "pointing_backward");
        const uniqueYs = [...new Set(pts.map((p) => p.y))].sort(
            (a, b) => a - b,
        );
        expect(uniqueYs[uniqueYs.length - 1]).toBeCloseTo(0, 5);
        expect(uniqueYs[0]).toBeLessThan(0);
    });

    it("first rank (tip) has exactly 1 performer at vx,vy", () => {
        const pts = computeWedge(5, 1, 2, 3);
        const tip = pts[0];
        expect(tip.x).toBeCloseTo(1, 5);
        expect(tip.y).toBeCloseTo(2, 5);
    });

    it("throws on invalid arguments", () => {
        expect(() => computeWedge(0, 0, 0, 2)).toThrow();
        expect(() => computeWedge(4, 0, 0, 0)).toThrow();
    });
});

// ─── computeSplinePath ────────────────────────────────────────────────────────

describe("computeSplinePath", () => {
    const ctrl = [
        { x: -10, y: 0 },
        { x: 0, y: 5 },
        { x: 10, y: 0 },
    ];

    it("returns exactly `total` positions", () => {
        expect(computeSplinePath(ctrl, 10)).toHaveLength(10);
        expect(computeSplinePath(ctrl, 1)).toHaveLength(1);
    });

    it("output is non-linear (curved, not a straight line)", () => {
        // Straight-line control points produce linear results; curved ctrl
        // produces points that deviate from the chord.
        const pts = computeSplinePath(ctrl, 11);
        // The midpoint should be near the curve apex (y > 0), not y=0.
        const mid = pts[5];
        expect(mid.y).toBeGreaterThan(0);
    });

    it("closed path: first and last points are near each other", () => {
        const square = [
            { x: 0, y: 0 },
            { x: 4, y: 0 },
            { x: 4, y: 4 },
            { x: 0, y: 4 },
        ];
        const pts = computeSplinePath(square, 20, true);
        const first = pts[0];
        const last = pts[pts.length - 1];
        const dist = Math.hypot(last.x - first.x, last.y - first.y);
        // On a closed spline the gap between first and last sample should be
        // smaller than the overall arc — we allow up to one step size (4 units).
        expect(dist).toBeLessThan(5);
    });

    it("throws on fewer than 2 control points", () => {
        expect(() => computeSplinePath([{ x: 0, y: 0 }], 5)).toThrow();
        expect(() => computeSplinePath([], 5)).toThrow();
    });

    it("throws on total ≤ 0", () => {
        expect(() => computeSplinePath(ctrl, 0)).toThrow();
    });
});

// ─── interpolateSets ──────────────────────────────────────────────────────────

describe("interpolateSets", () => {
    const A = [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
    ];
    const B = [
        { x: 2, y: 2 },
        { x: 6, y: 2 },
    ];

    it("t=0 returns setA", () => {
        const pts = interpolateSets(A, B, 0);
        expect(pts[0]).toEqual({ x: 0, y: 0 });
        expect(pts[1]).toEqual({ x: 4, y: 0 });
    });

    it("t=1 returns setB", () => {
        const pts = interpolateSets(A, B, 1);
        expect(pts[0]).toEqual({ x: 2, y: 2 });
        expect(pts[1]).toEqual({ x: 6, y: 2 });
    });

    it("t=0.5 returns midpoint", () => {
        const pts = interpolateSets(A, B, 0.5);
        expect(pts[0].x).toBeCloseTo(1, 5);
        expect(pts[0].y).toBeCloseTo(1, 5);
        expect(pts[1].x).toBeCloseTo(5, 5);
        expect(pts[1].y).toBeCloseTo(1, 5);
    });

    it("length equals min(setA, setB)", () => {
        const short = [{ x: 0, y: 0 }];
        expect(interpolateSets(A, short, 0.5)).toHaveLength(1);
        expect(interpolateSets(short, B, 0.5)).toHaveLength(1);
    });
});
