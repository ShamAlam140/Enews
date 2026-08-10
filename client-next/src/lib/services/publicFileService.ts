import type { CityLatest } from "../types/files";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "https://alamsusalabs-khabre-backend.hf.space/api/v1";

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
  try {
    const res = await fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      timeout: 15000,
    });
    const json = await res.json();
    
    if (json && Array.isArray(json.data)) {
      return json.data as CityLatest[];
    }
    return [];
  } catch (err: any) {
    console.error(`[getLatestByCity] Error:`, err.message || err);
    throw err;
  }
}

/** Helper to build Drive thumb if needed */
export function driveThumbUrl(id?: string, w = 2000) {
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${w}` : undefined;
}
