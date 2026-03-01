from __future__ import annotations

from collections import deque

from cachetools import TTLCache

from app.core.config import settings

verdict_cache: TTLCache[str, dict] = TTLCache(maxsize=512, ttl=settings.cache_ttl_seconds)
verdict_history: deque[dict] = deque(maxlen=100)
