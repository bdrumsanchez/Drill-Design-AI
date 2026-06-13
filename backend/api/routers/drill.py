from fastapi import APIRouter, HTTPException

from api.schemas import DrillRequest, DrillResponse, Dot
from calc.blocks import compute_block_offsets
from calc.circles import compute_circle_positions
from calc.wedges import compute_wedge_positions
from calc.curves import compute_path_positions
from calc.spirals import compute_spiral_positions

router = APIRouter(prefix="/drill", tags=["drill"])


@router.post("/generate", response_model=DrillResponse)
async def generate_drill(req: DrillRequest):
    params = req.params

    try:
        if req.form_type == "block":
            rows = params.get("rows", 2)
            step = params.get("step", params.get("step_interval", 2.0))
            cx = params.get("cx", params.get("center_x", 0.0))
            cy = params.get("cy", params.get("center_y", 0.0))
            offsets = compute_block_offsets(req.count, rows, step)
            dots = [(x + cx, y + cy) for x, y in offsets]
        elif req.form_type == "circle":
            radius = params.get("radius", 20.0)
            cx = params.get("cx", params.get("center_x", 0.0))
            cy = params.get("cy", params.get("center_y", 0.0))
            dots = compute_circle_positions(req.count, radius, cx, cy)
        elif req.form_type == "wedge":
            step = params.get("step", params.get("step_interval", 2.0))
            direction = params.get("direction", "pointing_forward")
            vx = params.get("vx", 0.0)
            vy = params.get("vy", 0.0)
            dots = compute_wedge_positions(req.count, vx, vy, step, direction)
        elif req.form_type == "spiral":
            max_radius = params.get("max_radius", 16.0)
            turns = params.get("turns", 2.5)
            cx = params.get("cx", params.get("center_x", 0.0))
            cy = params.get("cy", params.get("center_y", 0.0))
            dots = compute_spiral_positions(req.count, max_radius, turns, cx, cy)
        elif req.form_type == "curve" or req.form_type == "path":
            raw = params.get("control_points", [])
            points = [(p["x"], p["y"]) for p in raw]
            closed = params.get("closed", False)
            dots = compute_path_positions(points, req.count, closed)
        else:
            raise HTTPException(
                status_code=400, detail=f"Unknown form_type: {req.form_type}"
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return DrillResponse(dots=[Dot(x=x, y=y) for x, y in dots])
