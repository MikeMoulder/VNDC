from __future__ import annotations

from app.core.config import settings
from app.schemas import (
    MarketSnapshot,
    OpenGradientProof,
    ProofBundle,
    Signals,
    TokenInfo,
    TokenLinks,
    ToolCallProof,
    Verdict,
    VerdictRequest,
    VerdictResponse,
)
from app.services.market_data import fetch_market_bundle
from app.services.opengradient_client import OpenGradientClient
from app.services.token_resolver import resolve_token


def _build_price_series(price_usd: float, change_24h_pct: float) -> list[float]:
    safe_price = max(float(price_usd or 0.0), 0.000001)
    drift = float(change_24h_pct or 0.0) / 100.0
    weights = [-0.60, -0.45, -0.30, -0.15, -0.05, 0.05, 0.12, 0.20]

    series = [safe_price * (1.0 + drift * weight) for weight in weights]
    return [max(point, 0.000001) for point in series]


async def generate_verdict(request: VerdictRequest) -> VerdictResponse:
    token = await resolve_token(request.query)
    market, derived = await fetch_market_bundle(token)

    market_snapshot_dict = {
        "price_usd": market.price_usd,
        "change_24h_pct": market.change_24h_pct,
        "volume_24h_usd": market.volume_24h_usd,
        "liquidity_usd": market.liquidity_usd,
        "market_cap_usd": market.market_cap_usd,
        "fdv_usd": market.fdv_usd,
    }

    token_dict = {
        "name": token.name,
        "symbol": token.symbol,
        "chain": token.chain,
        "address": token.address,
        "links": {
            "website": token.website,
            "twitter": token.twitter,
            "dexscreener": token.dexscreener,
        },
    }

    opg = OpenGradientClient()
    llm_result = opg.analyze(
        token_data=token_dict,
        market_snapshot=market_snapshot_dict,
        derived_metrics={
            **derived,
            "holder_concentration_risk": market.holder_concentration_risk,
            "transfer_count": market.transfer_count,
            "unlock_risk": market.unlock_risk,
            "sentiment": market.sentiment,
        },
        time_horizon=request.time_horizon,
        risk_profile=request.risk_profile,
    )

    tool_vol = opg.run_optional_volatility_tool(
        enabled=settings.opengradient_enable_volatility_tool,
        price_series=_build_price_series(
            price_usd=market.price_usd,
            change_24h_pct=market.change_24h_pct,
        ),
    )

    payload = llm_result.payload
    llm_signals = payload.get("signals", {})
    llm_verdict = payload.get("verdict", {})

    raw_volatility = llm_signals.get("volatility_forecast") or {}
    normalized_volatility = {
        "value": float(raw_volatility.get("value") or 0.0),
        "unit": raw_volatility.get("unit") or "unknown",
        "source": raw_volatility.get("source") or "unavailable",
        "tx_hash": raw_volatility.get("tx_hash"),
    }

    merged_signals = {
        "liquidity_risk": llm_signals.get("liquidity_risk", derived["liquidity_risk"]),
        "holder_concentration_risk": llm_signals.get("holder_concentration_risk", market.holder_concentration_risk),
        "volume_trend": llm_signals.get("volume_trend", derived["volume_trend"]),
        "volatility_forecast": normalized_volatility,
        "unlock_risk": llm_signals.get("unlock_risk", market.unlock_risk),
        "sentiment": llm_signals.get("sentiment", market.sentiment),
    }

    if llm_signals.get("volatility_forecast") is None:
        merged_signals["volatility_forecast"] = {
            "value": tool_vol.value,
            "unit": tool_vol.unit,
            "source": tool_vol.source,
            "tx_hash": tool_vol.tx_hash,
        }

    if tool_vol.tx_hash and merged_signals["volatility_forecast"].get("tx_hash") is None:
        merged_signals["volatility_forecast"]["tx_hash"] = tool_vol.tx_hash
    if tool_vol.source == "onchain_model":
        merged_signals["volatility_forecast"]["source"] = "onchain_model"
        merged_signals["volatility_forecast"]["unit"] = tool_vol.unit
        merged_signals["volatility_forecast"]["value"] = tool_vol.value

    response = VerdictResponse(
        token=TokenInfo(
            name=token.name,
            symbol=token.symbol,
            chain=token.chain,
            address=token.address,
            links=TokenLinks(
                website=token.website,
                twitter=token.twitter,
                dexscreener=token.dexscreener,
            ),
        ),
        market_snapshot=MarketSnapshot(**market_snapshot_dict),
        signals=Signals(**merged_signals),
        verdict=Verdict(**llm_verdict),
        proof=ProofBundle(
            opengradient=OpenGradientProof(
                settlement_mode=llm_result.settlement_mode,
                receipt_id=llm_result.receipt_id,
                model=llm_result.model,
                timestamp=llm_result.timestamp,
            ),
            tool_calls=(
                [
                    ToolCallProof(
                        tool_name="volatility_model",
                        chain=tool_vol.chain,
                        tx_hash=tool_vol.tx_hash,
                    )
                ]
                if tool_vol.tx_hash
                else []
            ),
        ),
        disclaimer="Informational only. Not financial advice.",
    )

    return response
