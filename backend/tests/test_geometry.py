import math
import pytest
from calc.geometry import (
    distance,
    lerp,
    lerp_point,
    midpoint,
    segment_length,
    path_length,
    angle,
    normalize_angle,
    rotate_point,
    closest_point_on_segment,
    point_segment_distance,
    centroid,
    bounds,
    point_at_distance,
)


def test_distance():
    assert distance((0, 0), (3, 4)) == 5.0
    assert distance((1, 1), (1, 1)) == 0.0
    assert distance((-1, -1), (1, 1)) == math.sqrt(8)


def test_lerp():
    assert lerp(0, 10, 0) == 0
    assert lerp(0, 10, 1) == 10
    assert lerp(0, 10, 0.5) == 5
    assert lerp(10, 0, 0.25) == 7.5


def test_lerp_point():
    assert lerp_point((0, 0), (10, 20), 0) == (0, 0)
    assert lerp_point((0, 0), (10, 20), 1) == (10, 20)
    result = lerp_point((0, 0), (10, 20), 0.5)
    assert result == (5, 10)


def test_midpoint():
    assert midpoint((0, 0), (10, 10)) == (5, 5)
    assert midpoint((-5, -5), (5, 5)) == (0, 0)
    assert midpoint((3, 7), (3, 7)) == (3, 7)


def test_segment_length():
    assert segment_length((0, 0), (3, 4)) == 5.0
    assert segment_length((0, 0), (0, 0)) == 0.0


def test_path_length_open():
    pts = [(0, 0), (3, 0), (3, 4)]
    assert path_length(pts) == 3 + 4  # 7


def test_path_length_closed():
    pts = [(0, 0), (3, 0), (3, 4)]
    assert path_length(pts, closed=True) == 3 + 4 + 5  # 12


def test_path_length_single_point():
    assert path_length([(1, 2)]) == 0.0
    assert path_length([]) == 0.0


def test_path_length_two_points_closed():
    # Two-point path with closed=True: closing segment requires 3+ points
    pts = [(0, 0), (3, 4)]
    assert path_length(pts, closed=True) == 5.0


def test_angle():
    # Right
    assert angle((0, 0), (1, 0)) == 0.0
    # Up
    assert angle((0, 0), (0, 1)) == pytest.approx(math.pi / 2)
    # Left
    assert angle((0, 0), (-1, 0)) == pytest.approx(math.pi)
    # Down
    assert angle((0, 0), (0, -1)) == pytest.approx(-math.pi / 2)
    # 45 degrees
    forty_five = math.pi / 4
    assert angle((0, 0), (1, 1)) == pytest.approx(forty_five)


def test_normalize_angle():
    assert normalize_angle(0) == 0.0
    assert normalize_angle(2 * math.pi) == 0.0
    assert normalize_angle(3 * math.pi) == pytest.approx(math.pi)
    assert normalize_angle(-math.pi / 2) == pytest.approx(3 * math.pi / 2)


def test_rotate_point():
    center = (0, 0)
    # Rotate (1,0) 90 degrees CCW -> (0,1)
    result = rotate_point((1, 0), center, math.pi / 2)
    assert abs(result[0]) < 1e-10
    assert abs(result[1] - 1) < 1e-10

    # Rotate 360 degrees -> back to start
    result = rotate_point((1, 0), center, 2 * math.pi)
    assert abs(result[0] - 1) < 1e-10
    assert abs(result[1]) < 1e-10


def test_rotate_point_about_non_origin():
    center = (5, 5)
    result = rotate_point((5, 10), center, math.pi)
    assert abs(result[0] - 5) < 1e-10
    assert abs(result[1] - 0) < 1e-10


def test_closest_point_on_segment():
    # Point directly above middle of horizontal segment
    result = closest_point_on_segment((5, 5), (0, 0), (10, 0))
    assert result == (5, 0)

    # Point beyond endpoint -> clamped to endpoint
    result = closest_point_on_segment((20, 0), (0, 0), (10, 0))
    assert result == (10, 0)

    # Point before start -> clamped to start
    result = closest_point_on_segment((-5, 0), (0, 0), (10, 0))
    assert result == (0, 0)

    # Degenerate segment (zero length)
    result = closest_point_on_segment((5, 5), (3, 3), (3, 3))
    assert result == (3, 3)


def test_point_segment_distance():
    # Point at middle of horizontal segment
    d = point_segment_distance((5, 3), (0, 0), (10, 0))
    assert d == 3.0

    # Point on the segment
    d = point_segment_distance((5, 0), (0, 0), (10, 0))
    assert d == 0.0

    # Point past endpoint
    d = point_segment_distance((15, 0), (0, 0), (10, 0))
    assert d == 5.0


def test_centroid():
    assert centroid([(0, 0), (10, 0), (0, 10), (10, 10)]) == (5, 5)
    assert centroid([(1, 2)]) == (1, 2)
    assert centroid([]) == (0, 0)


def test_bounds():
    pts = [(-5, 10), (0, -3), (20, 7)]
    assert bounds(pts) == (-5, -3, 20, 10)
    assert bounds([]) == (0, 0, 0, 0)
    assert bounds([(3, 4)]) == (3, 4, 3, 4)


def test_point_at_distance_start():
    pts = [(0, 0), (10, 0), (10, 10)]
    assert point_at_distance(pts, 0) == (0, 0)


def test_point_at_distance_end():
    pts = [(0, 0), (10, 0), (10, 10)]
    result = point_at_distance(pts, 20)
    assert result == (10, 10)


def test_point_at_distance_midpoint():
    pts = [(0, 0), (10, 0)]
    result = point_at_distance(pts, 5)
    assert result == (5, 0)


def test_point_at_distance_beyond_clamped():
    pts = [(0, 0), (10, 0)]
    result = point_at_distance(pts, 100)
    assert result == (10, 0)


def test_point_at_distance_negative():
    pts = [(5, 5), (10, 10)]
    result = point_at_distance(pts, -1)
    assert result == (5, 5)


def test_point_at_distance_on_closed_loop():
    # Square: halfway around closed loop = two edges in, at opposite corner
    pts = [(0, 0), (10, 0), (10, 10), (0, 10)]
    perimeter = 40.0
    result = point_at_distance(pts, perimeter / 2, closed=True)
    assert abs(result[0] - 10) < 1e-10
    assert abs(result[1] - 10) < 1e-10


def test_point_at_distance_empty():
    assert point_at_distance([], 5) == (0, 0)


def test_point_at_distance_single():
    assert point_at_distance([(3, 7)], 5) == (3, 7)


def test_point_at_distance_zero_length_segment():
    # A zero-length segment at the start should be skipped.
    # Path: (2,2) -> (2,2) [len=0, skipped] -> (5,5) [len=sqrt(18)~4.243]
    # At t=1, we should be 1 unit along the second segment.
    pts = [(2, 2), (2, 2), (5, 5)]
    result = point_at_distance(pts, 1)
    expected_x = 2 + 1.0 / math.sqrt(18) * 3
    expected_y = 2 + 1.0 / math.sqrt(18) * 3
    assert abs(result[0] - expected_x) < 1e-10
    assert abs(result[1] - expected_y) < 1e-10


def test_point_at_distance_closed_starting_at_origin():
    pts = [(0, 0), (10, 0), (5, 8.6603)]
    circ = path_length(pts, closed=True)
    result = point_at_distance(pts, circ, closed=True)
    assert abs(result[0]) < 1e-10
    assert abs(result[1]) < 1e-10
