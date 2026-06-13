// Minimal re-export of @openmarch/core — only the parts used by Drill Design AI.
// Avoids importing segments that depend on uuid/svg-path-commander.

export * from "./field";
export * from "./shapes";

// Path-utility: export only what we use (Spline + geometry utils).
// Do NOT re-export the full path-utility index (it pulls in uuid/svg-path-commander).
export type {
    IPath,
    IControllableSegment,
    Point,
    SegmentJsonData,
    PathJsonData,
    ControlPoint,
    ControlPointType,
} from "./path-utility/interfaces";

export { Spline } from "./path-utility/segments/Spline";
export {
    distance,
    pointOnLine,
    pointOnQuadraticBezier,
    pointOnCubicBezier,
} from "./path-utility/geometry-utils";
