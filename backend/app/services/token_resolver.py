from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

EVM_ADDRESS_REGEX = re.compile(r"^0x[a-fA-F0-9]{40}$")


@dataclass
class ResolvedToken:
    name: str
    symbol: str
    chain: str
    address: str
    website: str | None
    twitter: str | None
    dexscreener: str | None


def _is_url(query: str) -> bool:
    try:
        parsed = urlparse(query)
        return bool(parsed.scheme and parsed.netloc)
    except Exception:
        return False


async def _resolve_from_dexscreener_search(client: httpx.AsyncClient, query: str) -> ResolvedToken | None:
    url = f"{settings.dexscreener_base_url}/search/"
    resp = await client.get(url, params={"q": query}, timeout=12.0)
    if resp.status_code != 200:
        return None

    data = resp.json()
    pairs = data.get("pairs") or []
    if not pairs:
        return None

    best = max(
        pairs,
        key=lambda pair: float(pair.get("liquidity", {}).get("usd") or 0.0),
    )

    base_token = best.get("baseToken", {})
    return ResolvedToken(
        name=base_token.get("name") or "Unknown",
        symbol=base_token.get("symbol") or query.upper(),
        chain=best.get("chainId") or "unknown",
        address=base_token.get("address") or query,
        website=None,
        twitter=None,
        dexscreener=best.get("url"),
    )


async def _resolve_from_coingecko_ticker(client: httpx.AsyncClient, ticker: str) -> ResolvedToken | None:
    search_url = f"{settings.coingecko_base_url}/search"
    search = await client.get(search_url, params={"query": ticker}, timeout=12.0)
    if search.status_code != 200:
        return None

    coins = search.json().get("coins") or []
    if not coins:
        return None

    coin = coins[0]
    coin_id = coin.get("id")
    if not coin_id:
        return None

    coin_url = f"{settings.coingecko_base_url}/coins/{coin_id}"
    coin_resp = await client.get(
        coin_url,
        params={
            "localization": "false",
            "tickers": "false",
            "market_data": "true",
            "community_data": "false",
            "developer_data": "false",
            "sparkline": "false",
        },
        timeout=12.0,
    )
    if coin_resp.status_code != 200:
        return None

    payload = coin_resp.json()
    platforms = payload.get("platforms") or {}
    address = next((value for value in platforms.values() if value), "")
    chain = next((key for key, value in platforms.items() if value), "unknown")

    links = payload.get("links") or {}
    homepage = (links.get("homepage") or [None])[0]
    twitter = links.get("twitter_screen_name")
    twitter_url = f"https://x.com/{twitter}" if twitter else None

    return ResolvedToken(
        name=payload.get("name") or coin.get("name") or "Unknown",
        symbol=(payload.get("symbol") or coin.get("symbol") or ticker).upper(),
        chain=chain,
        address=address or "unknown",
        website=homepage,
        twitter=twitter_url,
        dexscreener=None,
    )


async def resolve_token(query: str) -> ResolvedToken:
    query = query.strip()
    async with httpx.AsyncClient() as client:
        if EVM_ADDRESS_REGEX.match(query) or _is_url(query):
            resolved = await _resolve_from_dexscreener_search(client, query)
            if resolved:
                return resolved

        resolved = await _resolve_from_coingecko_ticker(client, query)
        if resolved:
            if resolved.address == "unknown":
                ds = await _resolve_from_dexscreener_search(client, resolved.symbol)
                if ds:
                    resolved.address = ds.address
                    resolved.chain = ds.chain
                    resolved.dexscreener = ds.dexscreener
            return resolved

        resolved = await _resolve_from_dexscreener_search(client, query)
        if resolved:
            return resolved

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Token could not be resolved from query",
    )
