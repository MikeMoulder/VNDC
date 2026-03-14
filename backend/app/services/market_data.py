from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.services.token_resolver import ResolvedToken

logger = logging.getLogger(__name__)


@dataclass
class MarketBundle:
    price_usd: float
    change_24h_pct: float
    volume_24h_usd: float
    liquidity_usd: float
    market_cap_usd: float
    fdv_usd: float
    holder_concentration_risk: str
    transfer_count: int | None
    unlock_risk: str
    sentiment: str


async def _coingecko_market(symbol: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            search = await client.get(
                f"{settings.coingecko_base_url}/search",
                params={"query": symbol},
                timeout=10.0,
            )
            if search.status_code != 200:
                return {}

            coins = search.json().get("coins") or []
            if not coins:
                return {}

            coin_id = coins[0].get("id")
            if not coin_id:
                return {}

            resp = await client.get(
                f"{settings.coingecko_base_url}/coins/{coin_id}",
                params={
                    "localization": "false",
                    "tickers": "false",
                    "market_data": "true",
                    "community_data": "true",
                    "developer_data": "false",
                    "sparkline": "false",
                },
                timeout=10.0,
            )
            if resp.status_code != 200:
                return {}
            return resp.json()
    except httpx.HTTPError as exc:
        logger.warning("Coingecko request failed for symbol=%s: %s", symbol, exc)
        return {}


async def _dexscreener_market(query: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.dexscreener_base_url}/search/",
                params={"q": query},
                timeout=10.0,
            )
            if resp.status_code != 200:
                return {}
            pairs = resp.json().get("pairs") or []
            if not pairs:
                return {}
            best = max(pairs, key=lambda pair: float(pair.get("liquidity", {}).get("usd") or 0.0))
            return best
    except httpx.HTTPError as exc:
        logger.warning("Dexscreener request failed for query=%s: %s", query, exc)
        return {}


def _to_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _risk_from_liquidity_volume(liquidity_usd: float, volume_24h_usd: float) -> str:
    if liquidity_usd <= 0:
        return "high"
    ratio = volume_24h_usd / liquidity_usd
    if ratio > 1.2:
        return "high"
    if ratio > 0.5:
        return "medium"
    return "low"


def _volume_trend(change_24h_pct: float) -> str:
    if change_24h_pct > 4:
        return "up"
    if change_24h_pct < -4:
        return "down"
    return "flat"


async def fetch_market_bundle(token: ResolvedToken) -> tuple[MarketBundle, dict]:
    coingecko, dexscreener = await _coingecko_market(token.symbol), await _dexscreener_market(token.address if token.address != "unknown" else token.symbol)

    market_data = (coingecko.get("market_data") or {}) if coingecko else {}

    price_usd = _to_float(
        (dexscreener.get("priceUsd") if dexscreener else None)
        or (market_data.get("current_price") or {}).get("usd")
        or 0.0
    )
    change_24h_pct = _to_float(
        (dexscreener.get("priceChange") or {}).get("h24")
        or (market_data.get("price_change_percentage_24h") or 0.0)
    )
    volume_24h_usd = _to_float(
        (dexscreener.get("volume") or {}).get("h24")
        or (market_data.get("total_volume") or {}).get("usd")
        or 0.0
    )
    liquidity_usd = _to_float((dexscreener.get("liquidity") or {}).get("usd") or 0.0)
    market_cap_usd = _to_float((market_data.get("market_cap") or {}).get("usd") or 0.0)
    fdv_usd = _to_float(market_data.get("fully_diluted_valuation", {}).get("usd") or market_cap_usd or 0.0)

    holder_concentration_risk = "unknown"
    transfer_count = None
    unlock_risk = "unknown"

    twitter_followers = (coingecko.get("community_data") or {}).get("twitter_followers") if coingecko else None
    if twitter_followers is None:
        sentiment = "unknown"
    elif twitter_followers > 500_000:
        sentiment = "bullish"
    elif twitter_followers > 100_000:
        sentiment = "neutral"
    else:
        sentiment = "bearish"

    bundle = MarketBundle(
        price_usd=price_usd,
        change_24h_pct=change_24h_pct,
        volume_24h_usd=volume_24h_usd,
        liquidity_usd=liquidity_usd,
        market_cap_usd=market_cap_usd,
        fdv_usd=fdv_usd,
        holder_concentration_risk=holder_concentration_risk,
        transfer_count=transfer_count,
        unlock_risk=unlock_risk,
        sentiment=sentiment,
    )

    derived = {
        "liquidity_risk": _risk_from_liquidity_volume(liquidity_usd, volume_24h_usd),
        "volume_trend": _volume_trend(change_24h_pct),
        "liquidity_to_volume_ratio": (liquidity_usd / volume_24h_usd) if volume_24h_usd > 0 else None,
    }

    return bundle, derived
