import { describe, it, expect } from "vitest";
import { fieldToSVG, svgToField, SVG_CX, SVG_CY, STEP_PX } from "../field-coords";

// ─── fieldToSVG ───────────────────────────────────────────────────────────────

describe("fieldToSVG", () => {
    it("maps field origin (0,0) to SVG centre", () => {
        const { x, y } = fieldToSVG(0, 0);
        expect(x).toBe(SVG_CX);
        expect(y).toBe(SVG_CY);
    });

    it("+fx (rightfield) increases SVG x", () => {
        const { x } = fieldToSVG(5, 0);
        expect(x).toBeGreaterThan(SVG_CX);
        expect(x).toBeCloseTo(SVG_CX + 5 * STEP_PX, 5);
    });

    it("-fx (leftfield) decreases SVG x", () => {
        const { x } = fieldToSVG(-5, 0);
        expect(x).toBeLessThan(SVG_CX);
        expect(x).toBeCloseTo(SVG_CX - 5 * STEP_PX, 5);
    });

    it("+fy (upfield) decreases SVG y (y-axis flip)", () => {
        const { y } = fieldToSVG(0, 5);
        expect(y).toBeLessThan(SVG_CY);
        expect(y).toBeCloseTo(SVG_CY - 5 * STEP_PX, 5);
    });

    it("-fy (downfield) increases SVG y", () => {
        const { y } = fieldToSVG(0, -5);
        expect(y).toBeGreaterThan(SVG_CY);
        expect(y).toBeCloseTo(SVG_CY + 5 * STEP_PX, 5);
    });

    it("scales by STEP_PX", () => {
        const { x, y } = fieldToSVG(1, 1);
        expect(x - SVG_CX).toBeCloseTo(STEP_PX, 5);
        expect(SVG_CY - y).toBeCloseTo(STEP_PX, 5);
    });
});

// ─── svgToField ───────────────────────────────────────────────────────────────

describe("svgToField", () => {
    it("maps SVG centre to field origin", () => {
        const { x, y } = svgToField(SVG_CX, SVG_CY);
        expect(x).toBeCloseTo(0, 5);
        expect(y).toBeCloseTo(0, 5);
    });

    it("round-trips through fieldToSVG", () => {
        const cases = [
            { fx: 0, fy: 0 },
            { fx: 10, fy: -5 },
            { fx: -8, fy: 12 },
            { fx: 40, fy: 21 },
        ];
        for (const { fx, fy } of cases) {
            const svg = fieldToSVG(fx, fy);
            const back = svgToField(svg.x, svg.y);
            expect(back.x).toBeCloseTo(fx, 5);
            expect(back.y).toBeCloseTo(fy, 5);
        }
    });

    it("pixel right of centre → positive field x", () => {
        const { x } = svgToField(SVG_CX + STEP_PX, SVG_CY);
        expect(x).toBeCloseTo(1, 5);
    });

    it("pixel above centre (lower SVG y) → positive field y (upfield)", () => {
        const { y } = svgToField(SVG_CX, SVG_CY - STEP_PX);
        expect(y).toBeCloseTo(1, 5);
    });
});
