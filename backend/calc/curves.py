"""
Path / curve formation math for marching band drill design.

Distributes performers evenly along a path defined by a sequence of
control points (waypoints). The path is a polyline — straight line
segments connecting consecutive control points.

This enables any arbitrary connected shape: diagonals, zig-zags,
follow-the-leader arcs, or closed loops like ovals and custom rings.
"""

import math
from typing import List, Tuple


def compute_path_positions(
    control_points: List[Tuple[float, float]],
    total_performers: int,
    closed: bool = False,
) -> List[Tuple[float, float]]:
    """
    Compute (x, y) coordinates for performers evenly distributed
    along a polyline path defined by control points.

    How it works (the math):

    1. Segment lengths
       Each consecutive pair of control points forms a segment.
       Segment length = sqrt((x₂ - x₁)² + (y₂ - y₁)²).

    2. Total path length
       Sum of all segment lengths. If ``closed=True``, an extra
       closing segment is added from the last point back to the first.

    3. Target distance for each performer
       For an **open** path, performer i is placed at:
           t = i / (n - 1)   of the total length
       so performer 0 is at the start and performer n-1 is at the end.

       For a **closed** path, performer i is placed at:
           t = i / n          of the total length
       so performers are evenly spaced around the loop (no duplicate at
       the start/end seam).

    4. Segment walk
       Walk through segments, accumulating their lengths, until we
       reach the segment that contains the target distance.

    5. Linear interpolation within the segment
           frac = (target - segment_start) / segment_length
           x    = x₁ + frac * (x₂ - x₁)
           y    = y₁ + frac * (y₂ - y₁)

    Coordinate system (per project convention):
        0, 0 = center of field
        +x    = sideline to sideline (right)
        +y    = endzone to endzone   (upfield / toward back sideline)

    Args:
        control_points:   Ordered list of (x, y) waypoints defining
                          the path. At least 2 points are required.
        total_performers: Number of performers to distribute along
                          the path.
        closed:           If True, the path forms a closed loop by
                          connecting the last point back to the first.

    Returns:
        List of (x, y) tuples, one per performer, ordered from the
        start of the path to the end.

    Raises:
        ValueError: If total_performers <= 0, or fewer than 2
                    control points are provided.
    """
    if total_performers <= 0:
        raise ValueError("total_performers must be positive")
    if len(control_points) < 2:
        raise ValueError("at least 2 control points are required")

    num_cp = len(control_points)
    num_segments = num_cp - 1
    if closed:
        num_segments += 1  # extra closing segment

    # ------------------------------------------------------------------
    # 1. Compute cumulative distance at each vertex along the path
    # ------------------------------------------------------------------
    cumulative = [0.0]
    for i in range(num_cp - 1):
        x1, y1 = control_points[i]
        x2, y2 = control_points[i + 1]
        seg_len = math.hypot(x2 - x1, y2 - y1)
        cumulative.append(cumulative[-1] + seg_len)

    if closed:
        x1, y1 = control_points[-1]
        x2, y2 = control_points[0]
        seg_len = math.hypot(x2 - x1, y2 - y1)
        cumulative.append(cumulative[-1] + seg_len)

    total_length = cumulative[-1]

    # Edge case: all control points are coincident (zero-length path)
    if total_length == 0:
        return [control_points[0] for _ in range(total_performers)]

    # ------------------------------------------------------------------
    # 2. Distribute performers evenly along the total length
    # ------------------------------------------------------------------
    positions: List[Tuple[float, float]] = []

    for i in range(total_performers):
        # Compute the fraction of total length for this performer
        if total_performers == 1:
            target = 0.0
        elif closed:
            # Spread evenly around the loop; last performer stops
            # just before repeating the start point.
            target = (i / total_performers) * total_length
        else:
            # Open path: first at 0, last at total_length
            target = (i / (total_performers - 1)) * total_length

        # Guard against floating-point overshoot at the very end
        target = min(target, total_length)

        # Walk segments to find where this target falls
        found = False
        for seg_idx in range(num_segments):
            seg_start = cumulative[seg_idx]
            seg_end = cumulative[seg_idx + 1]
            seg_len = seg_end - seg_start

            if seg_len == 0:
                continue  # skip degenerate zero-length segments

            if seg_start <= target <= seg_end:
                frac = (target - seg_start) / seg_len

                # Identify the two endpoints for this segment
                if seg_idx < num_cp - 1:
                    p1 = control_points[seg_idx]
                    p2 = control_points[seg_idx + 1]
                else:
                    # Closing segment: last point → first point
                    p1 = control_points[-1]
                    p2 = control_points[0]

                x = p1[0] + frac * (p2[0] - p1[0])
                y = p1[1] + frac * (p2[1] - p1[1])
                positions.append((x, y))
                found = True
                break

        # Safety guard: should never happen, but ensures we always
        # produce the right number of positions
        if not found:
            positions.append(control_points[-1])

    return positions
