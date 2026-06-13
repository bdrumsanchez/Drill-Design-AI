from typing import Callable, List, Tuple

from calc.geometry import lerp_point


def linear_transition(
    start_positions: List[Tuple[float, float]],
    end_positions: List[Tuple[float, float]],
    num_steps: int,
) -> List[List[Tuple[float, float]]]:
    if len(start_positions) != len(end_positions):
        raise ValueError("start and end positions must have the same count")
    if num_steps < 2:
        raise ValueError("num_steps must be at least 2")

    steps: List[List[Tuple[float, float]]] = []
    for i in range(num_steps):
        t = i / (num_steps - 1)
        step_positions = [
            lerp_point(sp, ep, t)
            for sp, ep in zip(start_positions, end_positions)
        ]
        steps.append(step_positions)

    return steps


def ease_in_out_cubic(t: float) -> float:
    if t < 0.5:
        return 4 * t * t * t
    else:
        return 1 - ((-2 * t + 2) ** 3) / 2


def eased_transition(
    start_positions: List[Tuple[float, float]],
    end_positions: List[Tuple[float, float]],
    num_steps: int,
    easing_fn: Callable[[float], float] = ease_in_out_cubic,
) -> List[List[Tuple[float, float]]]:
    if len(start_positions) != len(end_positions):
        raise ValueError("start and end positions must have the same count")
    if num_steps < 2:
        raise ValueError("num_steps must be at least 2")

    steps: List[List[Tuple[float, float]]] = []
    for i in range(num_steps):
        t = i / (num_steps - 1)
        eased_t = easing_fn(t)
        step_positions = [
            lerp_point(sp, ep, eased_t)
            for sp, ep in zip(start_positions, end_positions)
        ]
        steps.append(step_positions)

    return steps
