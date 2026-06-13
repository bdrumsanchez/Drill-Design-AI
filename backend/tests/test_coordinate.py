import pytest
from calc.coordinate import (
    field_to_pixel,
    pixel_to_field,
    field_bounds,
    validate_bounds,
    steps_to_yards,
    yards_to_steps,
)


def test_field_to_pixel_center():
    assert field_to_pixel(0, 0) == (640.0, 336.0)


def test_field_to_pixel_positive_x():
    result = field_to_pixel(10, 0)
    assert result == (720.0, 336.0)


def test_field_to_pixel_negative_x():
    result = field_to_pixel(-10, 0)
    assert result == (560.0, 336.0)


def test_field_to_pixel_positive_y():
    # +y on field = upfield = lower SVG y
    result = field_to_pixel(0, 10)
    assert result == (640.0, 256.0)


def test_field_to_pixel_negative_y():
    # -y on field = downfield = higher SVG y
    result = field_to_pixel(0, -10)
    assert result == (640.0, 416.0)


def test_field_to_pixel_both():
    result = field_to_pixel(20, -15)
    assert result == (800.0, 456.0)


def test_pixel_to_field_center():
    assert pixel_to_field(640, 336) == (0.0, 0.0)


def test_pixel_to_field_right():
    result = pixel_to_field(720, 336)
    assert result == (10.0, 0.0)


def test_pixel_to_field_left():
    result = pixel_to_field(560, 336)
    assert result == (-10.0, 0.0)


def test_pixel_to_field_upfield():
    result = pixel_to_field(640, 256)
    assert result == (0.0, 10.0)


def test_pixel_to_field_downfield():
    result = pixel_to_field(640, 416)
    assert result == (0.0, -10.0)


def test_field_to_pixel_roundtrip():
    original = (37.5, -12.25)
    px, py = field_to_pixel(*original)
    roundtripped = pixel_to_field(px, py)
    assert abs(roundtripped[0] - original[0]) < 1e-10
    assert abs(roundtripped[1] - original[1]) < 1e-10


def test_pixel_to_field_roundtrip():
    original = (123.0, 456.0)
    fx, fy = pixel_to_field(*original)
    roundtripped = field_to_pixel(fx, fy)
    assert abs(roundtripped[0] - original[0]) < 1e-10
    assert abs(roundtripped[1] - original[1]) < 1e-10


def test_field_bounds():
    min_x, min_y, max_x, max_y = field_bounds()
    assert min_x == -80.0
    assert max_x == 80.0
    assert min_y == -42.0
    assert max_y == 42.0


def test_validate_bounds_good_dots():
    dots = [(0, 0), (40, 20), (-30, -15)]
    validate_bounds(dots)


def test_validate_bounds_on_edge():
    dots = [(80, 42)]
    validate_bounds(dots)


def test_validate_bounds_outside_x():
    dots = [(81, 0)]
    with pytest.raises(ValueError, match="outside field bounds"):
        validate_bounds(dots)


def test_validate_bounds_outside_y():
    dots = [(0, 43)]
    with pytest.raises(ValueError, match="outside field bounds"):
        validate_bounds(dots)


def test_validate_bounds_negative_x():
    dots = [(-81, 0)]
    with pytest.raises(ValueError, match="outside field bounds"):
        validate_bounds(dots)


def test_validate_bounds_negative_y():
    dots = [(0, -43)]
    with pytest.raises(ValueError, match="outside field bounds"):
        validate_bounds(dots)


def test_validate_bounds_with_margin():
    dots = [(85, 0)]
    with pytest.raises(ValueError, match="outside field bounds"):
        validate_bounds(dots)
    validate_bounds(dots, margin=5.0)


def test_validate_bounds_empty():
    validate_bounds([])


def test_steps_to_yards():
    assert steps_to_yards(8) == pytest.approx(5.0)
    assert steps_to_yards(0) == 0.0
    assert steps_to_yards(16) == 10.0


def test_yards_to_steps():
    assert yards_to_steps(5) == 8.0
    assert yards_to_steps(0) == 0.0
    assert yards_to_steps(10) == 16.0


def test_steps_yards_roundtrip():
    for s in [1, 2.5, 8, 20, 100]:
        assert yards_to_steps(steps_to_yards(s)) == pytest.approx(s)
