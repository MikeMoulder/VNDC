from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TimeHorizon = Literal["scalp", "swing", "long"]
RiskProfile = Literal["conservative", "balanced", "aggressive"]
LowMediumHigh = Literal["low", "medium", "high"]
LowMediumHighUnknown = Literal["low", "medium", "high", "unknown"]
VolumeTrend = Literal["up", "down", "flat", "unknown"]
Sentiment = Literal["bullish", "neutral", "bearish", "unknown"]
SettlementMode = Literal["SETTLE", "SETTLE_BATCH", "SETTLE_METADATA"]


class VerdictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str = Field(min_length=1, max_length=512)
    time_horizon: TimeHorizon
    risk_profile: RiskProfile
    wallet_address: str | None = None


class TokenLinks(BaseModel):
    model_config = ConfigDict(extra="forbid")

    website: str | None = None
    twitter: str | None = None
    dexscreener: str | None = None


class TokenInfo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    symbol: str
    chain: str
    address: str
    links: TokenLinks


class MarketSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    price_usd: float
    change_24h_pct: float
    volume_24h_usd: float
    liquidity_usd: float
    market_cap_usd: float
    fdv_usd: float


class VolatilityForecast(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: float
    unit: Literal["stdev_daily", "stdev_weekly", "unknown"]
    source: Literal["onchain_model", "llm_estimate", "unavailable"]
    tx_hash: str | None = None


class Signals(BaseModel):
    model_config = ConfigDict(extra="forbid")

    liquidity_risk: LowMediumHigh
    holder_concentration_risk: LowMediumHighUnknown
    volume_trend: VolumeTrend
    volatility_forecast: VolatilityForecast
    unlock_risk: LowMediumHighUnknown
    sentiment: Sentiment


class ActionPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    entry_zone: str
    invalidation: str
    take_profit_targets: list[str]
    position_sizing_note: str


class Verdict(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rating: Literal["BUY", "WATCH", "AVOID"]
    confidence_pct: int = Field(ge=0, le=100)
    risk_score_0_100: int = Field(ge=0, le=100)
    time_horizon: TimeHorizon
    action_plan: ActionPlan
    key_reasons: list[str]
    red_flags: list[str]


class OpenGradientProof(BaseModel):
    model_config = ConfigDict(extra="forbid")

    settlement_mode: SettlementMode
    receipt_id: str
    model: str
    timestamp: datetime


class ToolCallProof(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tool_name: str
    chain: str
    tx_hash: str


class ProofBundle(BaseModel):
    model_config = ConfigDict(extra="forbid")

    opengradient: OpenGradientProof
    tool_calls: list[ToolCallProof]


class VerdictResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: TokenInfo
    market_snapshot: MarketSnapshot
    signals: Signals
    verdict: Verdict
    proof: ProofBundle
    disclaimer: str
