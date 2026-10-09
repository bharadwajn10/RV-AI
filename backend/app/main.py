from fastapi import FastAPI, Depends, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import get_settings
from app.api.v1 import auth, learner, educator
import app.personalization.features  # Trigger registry
import uvicorn

settings = get_settings()

app = FastAPI(title="studyspace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(learner.router, prefix="/api/v1/learner", tags=["learner"])
app.include_router(educator.router, prefix="/api/v1/educator", tags=["educator"])

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
