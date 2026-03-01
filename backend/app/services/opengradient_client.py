from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

from fastapi import HTTPException, status

from app.core.config import settings
from app.services.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE


@dataclass
class LLMResult:
    payload: dict[str, Any]
    receipt_id: str
    model: str
    settlement_mode: str
    timestamp: datetime


@dataclass
class ToolCallResult:
    value: float
    unit: str
    source: str
    tx_hash: str | None
    chain: str


class OpenGradientClient:
    _approval_done = False

    def __init__(self) -> None:
        self.enabled = settings.opengradient_enabled
        self.allow_mock = settings.allow_mock_opengradient

    def _mock_llm(self, market_snapshot: dict[str, Any], time_horizon: str) -> LLMResult:
        change = float(market_snapshot.get("change_24h_pct") or 0.0)
        liquidity = float(market_snapshot.get("liquidity_usd") or 0.0)

        if liquidity < 50_000 or change < -15:
            rating = "AVOID"
            confidence = 67
            risk = 78
        elif change > 5 and liquidity > 250_000:
            rating = "BUY"
            confidence = 71
            risk = 48
        else:
            rating = "WATCH"
            confidence = 62
            risk = 58

        payload = {
            "verdict": {
                "rating": rating,
                "confidence_pct": confidence,
                "risk_score_0_100": risk,
                "time_horizon": time_horizon,
                "action_plan": {
                    "entry_zone": "Scale in near current support; avoid chasing sharp candles.",
                    "invalidation": "Exit if price closes below recent swing support on rising volume.",
                    "take_profit_targets": ["TP1 at +8%", "TP2 at +15%"],
                    "position_sizing_note": "Use 0.5-1.5% risk per trade, reduce size if liquidity is thin.",
                },
                "key_reasons": [
                    "Verdict derived from observed liquidity, volume and price trend only.",
                    "Confidence reduced where holder/unlock/transfer signals are unavailable.",
                    "Thesis assumes current market structure remains intact.",
                ],
                "red_flags": [
                    "Low data coverage can invalidate the setup quickly.",
                    "Crypto volatility can exceed planned stops.",
                ],
            },
            "signals": {
                "liquidity_risk": "medium",
                "holder_concentration_risk": "unknown",
                "volume_trend": "flat",
                "volatility_forecast": {
                    "value": 0.0,
                    "unit": "unknown",
                    "source": "unavailable",
                    "tx_hash": None,
                },
                "unlock_risk": "unknown",
                "sentiment": "unknown",
            },
        }

        return LLMResult(
            payload=payload,
            receipt_id=f"mock-{uuid.uuid4().hex}",
            model=settings.opengradient_model,
            settlement_mode=settings.opengradient_settlement_mode,
            timestamp=datetime.now(timezone.utc),
        )

    def _resolve_model(self, og: Any) -> Any:
        enum_map = {
            "openai/gpt-4.1-2025-04-14": "GPT_4_1_2025_04_14",
            "openai/gpt-4o": "GPT_4O",
            "openai/o4-mini": "O4_MINI",
            "anthropic/claude-4.0-sonnet": "CLAUDE_4_0_SONNET",
            "google/gemini-2.5-pro": "GEMINI_2_5_PRO",
            "google/gemini-2.5-flash": "GEMINI_2_5_FLASH",
        }

        requested = settings.opengradient_model.strip()
        model_attr = enum_map.get(requested, requested)
        if "/" in model_attr:
            model_attr = model_attr.split("/")[-1]
        model_attr = model_attr.replace("-", "_").replace(".", "_").upper()

        if hasattr(og.TEE_LLM, model_attr):
            return getattr(og.TEE_LLM, model_attr)

        if hasattr(og.TEE_LLM, "GPT_4_1_2025_04_14"):
            return og.TEE_LLM.GPT_4_1_2025_04_14
        raise ValueError("No compatible TEE_LLM model enum found in opengradient SDK")

    def _resolve_settlement_mode(self, og: Any) -> Any:
        mode_name = settings.opengradient_settlement_mode.upper().strip()
        if hasattr(og.x402SettlementMode, mode_name):
            return getattr(og.x402SettlementMode, mode_name)
        return og.x402SettlementMode.SETTLE_BATCH

    def _parse_chat_output(self, content: Any) -> dict[str, Any]:
        if isinstance(content, dict):
            return content
        if isinstance(content, list):
            content = "".join(str(chunk) for chunk in content)
        if not isinstance(content, str) or not content.strip():
            raise ValueError("OpenGradient chat output is empty")
        return json.loads(content)

    def _extract_receipt_id(self, response: Any) -> str:
        candidates = [
            "payment_hash",
            "x402_payment_hash",
            "receipt_id",
            "settlement_hash",
            "transaction_hash",
            "tx_hash",
        ]

        for field in candidates:
            value = getattr(response, field, None)
            if value:
                return str(value)

        if isinstance(response, dict):
            for field in candidates:
                value = response.get(field)
                if value:
                    return str(value)

            metadata = response.get("metadata") or {}
            if isinstance(metadata, dict):
                for field in candidates:
                    value = metadata.get(field)
                    if value:
                        return str(value)

        return f"unknown-{uuid.uuid4().hex}"

    def analyze(
        self,
        token_data: dict[str, Any],
        market_snapshot: dict[str, Any],
        derived_metrics: dict[str, Any],
        time_horizon: str,
        risk_profile: str,
    ) -> LLMResult:
        user_prompt = USER_PROMPT_TEMPLATE.format(
            token_data=json.dumps(token_data, separators=(",", ":")),
            market_snapshot=json.dumps(market_snapshot, separators=(",", ":")),
            derived_metrics=json.dumps(derived_metrics, separators=(",", ":")),
            time_horizon=time_horizon,
            risk_profile=risk_profile,
        )

        if not self.enabled:
            if not self.allow_mock:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="OpenGradient verifiable mode is disabled",
                )
            return self._mock_llm(market_snapshot, time_horizon)

        if not settings.opengradient_private_key:
            if not self.allow_mock:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="OG_PRIVATE_KEY (or OPENGRADIENT_PRIVATE_KEY) is missing",
                )
            return self._mock_llm(market_snapshot, time_horizon)

        try:
            import opengradient as og

            client = og.Client(private_key=settings.opengradient_private_key)
            if not OpenGradientClient._approval_done:
                client.llm.ensure_opg_approval(opg_amount=settings.opengradient_approval_amount)
                OpenGradientClient._approval_done = True

            response = client.llm.chat(
                model=self._resolve_model(og),
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                x402_settlement_mode=self._resolve_settlement_mode(og),
                temperature=0,
                max_tokens=1200,
            )
            chat_output = getattr(response, "chat_output", None) or {}
            content = chat_output.get("content") if isinstance(chat_output, dict) else None
            parsed = self._parse_chat_output(content)
            payment_hash = self._extract_receipt_id(response)

            return LLMResult(
                payload=parsed,
                receipt_id=payment_hash,
                model=settings.opengradient_model,
                settlement_mode=settings.opengradient_settlement_mode,
                timestamp=datetime.now(timezone.utc),
            )
        except HTTPException:
            raise
        except Exception as exc:
            if not self.allow_mock:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"OpenGradient call failed: {exc}",
                ) from exc
            return self._mock_llm(market_snapshot, time_horizon)

    # ── helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _unavailable(reason: str | None = None) -> ToolCallResult:
        if reason:
            logger.info("Volatility tool unavailable: %s", reason)
        return ToolCallResult(
            value=0.0,
            unit="unknown",
            source="unavailable",
            tx_hash=None,
            chain="unknown",
        )

    # ── on-chain volatility tool ─────────────────────────────────────

    def run_optional_volatility_tool(
        self,
        enabled: bool = False,
        price_series: list[float] | None = None,
    ) -> ToolCallResult:
        if not enabled or not settings.opengradient_enable_volatility_tool:
            return self._unavailable()

        if not settings.opengradient_private_key:
            return self._unavailable("OG_PRIVATE_KEY not set")

        model_cid = getattr(settings, "opengradient_volatility_model_cid", "")
        if not model_cid:
            return self._unavailable("OPENGRADIENT_VOLATILITY_MODEL_CID not set")

        normalized_series = [float(x) for x in (price_series or []) if float(x) > 0]
        if len(normalized_series) < 8:
            return self._unavailable(f"need ≥8 prices, got {len(normalized_series)}")

        try:
            import opengradient as og
            from opengradient.alphasense import ToolType, create_run_model_tool
            from pydantic import BaseModel, Field

            logger.info(
                "Running on-chain volatility model (cid=%s, prices=%d)",
                model_cid,
                len(normalized_series),
            )

            client = og.init(private_key=settings.opengradient_private_key)

            class VolatilityInput(BaseModel):
                price_series: list[float] = Field(
                    min_length=8,
                    description="USD price series ordered oldest to newest",
                )

            telemetry: dict[str, Any] = {"tx_hash": None, "value": 0.0}

            def model_input_provider(**llm_input: Any) -> dict[str, list[float]]:
                incoming = llm_input.get("price_series") or normalized_series
                return {"price_series": [float(x) for x in incoming]}

            def model_output_formatter(inference_result: Any) -> str:
                tx_hash = getattr(inference_result, "transaction_hash", None)
                telemetry["tx_hash"] = tx_hash

                model_output = getattr(inference_result, "model_output", {}) or {}
                std_value = model_output.get("std", 0.0)
                if hasattr(std_value, "item"):
                    std_value = std_value.item()
                std_float = float(std_value)
                telemetry["value"] = std_float

                return f"volatility_std={std_float:.8f}; tx={tx_hash}"

            volatility_tool = create_run_model_tool(
                tool_type=ToolType.LANGCHAIN,
                model_cid=model_cid,
                tool_name="volatility_model",
                tool_description="Run on-chain volatility forecast using OpenGradient AlphaSense model.",
                model_input_provider=model_input_provider,
                model_output_formatter=model_output_formatter,
                inference=client.alpha,
                tool_input_schema=VolatilityInput,
                inference_mode=og.InferenceMode.VANILLA,
            )

            volatility_tool.invoke({"price_series": normalized_series})

            tx_hash = telemetry.get("tx_hash")
            if not tx_hash:
                return self._unavailable("on-chain inference returned no tx_hash")

            logger.info("Volatility tool OK — tx=%s, std=%.6f", tx_hash, telemetry["value"])
            return ToolCallResult(
                value=float(telemetry.get("value") or 0.0),
                unit="stdev_daily",
                source="onchain_model",
                tx_hash=str(tx_hash),
                chain="OpenGradient Alpha Testnet",
            )

        except Exception as exc:
            exc_msg = str(exc)
            if "InferenceResult event not found" in exc_msg:
                logger.warning(
                    "On-chain volatility model returned no InferenceResult event. "
                    "This is usually a transient Alpha devnet issue — the ONNX "
                    "inference nodes may be unavailable. The LLM verdict is still "
                    "valid. Details: %s",
                    exc_msg,
                )
            else:
                logger.error("Volatility tool failed: %s", exc_msg, exc_info=True)

            return self._unavailable(exc_msg)

