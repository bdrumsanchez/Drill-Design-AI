import math
from typing import List, Tuple

Point = Tuple[float, float]


def distance(p1: Point, p2: Point) -> float:
    return math.hypot(p2[0] - p1[0], p2[1] - p1[1])


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def lerp_point(p1: Point, p2: Point, t: float) -> Point:
    return (lerp(p1[0], p2[0], t), lerp(p1[1], p2[1], t))


def midpoint(p1: Point, p2: Point) -> Point:
    return ((p1[0] + p2[0]) / 2.0, (p1[1] + p2[1]) / 2.0)


def segment_length(p1: Point, p2: Point) -> float:
    return distance(p1, p2)


def path_length(points: List[Point], closed: bool = False) -> float:
    if len(points) < 2:
        return 0.0
    total = 0.0
    for i in range(len(points) - 1):
        total += distance(points[i], points[i + 1])
    if closed and len(points) > 2:
        total += distance(points[-1], points[0])
    return total


def angle(p1: Point, p2: Point) -> float:
    return math.atan2(p2[1] - p1[1], p2[0] - p1[0])


def normalize_angle(theta: float) -> float:
    return theta % (2.0 * math.pi)


def rotate_point(point: Point, center: Point, angle_rad: float) -> Point:
    dx = point[0] - center[0]
    dy = point[1] - center[1]
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)
    return (
        center[0] + dx * cos_a - dy * sin_a,
        center[1] + dx * sin_a + dy * cos_a,
    )


def closest_point_on_segment(p: Point, a: Point, b: Point) -> Point:
    ax, ay = a
    bx, by = b
    px, py = p
    abx = bx - ax
    aby = by - ay
    denom = abx * abx + aby * aby
    if denom == 0:
        return a
    t = ((px - ax) * abx + (py - ay) * aby) / denom
    t = max(0.0, min(1.0, t))
    return (ax + t * abx, ay + t * aby)


def point_segment_distance(p: Point, a: Point, b: Point) -> float:
    return distance(p, closest_point_on_segment(p, a, b))


def centroid(points: List[Point]) -> Point:
    if not points:
        return (0.0, 0.0)
    n = len(points)
    sx = sum(p[0] for p in points)
    sy = sum(p[1] for p in points)
    return (sx / n, sy / n)


def bounds(points: List[Point]) -> Tuple[float, float, float, float]:
    if not points:
        return (0.0, 0.0, 0.0, 0.0)
    min_x = min(p[0] for p in points)
    min_y = min(p[1] for p in points)
    max_x = max(p[0] for p in points)
    max_y = max(p[1] for p in points)
    return (min_x, min_y, max_x, max_y)


def point_at_distance(
    points: List[Point], target_distance: float, closed: bool = False
) -> Point:
    if not points:
        return (0.0, 0.0)
    if len(points) == 1:
        return points[0]
    if target_distance <= 0.0:
        return points[0]

    total_len = path_length(points, closed)
    if total_len == 0:
        return points[0]
    if target_distance >= total_len:
        return points[0] if closed else points[-1]

    accumulated = 0.0
    for i in range(len(points) - 1):
        seg_len = distance(points[i], points[i + 1])
        if seg_len == 0:
            continue
        if accumulated + seg_len >= target_distance:
            frac = (target_distance - accumulated) / seg_len
            return lerp_point(points[i], points[i + 1], frac)
        accumulated += seg_len

    if closed and len(points) > 2:
        seg_len = distance(points[-1], points[0])
        if seg_len > 0 and accumulated + seg_len >= target_distance:
            frac = (target_distance - accumulated) / seg_len
            return lerp_point(points[-1], points[0], frac)

    return points[-1]
