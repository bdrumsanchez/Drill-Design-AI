from typing import Any, List, Tuple

from calc.blocks import compute_block_offsets
from calc.circles import compute_circle_positions
from calc.wedges import compute_wedge_positions
from calc.curves import compute_path_positions


def generate_form(
    form_type: str,
    count: int,
    **params: Any,
) -> List[Tuple[float, float]]:
    if form_type == "block":
        return compute_block_offsets(
            count,
            rows=params.get("rows", 6),
            step_interval=params.get("step_interval", 4.0),
        )
    elif form_type == "circle":
        return compute_circle_positions(
            count,
            radius_in_steps=params.get("radius", 20.0),
            center_x=params.get("center_x", 0.0),
            center_y=params.get("center_y", 0.0),
        )
    elif form_type == "wedge":
        return compute_wedge_positions(
            count,
            step_interval=params.get("step_interval", 4.0),
            direction=params.get("direction", "pointing_forward"),
        )
    elif form_type in ("curve", "path"):
        control_points: List[Tuple[float, float]] = params.get("control_points", [])
        if not control_points:
            raise ValueError("control_points required for curve/path forms")
        return compute_path_positions(
            control_points,
            count,
            closed=params.get("closed", False),
        )
    else:
        raise ValueError(f"Unknown form_type: {form_type}")
