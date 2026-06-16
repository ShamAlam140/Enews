import { create } from "zustand";
import type { CityLatest } from "../types/files";
import { getLatestByCity } from "../services/publicFileService";

type Status = "idle" | "loading" | "success" | "error";

type CityState = {
  cities: CityLatest[];
  status: Status;
  error: string | null;

  /** Actions */
  loadLatest: () => Promise<void>;
  setCities: (list: CityLatest[]) => void;
  reset: () => void;
};

export const useCityStore = create<CityState>((set, get) => ({
  cities: [],
  status: "idle",
  error: null,

  async loadLatest() {
    if (get().status === "loading") return;
    set({ status: "loading", error: null });

    try {
      const data = await getLatestByCity();
      const sorted = [...data].sort((a, b) => {
        const ta = new Date(a?.date || 0).getTime();
        const tb = new Date(b?.date || 0).getTime();
        return tb - ta;
      });
      set({ cities: sorted, status: "success", error: null });
    } catch (e: any) {
      set({ cities: [], status: "error", error: e?.message || "Failed to load" });
    }
  },

  setCities(list) {
    set({ cities: list });
  },

  reset() {
    set({ cities: [], status: "idle", error: null });
  },
}));
