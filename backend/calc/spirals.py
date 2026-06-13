"""
Spiral formation math for marching band drill design.

Generates an Archimedean spiral, then scales and shifts it so the actual
x-extent fits exactly within [-max_radius, +max_radius].
"""

import math
from typing import List, Tuple


def _raw_spiral(turns: float, samples: int = 4000) -> List[Tuple[float, float]]:
    """Unit spiral (a=1) sampled at equal arc-length steps."""
    total_angle = 2.0 * math.pi * turns
    a = 1.0
    d_theta = total_angle / samples

    thetas = [i * d_theta for i in range(samples + 1)]
    arc_lengths = [0.0]
    for i in range(1, samples + 1):
        theta = thetas[i]
        r = a * theta
        ds = math.sqrt(r * r + a * a) * d_theta
        arc_lengths.append(arc_lengths[-1] + ds)

    return thetas, arc_lengths


def compute_spiral_positions(
    total_performers: int,
    max_radius: float = 16.0,
    turns: float = 2.5,
    center_x: float = 0.0,
    center_y: float = 0.0,
) -> List[Tuple[float, float]]:
    """
    Place performers evenly by arc length along an Archimedean spiral.
    The spiral is scaled so its actual x-span fits exactly within
    [-max_radius, +max_radius], then shifted so it's centered on center_x.
    """
    if total_performers <= 0:
        raise ValueError("total_performers must be positive")
    if max_radius <= 0:
        raise ValueError("max_radius must be positive")
    if turns <= 0:
        raise ValueError("turns must be positive")

    SAMPLES = 4000
    total_angle = 2.0 * math.pi * turns
    thetas, arc_lengths = _raw_spiral(turns, SAMPLES)
    total_arc = arc_lengths[-1]

    # Sample unit spiral positions
    unit_pts: List[Tuple[float, float]] = []
    d_theta = total_angle / SAMPLES
    for i in range(total_performers):
        target = (i / max(total_performers - 1, 1)) * total_arc
        lo, hi = 0, SAMPLES
        while lo < hi:
            mid = (lo + hi) // 2
            if arc_lengths[mid] < target:
                lo = mid + 1
            else:
                hi = mid
        if lo == 0:
            theta = 0.0
        else:
            span = arc_lengths[lo] - arc_lengths[lo - 1]
            frac = (target - arc_lengths[lo - 1]) / max(span, 1e-12)
            theta = thetas[lo - 1] + frac * d_theta
        r = theta  # a=1
        unit_pts.append((r * math.cos(theta), r * math.sin(theta)))

    # Find actual x bounds of unit spiral
    min_x = min(p[0] for p in unit_pts)
    max_x = max(p[0] for p in unit_pts)
    unit_half_span = (max_x - min_x) / 2.0

    # Scale so half-span == max_radius
    scale = max_radius / unit_half_span if unit_half_span > 0 else 1.0

    # Shift so the spiral is centered on center_x
    unit_cx = (max_x + min_x) / 2.0

    positions = [
        (center_x + (x - unit_cx) * scale, center_y + y * scale)
        for x, y in unit_pts
    ]

    return positions
