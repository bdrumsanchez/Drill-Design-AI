/**
 * field-coords.ts — Convert between field-step coordinates and SVG canvas pixels.
 *
 * Uses FieldProperties from @openmarch/core to derive the canonical
 * pixels-per-step value and center anchor, replacing the hardcoded
 * constants that were scattered across drill-math.js and dot-renderer.js.
 *
 * SVG canvas is 1280 × 672 px (matches App.svelte viewBox).
 * Field center (50-yd line, front sideline) maps to SVG (640, 336).
 *
 * Field-step space:
 *   +x → right (toward S2 / press box side)
 *   +y → upfield (toward back sideline / top of SVG)
 */

import { FieldProperties } from "./openmarch-core";

// This SVG field is drawn with grid lines every 8px = 1 step.
// (FieldProperties.PIXELS_PER_INCH × 22.5in = 11.25 applies to OpenMarch's
// own canvas; here we match the hand-built SVG grid in App.svelte.)
const STEP_PX = 8;

// SVG origin in pixels — center of the 1280×672 viewBox
export const SVG_CX = 640;
export const SVG_CY = 336;

/** Convert field-step coordinates to SVG pixel coordinates. */
export function fieldToSVG(fx: number, fy: number): { x: number; y: number } {
    return {
        x: SVG_CX + fx * STEP_PX,
        // y-axis is flipped: +fy (upfield) → lower SVG y value
        y: SVG_CY - fy * STEP_PX,
    };
}

/** Convert SVG pixel coordinates back to field-step coordinates. */
export function svgToField(px: number, py: number): { x: number; y: number } {
    return {
        x: (px - SVG_CX) / STEP_PX,
        y: (SVG_CY - py) / STEP_PX,
    };
}

/** Pixels per step, derived from FieldProperties. */
export { STEP_PX };
