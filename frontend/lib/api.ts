import { VerdictRequest, VerdictResponse } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchVerdict(
  payload: VerdictRequest
): Promise<VerdictResponse> {
  const body: Record<string, unknown> = {
    query: payload.query,
    time_horizon: payload.time_horizon,
    risk_profile: payload.risk_profile,
  };
  if (payload.wallet_address) {
    body.wallet_address = payload.wallet_address;
  }

  const response = await fetch(`${API_BASE}/api/verdict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to fetch verdict");
  }

  return response.json();
}

export async function fetchHistory(): Promise<VerdictResponse[]> {
  const resp = await fetch(`${API_BASE}/api/history`, { cache: "no-store" });
  if (!resp.ok) return [];
  return resp.json();
}
