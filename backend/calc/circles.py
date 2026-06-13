"""
Circle formation math for marching band drill design.

A circle places performers evenly around a perfect ring with a
given radius and center point.
"""

import math
from typing import List, Tuple


def compute_circle_positions(
    total_performers: int,
    radius_in_steps: float,
    center_x: float = 0.0,
    center_y: float = 0.0,
) -> List[Tuple[float, float]]:
    """
    Compute (x, y) coordinates for performers evenly spaced around a circle.

    Standard circle math (parametric equation of a circle):
        For performer i out of n:
            angle_i  = 2 * pi * i / n
            x_i      = center_x + radius * cos(angle_i)
            y_i      = center_y + radius * sin(angle_i)

    Angles start at 0 (3 o'clock / right sideline) and sweep
    counter-clockwise, following standard math convention.

    Coordinate system (per project convention):
        0, 0 = center of field
        +x    = sideline to sideline (right)
        +y    = endzone to endzone   (upfield / toward back sideline)

    Args:
        total_performers: Number of performers to place on the circle.
        radius_in_steps:  Radius of the ring in field coordinate units.
        center_x:         X-coordinate of the circle's center
                          (default: 0, the field's center).
        center_y:         Y-coordinate of the circle's center
                          (default: 0, the field's center).

    Returns:
        List of (x, y) tuples, one per performer, ordered by increasing
        angle starting from 3 o'clock.

    Raises:
        ValueError: If total_performers <= 0 or radius_in_steps < 0.
    """
    if total_performers <= 0:
        raise ValueError("total_performers must be positive")
    if radius_in_steps < 0:
        raise ValueError("radius_in_steps cannot be negative")

    positions: List[Tuple[float, float]] = []

    for i in range(total_performers):
        # Angular step: split the full circle evenly among all performers
        angle = 2.0 * math.pi * i / total_performers

        x = center_x + radius_in_steps * math.cos(angle)
        y = center_y + radius_in_steps * math.sin(angle)

        positions.append((x, y))

    return positions
