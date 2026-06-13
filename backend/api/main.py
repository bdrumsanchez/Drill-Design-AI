from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import ai, drill

app = FastAPI(title="Drill Design AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(drill.router)
app.include_router(ai.router)
