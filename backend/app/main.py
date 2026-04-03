from io import StringIO

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .analyzer import analyze_followers
from .schemas import InfluencerAuditResult

app = FastAPI(title="Influencer Credibility Auditor", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.post("/analyze", response_model=list[InfluencerAuditResult])
async def analyze(file: UploadFile = File(...)) -> list[dict]:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")

    try:
        content = await file.read()
        csv_buffer = StringIO(content.decode("utf-8"))
        df = pd.read_csv(csv_buffer, low_memory=False)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {exc}") from exc

    try:
        return analyze_followers(df)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
