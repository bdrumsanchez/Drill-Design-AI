import math
import pytest
from calc.forms import generate_form


def test_generate_block():
    dots = generate_form("block", 24, rows=4, step_interval=4.0)
    assert len(dots) == 24
    for x, y in dots:
        assert isinstance(x, float)
        assert isinstance(y, float)


def test_generate_block_centered():
    dots = generate_form("block", 24, rows=4, step_interval=4.0)
    # Block should be roughly centered at (0,0)
    xs = [x for x, _ in dots]
    ys = [y for _, y in dots]
    assert min(xs) < 0 < max(xs)
    assert min(ys) < 0 < max(ys)


def test_generate_circle():
    dots = generate_form("circle", 16, radius=20.0)
    assert len(dots) == 16
    for x, y in dots:
        dist = math.hypot(x, y)
        assert abs(dist - 20.0) < 1e-10


def test_generate_circle_custom_center():
    dots = generate_form("circle", 8, radius=10.0, center_x=15.0, center_y=-10.0)
    assert len(dots) == 8
    for x, y in dots:
        dist = math.hypot(x - 15.0, y + 10.0)
        assert abs(dist - 10.0) < 1e-10


def test_generate_wedge():
    dots = generate_form("wedge", 16, step_interval=4.0)
    assert len(dots) == 16
    # Tip should be at (0,0)
    assert dots[0] == (0.0, 0.0)


def test_generate_wedge_backward():
    dots = generate_form("wedge", 9, step_interval=4.0, direction="pointing_backward")
    assert len(dots) == 9
    assert dots[0] == (0.0, 0.0)
    # Second rank should be at negative y (downfield)
    assert dots[1][1] < 0


def test_generate_curve():
    points = [(-40.0, -20.0), (0.0, 30.0), (40.0, -20.0)]
    dots = generate_form("curve", 10, control_points=points, closed=False)
    assert len(dots) == 10
    # First dot should be at first control point
    assert dots[0] == pytest.approx((-40.0, -20.0))
    # Last dot should be at last control point
    assert dots[-1] == pytest.approx((40.0, -20.0))


def test_generate_path_alias():
    points = [(0.0, 0.0), (10.0, 10.0)]
    dots = generate_form("path", 5, control_points=points, closed=False)
    assert len(dots) == 5
    assert dots[0] == pytest.approx((0.0, 0.0))
    assert dots[-1] == pytest.approx((10.0, 10.0))


def test_generate_curve_no_points():
    with pytest.raises(ValueError, match="control_points"):
        generate_form("curve", 5, control_points=[])


def test_generate_unknown_form():
    with pytest.raises(ValueError, match="Unknown form_type"):
        generate_form("triangle", 10)


def test_generate_block_default_params():
    dots = generate_form("block", 10)
    assert len(dots) == 10


def test_generate_circle_default_params():
    dots = generate_form("circle", 10)
    assert len(dots) == 10


def test_generate_wedge_default_params():
    dots = generate_form("wedge", 10)
    assert len(dots) == 10
