from __future__ import annotations

import json
import logging
import uuid
import enum
import inspect
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
        # In non-production environments, default to graceful mock fallback
        # unless explicitly disabled via ALLOW_MOCK_OPENGRADIENT.
        self.allow_mock = settings.allow_mock_opengradient or settings.environment.lower() != "production"

    @staticmethod
    def _ensure_strenum_compat() -> None:
        # Python <3.11 does not provide enum.StrEnum; some dependencies import it directly.
        if hasattr(enum, "StrEnum"):
            return

        class _CompatStrEnum(str, enum.Enum):
            pass

        enum.StrEnum = _CompatStrEnum

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
        aliases = {
            "SETTLE_BATCH": "BATCH_HASHED",
            "SETTLE_METADATA": "INDIVIDUAL_FULL",
            "SETTLE": "INDIVIDUAL_FULL",
        }

        candidates = [mode_name]
        if mode_name in aliases:
            candidates.append(aliases[mode_name])

        for candidate in candidates:
            if hasattr(og.x402SettlementMode, candidate):
                return getattr(og.x402SettlementMode, candidate)

        if hasattr(og.x402SettlementMode, "BATCH_HASHED"):
            return og.x402SettlementMode.BATCH_HASHED
        if hasattr(og.x402SettlementMode, "SETTLE_BATCH"):
            return og.x402SettlementMode.SETTLE_BATCH

        raise ValueError("No compatible x402 settlement mode enum found in opengradient SDK")

    def _resolve_private_settlement_mode(self, og: Any) -> Any | None:
        for candidate in ("PRIVATE", "SETTLE_PRIVATE"):
            if hasattr(og.x402SettlementMode, candidate):
                return getattr(og.x402SettlementMode, candidate)
        return None

    def _fallback_settlement_modes(self, og: Any, primary_mode: Any) -> list[Any]:
        candidates: list[Any] = []

        private_mode = self._resolve_private_settlement_mode(og)
        if private_mode is not None and private_mode != primary_mode:
            candidates.append(private_mode)

        # Legacy SDKs often expose SETTLE_* enums only; individual settlement can be
        # more reliable than batch settlement when event indexing lags.
        for candidate in ("SETTLE", "INDIVIDUAL_FULL", "SETTLE_METADATA"):
            if hasattr(og.x402SettlementMode, candidate):
                mode = getattr(og.x402SettlementMode, candidate)
                if mode != primary_mode and mode not in candidates:
                    candidates.append(mode)

        return candidates

    def _resolve_model_cid(self, og: Any) -> str:
        # Older SDK paths take a string model_cid, while newer paths use TEE_LLM enums.
        requested = settings.opengradient_model.strip()
        if "/" in requested:
            return requested

        try:
            model_enum = self._resolve_model(og)
            value = getattr(model_enum, "value", None)
            if isinstance(value, str) and value:
                return value
        except Exception:
            pass

        return "openai/gpt-4.1-2025-04-14"

    def _parse_chat_output(self, content: Any) -> dict[str, Any]:
        if isinstance(content, dict):
            return content
        if isinstance(content, list):
            content = "".join(str(chunk) for chunk in content)
        if not isinstance(content, str) or not content.strip():
            raise ValueError("OpenGradient chat output is empty")
        normalized = content.strip()
        try:
            return json.loads(normalized)
        except json.JSONDecodeError:
            # Be resilient if the model wraps JSON with extra text.
            start = normalized.find("{")
            end = normalized.rfind("}")
            if start >= 0 and end > start:
                return json.loads(normalized[start : end + 1])
            raise

    def _extract_chat_content(self, response: Any) -> tuple[Any, str]:
        chat_output = getattr(response, "chat_output", None)
        if isinstance(chat_output, dict) and "content" in chat_output:
            return chat_output.get("content"), "object.chat_output.content"

        if isinstance(response, dict):
            chat_output = response.get("chat_output") or {}
            if isinstance(chat_output, dict) and "content" in chat_output:
                return chat_output.get("content"), "dict.chat_output.content"

            if "content" in response:
                return response.get("content"), "dict.content"

        choices = getattr(response, "choices", None)
        if isinstance(choices, list) and choices:
            first = choices[0]
            message = getattr(first, "message", None)
            if message is not None:
                content = getattr(message, "content", None)
                if content:
                    return content, "object.choices[0].message.content"

            if isinstance(first, dict):
                message = first.get("message") or {}
                if isinstance(message, dict) and message.get("content"):
                    return message.get("content"), "dict.choices[0].message.content"

        if hasattr(response, "completion_output"):
            return getattr(response, "completion_output"), "object.completion_output"

        if isinstance(response, dict):
            if response.get("completion_output"):
                return response.get("completion_output"), "dict.completion_output"
            if isinstance(response.get("output"), dict) and response["output"].get("content"):
                return response["output"]["content"], "dict.output.content"

        return None, "not_found"

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

    def _ensure_opg_approval_if_supported(self, client: Any) -> None:
        if OpenGradientClient._approval_done:
            return

        ensure_fn = getattr(client, "ensure_opg_approval", None)
        if not callable(ensure_fn):
            llm_obj = getattr(client, "llm", None)
            ensure_fn = getattr(llm_obj, "ensure_opg_approval", None)
        if callable(ensure_fn):
            ensure_fn(opg_amount=settings.opengradient_approval_amount)
            OpenGradientClient._approval_done = True

    @staticmethod
    async def _resolve_maybe_async(result: Any) -> Any:
        if inspect.isawaitable(result):
            return await result
        return result

    def _create_llm_client(self, og: Any) -> Any | None:
        if not hasattr(og, "LLM"):
            return None

        llm_ctor = og.LLM
        if isinstance(llm_ctor, enum.EnumMeta):
            # Older SDKs export LLM as a model enum, not a client constructor.
            return None

        params = inspect.signature(llm_ctor).parameters
        kwargs: dict[str, Any] = {}

        if "private_key" in params:
            kwargs["private_key"] = settings.opengradient_private_key
        if "rpc_url" in params and settings.opengradient_rpc_url:
            kwargs["rpc_url"] = settings.opengradient_rpc_url
        if "api_url" in params and settings.opengradient_api_url:
            kwargs["api_url"] = settings.opengradient_api_url
        if "contract_address" in params and settings.opengradient_contract_address:
            kwargs["contract_address"] = settings.opengradient_contract_address

        return llm_ctor(**kwargs)

    async def _invoke_llm_chat(self, llm_client: Any, og: Any, messages: list[dict[str, str]], settlement_mode: Any) -> Any:
        chat_fn = getattr(llm_client, "chat", None)
        if not callable(chat_fn):
            raise ValueError("No compatible LLM chat interface found in OpenGradient SDK")

        result = chat_fn(
            model=self._resolve_model(og),
            messages=messages,
            x402_settlement_mode=settlement_mode,
            temperature=0,
            max_tokens=1200,
        )
        return await self._resolve_maybe_async(result)

    def _create_og_client(self, og: Any) -> Any:
        if hasattr(og, "Client"):
            client_ctor = og.Client
            params = inspect.signature(client_ctor).parameters
            kwargs: dict[str, Any] = {}

            if "private_key" in params:
                kwargs["private_key"] = settings.opengradient_private_key
            if "rpc_url" in params:
                kwargs["rpc_url"] = settings.opengradient_rpc_url
            if "api_url" in params:
                kwargs["api_url"] = settings.opengradient_api_url
            if "contract_address" in params:
                kwargs["contract_address"] = settings.opengradient_contract_address
            if "email" in params and settings.opengradient_email:
                kwargs["email"] = settings.opengradient_email
            if "password" in params and settings.opengradient_password:
                kwargs["password"] = settings.opengradient_password

            return client_ctor(**kwargs)

        if hasattr(og, "init"):
            init_fn = og.init
            params = inspect.signature(init_fn).parameters
            kwargs: dict[str, Any] = {}

            if "private_key" in params:
                kwargs["private_key"] = settings.opengradient_private_key
            if "rpc_url" in params:
                kwargs["rpc_url"] = settings.opengradient_rpc_url
            if "api_url" in params:
                kwargs["api_url"] = settings.opengradient_api_url
            if "contract_address" in params:
                kwargs["contract_address"] = settings.opengradient_contract_address
            if "email" in params and settings.opengradient_email:
                kwargs["email"] = settings.opengradient_email
            if "password" in params and settings.opengradient_password:
                kwargs["password"] = settings.opengradient_password

            required_missing = [
                name
                for name, param in params.items()
                if param.default is inspect._empty and name not in kwargs
            ]
            if required_missing:
                missing = ", ".join(required_missing)
                raise ValueError(
                    f"OpenGradient SDK init requires missing settings: {missing}. "
                    "Set OPENGRADIENT_EMAIL/OPENGRADIENT_PASSWORD and retry."
                )

            return init_fn(**kwargs)

        raise ValueError("No compatible OpenGradient client constructor found")

    async def analyze(
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
            self._ensure_strenum_compat()
            import opengradient as og

            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ]

            settlement_mode = self._resolve_settlement_mode(og)
            settlement_mode_name = getattr(settlement_mode, "name", settings.opengradient_settlement_mode)
            response = None

            llm_client = self._create_llm_client(og)
            if llm_client is not None:
                self._ensure_opg_approval_if_supported(llm_client)
                try:
                    response = await self._invoke_llm_chat(llm_client, og, messages, settlement_mode)
                except Exception as exc:
                    exc_msg = str(exc)
                    if "event not found" in exc_msg.lower():
                        retry_modes = self._fallback_settlement_modes(og, settlement_mode)
                        for retry_mode in retry_modes:
                            retry_mode_name = getattr(retry_mode, "name", "unknown")
                            logger.warning(
                                "OpenGradient settlement result event not found with mode=%s. "
                                "Retrying once with mode=%s. Details: %s",
                                settlement_mode_name,
                                retry_mode_name,
                                exc_msg,
                            )
                            try:
                                response = await self._invoke_llm_chat(llm_client, og, messages, retry_mode)
                                settlement_mode_name = retry_mode_name
                                break
                            except Exception as retry_exc:
                                exc_msg = str(retry_exc)
                                if "event not found" not in exc_msg.lower():
                                    raise
                        if response is None:
                            raise ValueError(exc_msg)
                    else:
                        raise
            else:
                client = self._create_og_client(og)
                self._ensure_opg_approval_if_supported(client)

                if hasattr(client, "llm") and hasattr(client.llm, "chat"):
                    async def _legacy_chat(mode: Any) -> Any:
                        return await self._resolve_maybe_async(client.llm.chat(
                            model=self._resolve_model(og),
                            messages=messages,
                            x402_settlement_mode=mode,
                            temperature=0,
                            max_tokens=1200,
                        ))

                    try:
                        response = await _legacy_chat(settlement_mode)
                    except Exception as exc:
                        exc_msg = str(exc)
                        if "event not found" in exc_msg.lower():
                            retry_modes = self._fallback_settlement_modes(og, settlement_mode)
                            for retry_mode in retry_modes:
                                retry_mode_name = getattr(retry_mode, "name", "unknown")
                                logger.warning(
                                    "OpenGradient settlement result event not found with mode=%s. "
                                    "Retrying once with mode=%s. Details: %s",
                                    settlement_mode_name,
                                    retry_mode_name,
                                    exc_msg,
                                )
                                try:
                                    response = await _legacy_chat(retry_mode)
                                    settlement_mode_name = retry_mode_name
                                    break
                                except Exception as retry_exc:
                                    exc_msg = str(retry_exc)
                                    if "event not found" not in exc_msg.lower():
                                        raise
                            if response is None:
                                raise ValueError(exc_msg)
                        else:
                            raise
                elif hasattr(client, "llm_chat"):
                    async def _legacy_llm_chat(mode: Any) -> Any:
                        return await self._resolve_maybe_async(client.llm_chat(
                            model_cid=self._resolve_model_cid(og),
                            messages=messages,
                            x402_settlement_mode=mode,
                            temperature=0,
                            max_tokens=1200,
                        ))

                    try:
                        response = await _legacy_llm_chat(settlement_mode)
                    except Exception as exc:
                        exc_msg = str(exc)
                        if "event not found" in exc_msg.lower():
                            retry_modes = self._fallback_settlement_modes(og, settlement_mode)
                            for retry_mode in retry_modes:
                                retry_mode_name = getattr(retry_mode, "name", "unknown")
                                logger.warning(
                                    "OpenGradient settlement result event not found with mode=%s. "
                                    "Retrying once with mode=%s. Details: %s",
                                    settlement_mode_name,
                                    retry_mode_name,
                                    exc_msg,
                                )
                                try:
                                    response = await _legacy_llm_chat(retry_mode)
                                    settlement_mode_name = retry_mode_name
                                    break
                                except Exception as retry_exc:
                                    exc_msg = str(retry_exc)
                                    if "event not found" not in exc_msg.lower():
                                        raise
                            if response is None:
                                raise ValueError(exc_msg)
                        else:
                            raise
                else:
                    raise ValueError("No compatible LLM chat interface found in OpenGradient SDK")

            content, content_source = self._extract_chat_content(response)
            logger.debug(
                "OpenGradient chat content extraction path=%s response_type=%s",
                content_source,
                type(response).__name__,
            )
            parsed = self._parse_chat_output(content)
            payment_hash = self._extract_receipt_id(response)

            return LLMResult(
                payload=parsed,
                receipt_id=payment_hash,
                model=settings.opengradient_model,
                settlement_mode=settlement_mode_name,
                timestamp=datetime.now(timezone.utc),
            )
        except HTTPException:
            raise
        except Exception as exc:
            exc_msg = str(exc)
            if "event not found" in exc_msg.lower():
                if not self.allow_mock:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=(
                            "OpenGradient LLM returned no result event after retry. "
                            f"Details: {exc_msg}"
                        ),
                    ) from exc
                logger.warning(
                    "OpenGradient LLM returned no result event after retry. "
                    "Falling back to mock response because ALLOW_MOCK_OPENGRADIENT=true. "
                    "Details: %s",
                    exc_msg,
                )
                return self._mock_llm(market_snapshot, time_horizon)
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
            self._ensure_strenum_compat()
            import opengradient as og
            from opengradient.alphasense import ToolType, create_run_model_tool
            from pydantic import BaseModel, Field

            logger.info(
                "Running on-chain volatility model (cid=%s, prices=%d)",
                model_cid,
                len(normalized_series),
            )

            client = self._create_og_client(og)

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

