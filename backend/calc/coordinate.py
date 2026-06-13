from typing import List, Tuple

PX_PER_STEP = 8.0
SVG_CENTER_X = 640.0
SVG_CENTER_Y = 336.0
FIELD_X_HALF = 80.0
FIELD_Y_HALF = 42.0


def field_to_pixel(fx: float, fy: float) -> Tuple[float, float]:
    return (SVG_CENTER_X + fx * PX_PER_STEP, SVG_CENTER_Y - fy * PX_PER_STEP)


def pixel_to_field(px: float, py: float) -> Tuple[float, float]:
    return ((px - SVG_CENTER_X) / PX_PER_STEP, (SVG_CENTER_Y - py) / PX_PER_STEP)


def field_bounds() -> Tuple[float, float, float, float]:
    return (-FIELD_X_HALF, -FIELD_Y_HALF, FIELD_X_HALF, FIELD_Y_HALF)


def validate_bounds(
    dots: List[Tuple[float, float]],
    margin: float = 0.0,
) -> None:
    min_x, min_y, max_x, max_y = field_bounds()
    min_x -= margin
    min_y -= margin
    max_x += margin
    max_y += margin
    for i, (x, y) in enumerate(dots):
        if not (min_x <= x <= max_x and min_y <= y <= max_y):
            raise ValueError(
                f"Dot {i} at ({x:.2f}, {y:.2f}) is outside field bounds "
                f"[{min_x:.1f}, {max_x:.1f}] x [{min_y:.1f}, {max_y:.1f}]"
            )


def steps_to_yards(steps: float) -> float:
    return steps * 5 / 8


def yards_to_steps(yards: float) -> float:
    return yards * 8 / 5
