from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Verifiable AI Token Verdict API"
    api_prefix: str = "/api"
    environment: str = "development"
    frontend_origin: str = "http://localhost:3000"

    coingecko_base_url: str = "https://api.coingecko.com/api/v3"
    dexscreener_base_url: str = "https://api.dexscreener.com/latest/dex"

    opengradient_enabled: bool = True
    opengradient_private_key: str = Field(
        default="",
        validation_alias=AliasChoices("OPENGRADIENT_PRIVATE_KEY", "OG_PRIVATE_KEY"),
    )
    opengradient_model: str = "openai/gpt-4.1-2025-04-14"
    opengradient_settlement_mode: str = "SETTLE_BATCH"
    opengradient_rpc_url: str = "https://ogevmdevnet.opengradient.ai"
    opengradient_api_url: str = "https://sdk-devnet.opengradient.ai"
    opengradient_contract_address: str = "0x8383C9bD7462F12Eb996DD02F78234C0421A6FaE"
    opengradient_email: str = ""
    opengradient_password: str = ""
    allow_mock_opengradient: bool = False
    opengradient_approval_amount: float = 5.0
    opengradient_enable_volatility_tool: bool = False
    opengradient_volatility_model_cid: str = "hJD2Ja3akZFt1A2LT-D_1oxOCz_OtuGYw4V9eE1m39M"

    rate_limit_requests: int = 30
    rate_limit_window_seconds: int = 60
    cache_ttl_seconds: int = 120

    @property
    def frontend_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.frontend_origin.split(",")]
        return [origin for origin in origins if origin]


settings = Settings()
