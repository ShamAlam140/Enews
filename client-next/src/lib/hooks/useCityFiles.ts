import { useEffect } from "react";
import { useCityFilesStore } from "../store/cityFilesStore";

export function useCityFiles(city: string) {
  const files = useCityFilesStore((s) => s.files);
  const status = useCityFilesStore((s) => s.status);
  const error = useCityFilesStore((s) => s.error);
  const pageByFile = useCityFilesStore((s) => s.pageByFile);
  const lightbox = useCityFilesStore((s) => s.lightbox);

  const load = useCityFilesStore((s) => s.load);
  const setFilePage = useCityFilesStore((s) => s.setFilePage);
  const openLightbox = useCityFilesStore((s) => s.openLightbox);
  const closeLightbox = useCityFilesStore((s) => s.closeLightbox);

  useEffect(() => {
    load(city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  return {
    files,
    status,
    error,
    pageByFile,
    lightbox,
    setFilePage,
    openLightbox,
    closeLightbox,
    reload: () => load(city),
  };
}
