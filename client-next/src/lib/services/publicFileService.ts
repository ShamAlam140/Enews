import type { CityLatest } from "../types/files";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3000/api/v1";

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit & { timeout?: number }) {
  const { timeout = 15000, ...rest } = init || {};
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(input, { ...rest, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return res;
  } finally {
    clearTimeout(id);
  }
}

/** Get latest file per city */
export async function getLatestByCity(): Promise<CityLatest[]> {
  const url = `${API_BASE}/files/latest-by-city`;
  const res = await fetchWithTimeout(url, {
    headers: { Accept: "application/json" },
    timeout: 15000,
  });
  const json = await res.json();
  return Array.isArray(json?.data) ? (json.data as CityLatest[]) : [];
}

/** Helper to build Drive thumb if needed */
export function driveThumbUrl(id?: string, w = 2000) {
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${w}` : undefined;
}
