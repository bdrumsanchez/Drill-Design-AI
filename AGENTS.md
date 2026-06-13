# AGENTS.md

## Project goal

Build a full-stack web app that generates marching band drill forms using mathematical formulas. Python backend computes coordinates; frontend renders the field and lets users tweak parameters.

## Key conventions

- Python 3.11+, FastAPI for backend, Svelte frontend built with Vite
- Backend is purely stateless math — no database needed initially
- All coordinate math lives under `backend/math/`; API layer under `backend/api/`
- Coordinate system: 0,0 is center of field; +x is sideline-to-sideline, +y is endzone-to-endzone
- Dot positions are computed from parametric equations, no AI or ML
- Field rendering uses SVG overlay on a scaled football field image

## Commands

| Action | Command |
|---|---|
| Run backend | `uvicorn backend.api.main:app --reload` (from `backend/`) |
| Run frontend | `npm run dev` (from `frontend/`) |
| Python tests | `pytest` (from `backend/`) |
| Python lint | `ruff check .` (from `backend/`) |
| Frontend tests | `npm run test` (from `frontend/`) |

## Build order (backend first)

1. `geometry.py` — math utilities + tests
2. `coordinate.py` — field coordinate transforms + tests
3. `forms.py` — parametric form generators (block, arc, line, scatter) + tests
4. `transitions.py` — interpolation between forms across steps + tests
5. `schemas.py` — Pydantic request/response models
6. `routers/drill.py` — POST /drill/generate endpoint
7. `main.py` — FastAPI app assembly
