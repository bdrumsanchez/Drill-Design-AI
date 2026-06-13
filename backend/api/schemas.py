from pydantic import BaseModel


class DrillRequest(BaseModel):
    form_type: str
    count: int
    params: dict = {}


class Dot(BaseModel):
    x: float
    y: float


class DrillResponse(BaseModel):
    dots: list[Dot]
