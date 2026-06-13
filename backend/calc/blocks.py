"""
Block formation math for marching band drill design.

A block is a rectangular grid of performers centered on the field.
Spacing between adjacent performers is controlled by step_interval.
"""

import math
from typing import List, Tuple


def compute_block_offsets(
    total_performers: int,
    rows: int,
    step_interval: float,
) -> List[Tuple[float, float]]:
    """
    Compute (x, y) coordinate offsets for a block formation centered at (0, 0).

    Standard marching band block logic:
    - Performers are arranged in a rectangular grid of `rows` ranks.
    - Columns per row = ceil(total_performers / rows).
    - Fill row-by-row (front to back, left to right within each row).
    - Grid is centered on (0, 0) so the block is symmetric.
    - If total_performers doesn't divide evenly, the last (top) row
      has fewer performers and is independently re-centered.

    Coordinate system (per project convention):
        0, 0 = center of field
        +x    = sideline to sideline (right)
        +y    = endzone to endzone   (upfield / toward back sideline)

    Args:
        total_performers: Total number of performers to place.
        rows: Number of rows (ranks) in the block.
        step_interval: Center-to-center spacing between adjacent
                       performers, in field coordinate units.
                       (Standard marching band: 8 steps = 5 yards,
                        so 1 step = 0.625 yards.)

    Returns:
        List of (x, y) tuples, one per performer, ordered from
        front-left to back-right. The entire block is centered at (0, 0).

    Raises:
        ValueError: If total_performers <= 0, rows <= 0,
                    rows > total_performers, or step_interval <= 0.
    """
    if total_performers <= 0:
        raise ValueError("total_performers must be positive")
    if rows <= 0:
        raise ValueError("rows must be positive")
    if rows > total_performers:
        raise ValueError("rows cannot exceed total_performers")
    if step_interval <= 0:
        raise ValueError("step_interval must be positive")

    # Full columns in a complete row, then figure out the remainder
    cols = math.ceil(total_performers / rows)
    remainder = total_performers % rows

    offsets: List[Tuple[float, float]] = []

    for r in range(rows):
        # Rows above the remainder get one fewer column
        if r < remainder:
            this_row_cols = cols
        else:
            # When remainder is 0, every row has `cols` columns
            this_row_cols = cols - 1 if remainder > 0 else cols

        # Y offset: front ranks are negative y (closer to front sideline),
        # back ranks are positive y (deeper into the field).
        # Subtract the vertical center so ranks are symmetric about y=0.
        y = (r - (rows - 1) / 2) * step_interval

        # X offsets for each dot in this row.
        # Subtract the horizontal center so the row is symmetric about x=0.
        for c in range(this_row_cols):
            x = (c - (this_row_cols - 1) / 2) * step_interval
            offsets.append((x, y))

    return offsets
