import json
import os
from typing import Optional

import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.routers.drill import generate_drill
from api.schemas import DrillRequest

router = APIRouter(prefix="/drill", tags=["ai"])


def _client() -> anthropic.Anthropic:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY is not set on the server")
    return anthropic.Anthropic(api_key=key)


SYSTEM_PROMPT = """You are a marching band drill designer assistant.

You will receive a user instruction. You may also receive the CURRENT formation parameters (if one already exists on the field).

If current parameters are provided and the instruction sounds like an adjustment ("move it", "shift it", "change the radius", "add more", "rotate", "make it bigger", etc.) — modify the current parameters accordingly and return the updated result.

If no current parameters are provided, or the instruction describes a brand-new formation, create fresh parameters.

Always return ONLY valid JSON (no markdown, no explanation) with this exact shape:

{
  "form_type": "<block|circle|wedge|curve|spiral>",
  "count": <integer number of performers>,
  "params": {
    // for block: "rows" (int), "step" (float, default 2), "cx" (float, default 0), "cy" (float, default 0)
    // for circle: "radius" (float), "cx" (float, default 0), "cy" (float, default 0)
    // for wedge: "step" (float, default 2), "vx" (float, default 0), "vy" (float, default 0), "direction" ("pointing_forward"|"pointing_backward", default "pointing_forward")
    // for curve/path: "points" ([{x,y}...], at least 2), "closed" (bool, default false)
    // for spiral: "max_radius" (float, outermost radius in steps), "turns" (float, default 2.5), "cx" (float, default 0), "cy" (float, default 0)
  }
}

FIELD COORDINATE SYSTEM:
- Origin (0, 0) = center of the field (50-yard line, midpoint between front and back sideline)
- +x = toward side 2 (right when facing the press box)
- +y = upfield (toward the back sideline)
- -y = downfield (toward the front sideline)
- Units are steps. 1 step = 22.5 inches. 8 steps = 5 yards.

KEY LANDMARKS (steps from center):
- Front sideline: y = -42
- Front hash: y = -10
- Back hash: y = +10
- Back sideline: y = +42
- 50-yard line: x = 0
- 40-yard line side 1 (left): x = -16
- 40-yard line side 2 (right): x = +16
- 30-yard line side 1: x = -32
- 30-yard line side 2: x = +32
- Each 5-yard increment = 8 steps

SPIRAL SIZING:
- max_radius is the radius (in steps) to the outermost performer.
- "span from 40-yard line to 40-yard line" = total width 32 steps → max_radius = 16
- "span from 30-yard line to 30-yard line" = total width 64 steps → max_radius = 32
- turns controls how tightly wound: 2.0 = loose, 3.0 = tight. Default 2.5.

DIRECTION LANGUAGE:
- "behind" = upfield = higher y
- "in front of" = downfield = lower y
- "4 steps behind the front sideline" → y = -42 + 4 = -38
- "on the front hash" → y = -10
- "move upfield 4 steps" → add 4 to cy/vy
- "move right 6 steps" → add 6 to cx/vx

BLOCK CENTERING:
cy is the CENTER of the block. For R rows with step S, front edge = cy - (R-1)*S/2.
If user says "front edge 4 steps behind front sideline": cy = -38 + (R-1)*S/2.

If count is not specified and adjusting, keep the current count.
If rows are not specified for a block, use 2.
If yards are mentioned, convert: 1 yard ≈ 1.6 steps."""


class CurrentParams(BaseModel):
    form_type: str
    count: int
    params: dict


class AIRequest(BaseModel):
    prompt: str
    current_params: Optional[CurrentParams] = None


@router.post("/ai-generate")
async def ai_generate(req: AIRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="prompt cannot be empty")

    user_content = req.prompt
    if req.current_params:
        user_content = (
            f"CURRENT FORMATION:\n{json.dumps(req.current_params.model_dump(), indent=2)}\n\n"
            f"INSTRUCTION: {req.prompt}"
        )

    message = _client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    text_block = next((b for b in message.content if b.type == "text"), None)
    if not text_block:
        raise HTTPException(status_code=502, detail="Claude returned no text content")
    raw = text_block.text.strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail=f"Claude returned non-JSON: {raw[:200]}",
        )

    drill_req = DrillRequest(
        form_type=parsed.get("form_type", "block"),
        count=int(parsed.get("count", 16)),
        params=parsed.get("params", {}),
    )

    result = await generate_drill(drill_req)

    # Return dots plus the parsed params so the frontend can send them back next time
    return {
        "dots": result.dots,
        "current_params": {
            "form_type": drill_req.form_type,
            "count": drill_req.count,
            "params": drill_req.params,
        },
    }
