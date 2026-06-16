import type { CityItem } from "../types/city";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "https://enews-xfkz.onrender.com/api/v1";

type FetchOptions = {
  limit?: number; // how many files
  pages?: number; // how many pages per file (server-side cap)
  w?: number;     // image width
  signal?: AbortSignal;
  timeout?: number;
}

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit & { timeout?: number }
) {
  const { timeout = 15000, ...rest } = init || {};
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(input, { ...rest, signal: rest.signal ?? controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function getCityFiles(
  city: string,
  opts: FetchOptions = {}
): Promise<CityItem[]> {
  const { limit = 20, pages = 60, w = 1600, signal, timeout } = opts;
  const url = `${API_BASE}/files/by-city/${encodeURIComponent(
    city
  )}/page-images?limit=${limit}&pages=${pages}&w=${w}`;

  const res = await fetchWithTimeout(url, {
    headers: { Accept: "application/json" },
    signal,
    timeout,
  });

  const json = await res.json();
  return Array.isArray(json?.files) ? (json.files as CityItem[]) : [];
}
