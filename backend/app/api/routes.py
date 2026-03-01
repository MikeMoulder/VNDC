from __future__ import annotations

import hashlib
import json

from fastapi import APIRouter, Depends, Request

from app.core.cache import verdict_cache, verdict_history
from app.core.rate_limit import enforce_rate_limit
from app.schemas import VerdictRequest, VerdictResponse
from app.services.verdict_pipeline import generate_verdict

router = APIRouter()


@router.post("/verdict", response_model=VerdictResponse)
async def verdict(request: Request, payload: VerdictRequest, _rl: None = Depends(enforce_rate_limit)) -> VerdictResponse:
    cache_data = payload.model_dump(mode="json", exclude={"wallet_address"})
    cache_key = hashlib.sha256(
        json.dumps(cache_data, sort_keys=True).encode("utf-8")
    ).hexdigest()

    cached = verdict_cache.get(cache_key)
    if cached:
        return VerdictResponse.model_validate(cached)

    response = await generate_verdict(payload)
    verdict_cache[cache_key] = response.model_dump(mode="json")
    verdict_history.appendleft(response.model_dump(mode="json"))
    return response


@router.get("/history", response_model=list[VerdictResponse])
async def history() -> list[VerdictResponse]:
    return [VerdictResponse.model_validate(item) for item in verdict_history]
