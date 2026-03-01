export type TimeHorizon = "scalp" | "swing" | "long";
export type RiskProfile = "conservative" | "balanced" | "aggressive";

export interface VerdictRequest {
  query: string;
  time_horizon: TimeHorizon;
  risk_profile: RiskProfile;
  wallet_address?: string;
}

export interface VerdictResponse {
  token: {
    name: string;
    symbol: string;
    chain: string;
    address: string;
    links: {
      website: string | null;
      twitter: string | null;
      dexscreener: string | null;
    };
  };
  market_snapshot: {
    price_usd: number;
    change_24h_pct: number;
    volume_24h_usd: number;
    liquidity_usd: number;
    market_cap_usd: number;
    fdv_usd: number;
  };
  signals: {
    liquidity_risk: "low" | "medium" | "high";
    holder_concentration_risk: "low" | "medium" | "high" | "unknown";
    volume_trend: "up" | "down" | "flat" | "unknown";
    volatility_forecast: {
      value: number;
      unit: "stdev_daily" | "stdev_weekly" | "unknown";
      source: "onchain_model" | "llm_estimate" | "unavailable";
      tx_hash: string | null;
    };
    unlock_risk: "low" | "medium" | "high" | "unknown";
    sentiment: "bullish" | "neutral" | "bearish" | "unknown";
  };
  verdict: {
    rating: "BUY" | "WATCH" | "AVOID";
    confidence_pct: number;
    risk_score_0_100: number;
    time_horizon: TimeHorizon;
    action_plan: {
      entry_zone: string;
      invalidation: string;
      take_profit_targets: string[];
      position_sizing_note: string;
    };
    key_reasons: string[];
    red_flags: string[];
  };
  proof: {
    opengradient: {
      settlement_mode: "SETTLE" | "SETTLE_BATCH" | "SETTLE_METADATA";
      receipt_id: string;
      model: string;
      timestamp: string;
    };
    tool_calls: Array<{
      tool_name: string;
      chain: string;
      tx_hash: string;
    }>;
  };
  disclaimer: string;
}
