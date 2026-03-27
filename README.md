# Verifiable AI Token Verdict (MVP)

Production-oriented MVP web app that generates a token verdict (`BUY` / `WATCH` / `AVOID`) with confidence, risk score, action plan, and OpenGradient proof receipts.

## Repository Structure

```text
OpenGradient/
  backend/
    app/
      api/routes.py
      core/{config.py,cache.py,rate_limit.py}
      services/{token_resolver.py,market_data.py,prompts.py,opengradient_client.py,verdict_pipeline.py}
      schemas.py
      main.py
    requirements.txt
    .env.example
  frontend/
    app/{layout.tsx,globals.css,page.tsx,verdict/page.tsx,history/page.tsx}
    components/{VerdictCard.tsx,ProofDrawer.tsx}
    lib/{api.ts,types.ts}
    package.json
    next.config.ts
    tailwind.config.ts
  README.md
```

## Backend (FastAPI)

### Endpoint
- `POST /api/verdict`
- `GET /api/history` (optional MVP history)

### Request
```json
{
  "query": "ARB",
  "time_horizon": "swing",
  "risk_profile": "balanced"
}
```

### Guarantees
- Strict schema validation with `pydantic` (`extra="forbid"`).
- Missing signals degrade to `unknown` and confidence reduction is enforced in prompt guidance.
- Includes proof receipt fields under `proof.opengradient`.
- Includes disclaimer: `Informational only. Not financial advice.`

## OpenGradient Integration Snippet

The project uses `app/services/opengradient_client.py`. Core verifiable call:

```python
import opengradient as og

client = og.Client(private_key=os.environ["OG_PRIVATE_KEY"])
client.llm.ensure_opg_approval(opg_amount=5.0)

response = client.llm.chat(
  model=og.TEE_LLM.GPT_4_1_2025_04_14,
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ],
  x402_settlement_mode=og.x402SettlementMode.BATCH_HASHED,
    temperature=0,
)

receipt_id = response.payment_hash
content = response.chat_output["content"]
```

Environment flags:
- `OPENGRADIENT_ENABLED=true`
- `OG_PRIVATE_KEY=...`
- `OPENGRADIENT_SETTLEMENT_MODE=BATCH_HASHED`
- `OPENGRADIENT_ENABLE_VOLATILITY_TOOL=true` (enables on-chain ONNX tool call)
- `OPENGRADIENT_VOLATILITY_MODEL_CID=hJD2Ja3akZFt1A2LT-D_1oxOCz_OtuGYw4V9eE1m39M`
- `ALLOW_MOCK_OPENGRADIENT=false` (set true only for local fallback)

On-chain tool pattern (used by backend):

```python
from opengradient.alphasense import ToolType, create_run_model_tool

volatility_tool = create_run_model_tool(
  tool_type=ToolType.LANGCHAIN,
  model_cid=VOLATILITY_MODEL_CID,
  tool_name="volatility_model",
  tool_description="Run on-chain volatility forecast",
  model_input_provider=model_input_provider,
  model_output_formatter=model_output_formatter,
  inference=client.alpha,
  tool_input_schema=VolatilityInput,
  inference_mode=og.InferenceMode.VANILLA,
)

volatility_tool.invoke({"price_series": price_series})
```

## Exact Prompting

### System Prompt
```text
You are a conservative crypto market analyst producing institutional-quality token verdicts.

Rules:
1) Use ONLY the structured input data provided.
2) Never invent unavailable signals.
3) If any signal is missing, mark as unknown and lower confidence.
4) Return STRICT JSON matching the required schema exactly.
5) Keep language professional and risk-aware.
6) Always include thesis invalidation, risk note, and confidence rationale in key_reasons/red_flags/action_plan.
7) Do not include markdown fences, prose, or extra keys.
```

### User Prompt Template
```text
Generate a verdict JSON with this schema (exact keys only):
{
  "verdict": {
    "rating": "BUY" | "WATCH" | "AVOID",
    "confidence_pct": 0-100 integer,
    "risk_score_0_100": 0-100 integer,
    "time_horizon": "{time_horizon}",
    "action_plan": {
      "entry_zone": "string",
      "invalidation": "string",
      "take_profit_targets": ["string", "string"],
      "position_sizing_note": "string"
    },
    "key_reasons": ["string", "string", "string"],
    "red_flags": ["string", "string"]
  },
  "signals": {
    "liquidity_risk": "low" | "medium" | "high",
    "holder_concentration_risk": "low" | "medium" | "high" | "unknown",
    "volume_trend": "up" | "down" | "flat" | "unknown",
    "volatility_forecast": {
      "value": number,
      "unit": "stdev_daily" | "stdev_weekly" | "unknown",
      "source": "onchain_model" | "llm_estimate" | "unavailable",
      "tx_hash": string or null
    },
    "unlock_risk": "low" | "medium" | "high" | "unknown",
    "sentiment": "bullish" | "neutral" | "bearish" | "unknown"
  }
}

Input token_data:
{token_data}

Input market_snapshot:
{market_snapshot}

Input derived_metrics:
{derived_metrics}

Risk profile: {risk_profile}

If volatility is unavailable, set source to unavailable and tx_hash to null.
```

## Example Response Payload

```json
{
  "token": {
    "name": "Arbitrum",
    "symbol": "ARB",
    "chain": "ethereum",
    "address": "0x912ce59144191c1204e64559fe8253a0e49e6548",
    "links": {
      "website": "https://arbitrum.foundation",
      "twitter": "https://x.com/arbitrum",
      "dexscreener": "https://dexscreener.com/ethereum/0x..."
    }
  },
  "market_snapshot": {
    "price_usd": 0.96,
    "change_24h_pct": 3.2,
    "volume_24h_usd": 185000000,
    "liquidity_usd": 9800000,
    "market_cap_usd": 2900000000,
    "fdv_usd": 9600000000
  },
  "signals": {
    "liquidity_risk": "medium",
    "holder_concentration_risk": "unknown",
    "volume_trend": "up",
    "volatility_forecast": {
      "value": 0.0,
      "unit": "unknown",
      "source": "unavailable",
      "tx_hash": null
    },
    "unlock_risk": "unknown",
    "sentiment": "neutral"
  },
  "verdict": {
    "rating": "WATCH",
    "confidence_pct": 64,
    "risk_score_0_100": 57,
    "time_horizon": "swing",
    "action_plan": {
      "entry_zone": "$0.92-$0.98",
      "invalidation": "below $0.88",
      "take_profit_targets": ["$1.05", "$1.12"],
      "position_sizing_note": "Keep risk per position under 1% of portfolio due to uncertainty in holder concentration and unlock schedule."
    },
    "key_reasons": [
      "Liquidity and volume are sufficient for execution.",
      "Trend momentum is positive over 24h.",
      "Confidence reduced due to missing unlock/holder data."
    ],
    "red_flags": [
      "Critical tokenomics signals are unavailable.",
      "Volatility can invalidate near-term setups quickly."
    ]
  },
  "proof": {
    "opengradient": {
      "settlement_mode": "BATCH_HASHED",
      "receipt_id": "0xreceipt...",
      "model": "meta-llama/Llama-3.3-70B-Instruct",
      "timestamp": "2026-02-28T12:34:56Z"
    },
    "tool_calls": []
  },
  "disclaimer": "Informational only. Not financial advice."
}
```

## Run Locally

### Backend
```bash
cd backend
python3 -m venv .venv
# Windows
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Note: OpenGradient docs currently indicate Windows users may need WSL for `opengradient` installation in some setups.

### Frontend
```bash
cd frontend
npm install
set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

## Deploy Notes

- Frontend: Vercel
  - Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL.
- Backend: Railway or Fly.io
  - Build command: `pip install -r requirements.txt`
  - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Set env vars from `backend/.env.example`, especially OpenGradient credentials.
- For production:
  - Replace in-memory cache/history with Redis/PostgreSQL.
  - Add API auth and persistent audit logs for receipts.
  - Enable real on-chain model tool call and chain explorer links by chain.
