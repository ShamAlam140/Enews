import { useEffect } from "react";
import { useCityStore } from "../store/cityStore";

export function useCities() {
  const cities = useCityStore((s) => s.cities);
  const status = useCityStore((s) => s.status);
  const error = useCityStore((s) => s.error);
  const loadLatest = useCityStore((s) => s.loadLatest);

  useEffect(() => {
    if (status === "idle" || (status !== "loading" && cities.length === 0)) {
      loadLatest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { cities, status, error, reload: loadLatest };
}
