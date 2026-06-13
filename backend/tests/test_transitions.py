import math
import pytest
from calc.transitions import (
    linear_transition,
    eased_transition,
    ease_in_out_cubic,
)


def test_linear_transition_two_steps():
    start = [(0.0, 0.0), (10.0, 10.0)]
    end = [(10.0, 0.0), (0.0, 10.0)]
    result = linear_transition(start, end, 2)
    assert len(result) == 2
    assert result[0] == start
    assert result[1] == end


def test_linear_transition_three_steps():
    start = [(0.0, 0.0)]
    end = [(10.0, 10.0)]
    result = linear_transition(start, end, 3)
    assert len(result) == 3
    assert result[0] == [(0.0, 0.0)]
    assert result[1] == [(5.0, 5.0)]
    assert result[2] == [(10.0, 10.0)]


def test_linear_transition_multi_dot():
    start = [(0.0, 0.0), (20.0, 0.0), (0.0, 20.0)]
    end = [(10.0, 10.0), (10.0, 20.0), (30.0, 0.0)]
    result = linear_transition(start, end, 5)
    assert len(result) == 5
    for step in result:
        assert len(step) == 3
    assert result[0] == start
    assert result[-1] == end


def test_linear_transition_exact_midpoint():
    start = [(0.0, 0.0)]
    end = [(100.0, 0.0)]
    result = linear_transition(start, end, 3)
    assert result[1] == [(50.0, 0.0)]


def test_linear_transition_mismatched_counts():
    with pytest.raises(ValueError, match="same count"):
        linear_transition([(0.0, 0.0)], [(1.0, 1.0), (2.0, 2.0)], 3)


def test_linear_transition_too_few_steps():
    with pytest.raises(ValueError, match="at least 2"):
        linear_transition([(0.0, 0.0)], [(10.0, 10.0)], 1)


def test_ease_in_out_cubic():
    assert ease_in_out_cubic(0.0) == 0.0
    assert ease_in_out_cubic(1.0) == 1.0
    assert ease_in_out_cubic(0.5) == 0.5
    eased = ease_in_out_cubic(0.25)
    assert 0.0 < eased < 0.25
    eased = ease_in_out_cubic(0.75)
    assert 0.75 < eased < 1.0


def test_eased_transition_basic():
    start = [(0.0, 0.0)]
    end = [(10.0, 0.0)]
    result = eased_transition(start, end, 3, easing_fn=ease_in_out_cubic)
    assert len(result) == 3
    assert result[0] == start
    assert result[-1] == end
    # With cubic ease-in-out at t=0.5, the eased value is also 0.5
    assert result[1][0][0] == pytest.approx(5.0)


def test_eased_transition_mismatched_counts():
    with pytest.raises(ValueError, match="same count"):
        eased_transition([(0.0, 0.0)], [(1.0, 1.0), (2.0, 2.0)], 3)


def test_eased_transition_too_few_steps():
    with pytest.raises(ValueError, match="at least 2"):
        eased_transition([(0.0, 0.0)], [(10.0, 10.0)], 1)


def test_eased_transition_custom_easing():
    start = [(0.0, 0.0)]
    end = [(10.0, 0.0)]
    result = eased_transition(start, end, 3, easing_fn=lambda t: t)
    assert result[1][0] == (5.0, 0.0)


def test_linear_transition_many_steps():
    n = 20
    start = [(0.0, 0.0)] * 5
    end = [(10.0, 10.0)] * 5
    result = linear_transition(start, end, n)
    assert len(result) == n
    distances = [math.hypot(step[0][0], step[0][1]) for step in result]
    # Distance should increase monotonically
    for i in range(1, len(distances)):
        assert distances[i] >= distances[i - 1] - 1e-10
