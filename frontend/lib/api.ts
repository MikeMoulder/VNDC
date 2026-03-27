import { VerdictRequest, VerdictResponse } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchVerdict(
  payload: VerdictRequest
): Promise<VerdictResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/verdict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: payload.query,
        time_horizon: payload.time_horizon,
        risk_profile: payload.risk_profile,
      }),
      cache: "no-store",
    });
  } catch {
    throw new Error(`Cannot reach API at ${API_BASE}. Ensure backend is running.`);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to fetch verdict");
  }

  return response.json();
}

export async function fetchHistory(): Promise<VerdictResponse[]> {
  let resp: Response;
  try {
    resp = await fetch(`${API_BASE}/api/history`, { cache: "no-store" });
  } catch {
    throw new Error(`Cannot reach API at ${API_BASE}. Ensure backend is running.`);
  }
  if (!resp.ok) return [];
  return resp.json();
}
