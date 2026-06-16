import { create } from "zustand";
import type { CityItem } from "../types/city";
import { getCityFiles } from "../services/publicCityService";

type Status = "idle" | "loading" | "success" | "error";

type LightboxState = {
  fileId: string | null;
  src: string | null;
  page: number | null;
  name: string | null;
};

type CityFilesState = {
  files: CityItem[];
  status: Status;
  error: string | null;
  pageByFile: Record<string, number>;
  lightbox: LightboxState;

  // actions
  load: (city: string) => Promise<void>;
  setFilePage: (fileId: string, page: number) => void;
  openLightbox: (payload: LightboxState) => void;
  closeLightbox: () => void;
  reset: () => void;
};

export const useCityFilesStore = create<CityFilesState>((set, get) => ({
  files: [],
  status: "idle",
  error: null,
  pageByFile: {},
  lightbox: { fileId: null, src: null, page: null, name: null },

  async load(city) {
    if (!city) {
      set({ files: [], status: "success", error: null, pageByFile: {} });
      return;
    }
    if (get().status === "loading") return;

    set({ status: "loading", error: null });

    const controller = new AbortController();
    try {
      const files = await getCityFiles(city, { signal: controller.signal });
      const map: Record<string, number> = {};
      files.forEach((f) => (map[f.id] = 1));
      set({ files, pageByFile: map, status: "success", error: null });
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      set({ files: [], pageByFile: {}, status: "error", error: e?.message || "Failed to load" });
    }
  },

  setFilePage(fileId, page) {
    set((s) => ({ pageByFile: { ...s.pageByFile, [fileId]: page } }));
  },

  openLightbox(payload) {
    const safe: LightboxState = {
      fileId: payload.fileId ?? null,
      src: payload.src ?? null,
      page: payload.page ?? null,
      name: payload.name ?? null,
    };
    set({ lightbox: safe });
  },

  closeLightbox() {
    set({ lightbox: { fileId: null, src: null, page: null, name: null } });
  },

  reset() {
    set({
      files: [],
      status: "idle",
      error: null,
      pageByFile: {},
      lightbox: { fileId: null, src: null, page: null, name: null },
    });
  },
}));
