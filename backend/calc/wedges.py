"""
Wedge formation math for marching band drill design.

A wedge (arrow) is a triangular block that widens symmetrically
from a vertex point. Each successive rank adds 2 performers
(one left, one right), creating a filled V / arrow shape.
"""

from typing import List, Tuple


def compute_wedge_positions(
    total_performers: int,
    vertex_x: float = 0.0,
    vertex_y: float = 0.0,
    step_interval: float = 4.0,
    direction: str = "pointing_forward",
) -> List[Tuple[float, float]]:
    """
    Compute (x, y) coordinates for a wedge (arrow) formation.

    The wedge builds from the vertex outward in ranks:
      Rank 0 (tip):           1 performer  (center only)
      Rank 1:                 3 performers (center + 1 left + 1 right)
      Rank 2:                 5 performers
      ...
      Rank r (full):          2r + 1 performers

    Full ranks fill from the tip outward. If total_performers is
    not a perfect square (k full ranks = k² dots), the outermost
    rank is partially filled but remains centered on the wedge axis.

    Coordinate system (per project convention):
        0, 0 = center of field
        +x    = sideline to sideline (right)
        +y    = endzone to endzone   (upfield / toward back sideline)

    Args:
        total_performers: Number of performers in the wedge.
        vertex_x:         X-coordinate of the wedge tip (default: 0).
        vertex_y:         Y-coordinate of the wedge tip (default: 0).
        step_interval:    Center-to-center spacing between adjacent dots,
                          in field coordinate units (default: 4).
        direction:        Which way the wedge points:
                          - "pointing_forward"  → tip toward front
                            sideline; wedge opens upfield (+y).
                          - "pointing_backward" → tip toward back
                            sideline; wedge opens downfield (-y).

    Returns:
        List of (x, y) tuples, ordered from tip to base and
        left-to-right within each rank.

    Raises:
        ValueError: If total_performers <= 0, step_interval <= 0,
                    or direction is not recognized.
    """
    if total_performers <= 0:
        raise ValueError("total_performers must be positive")
    if step_interval <= 0:
        raise ValueError("step_interval must be positive")
    if direction not in ("pointing_forward", "pointing_backward"):
        raise ValueError(
            f"Unknown direction '{direction}'; "
            "use 'pointing_forward' or 'pointing_backward'"
        )

    # +1 = ranks extend upfield (+y), -1 = ranks extend downfield (-y)
    y_sign = 1.0 if direction == "pointing_forward" else -1.0

    positions: List[Tuple[float, float]] = []
    remaining = total_performers
    rank = 0

    while remaining > 0:
        # Full rank r has 2r + 1 dots.
        # If we don't have enough left, this rank is partial.
        dots_in_rank = min(2 * rank + 1, remaining)

        # Step away from vertex: rank 0 is at the tip
        y = vertex_y + y_sign * rank * step_interval

        # Center dots in this rank symmetrically around x=0
        for c in range(dots_in_rank):
            x = vertex_x + (c - (dots_in_rank - 1) / 2) * step_interval
            positions.append((x, y))

        remaining -= dots_in_rank
        rank += 1

    return positions
