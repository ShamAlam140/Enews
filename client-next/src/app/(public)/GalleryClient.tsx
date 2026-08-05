'use client';

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import "react-medium-image-zoom/dist/styles.css";

const Zoom = dynamic(() => import("react-medium-image-zoom"), {
  ssr: false,
});

import type { CityLatest } from "@/lib/types/files";
import { titleCaseCity, formatShortDate } from "@/lib/utils/format";
import { driveThumbUrl, getLatestByCity } from "@/lib/services/publicFileService";
import { listActiveAds, type AdRecord } from "@/lib/services/adService";

export default function GalleryClient({ initialCities }: { initialCities: CityLatest[] }) {
  const [cities, setCities] = useState<CityLatest[]>(initialCities);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [leftAd, setLeftAd] = useState<AdRecord | null>(null);
  const [rightAd, setRightAd] = useState<AdRecord | null>(null);

  useEffect(() => {
    async function loadAds() {
      try {
        const data = await listActiveAds();
        setLeftAd(data.leftAd);
        setRightAd(data.rightAd);
      } catch (err) {
        console.error("Failed to load sidebar ads:", err);
      }
    }
    loadAds();
  }, []);

  const reload = async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await getLatestByCity();
      const sorted = [...data].sort((a, b) => {
        const ta = new Date(a?.date || 0).getTime();
        const tb = new Date(b?.date || 0).getTime();
        return tb - ta;
      });
      setCities(sorted);
      setStatus("success");
    } catch (e: any) {
      setError(e?.message || "Failed to load");
      setStatus("error");
    }
  };

  const getImgSrc = (item: CityLatest) =>
    item.thumbUrl || driveThumbUrl(item.driveFileId, 2000);

  const loading = status === "loading";

  return (
    <div className="mx-auto max-w-screen-2xl px-3 md:px-6 py-6 md:py-10 text-gray-900">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex items-end justify-between flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none">
          <span className="bg-red-600 text-white px-2 py-1 rounded">ताज़ा खबरें</span>
          <span className="ml-2 text-gray-900">Latest News</span>
        </h1>
        <div className="text-xs md:text-sm text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={reload}
            className="ml-4 inline-flex items-center rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Grid Layout containing Ads & Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Ad Space - Desktop Only */}
        <div className="hidden lg:block w-[180px] xl:w-[260px] shrink-0 sticky top-20">
          {leftAd ? (
            <a href={leftAd.link || "#"} target="_blank" rel="noreferrer" className="block w-full rounded-2xl overflow-hidden shadow border hover:shadow-md transition duration-300">
              <img src={leftAd.imageUrl} alt="Left Advertisement" className="w-full h-auto object-cover" />
            </a>
          ) : (
            <AdSpace type="vertical" className="w-full" />
          )}
        </div>

        {/* Center Content Section */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          
          {/* Top Horizontal Ad - Mobile/Tablet Only */}
          <div className="block lg:hidden">
            {leftAd ? (
              <a href={leftAd.link || "#"} target="_blank" rel="noreferrer" className="block w-full rounded-2xl overflow-hidden shadow border hover:shadow-md transition duration-300 max-w-xs mx-auto">
                <img src={leftAd.imageUrl} alt="Top Advertisement" className="w-full h-auto object-cover" />
              </a>
            ) : (
              <AdSpace type="horizontal" className="w-full" />
            )}
          </div>

          {/* Loading skeletons */}
          {loading ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
                >
                  <div className="aspect-[3/4] p-3 bg-gray-50 animate-pulse" />
                  <div className="p-5">
                    <div className="h-4 w-28 bg-gray-200 rounded mb-2 animate-pulse" />
                    <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : cities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
              <div className="text-4xl mb-2">📰</div>
              <p className="text-gray-700 font-medium">No cities yet</p>
              <p className="text-gray-500 text-sm">Upload a PDF to get started.</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {cities.map((item) => {
                const cityKey = (item.city || "").toLowerCase();
                const prettyCity = titleCaseCity(item.city);
                const imgSrc = getImgSrc(item);

                return (
                  <div
                    key={item.id}
                    className="group rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition focus-within:ring-2 focus-within:ring-red-600"
                  >
                    <div className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden p-3">
                      {imgSrc ? (
                        <Zoom>
                          <img
                            src={imgSrc}
                            alt={`${prettyCity} - first page`}
                            className="w-full h-full object-contain object-center m-0 cursor-zoom-in"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const el = e.currentTarget as HTMLImageElement;
                              if (el.dataset.triedSmall !== "1" && item.driveFileId) {
                                el.dataset.triedSmall = "1";
                                el.src = driveThumbUrl(item.driveFileId, 1200)!;
                              } else {
                                el.style.display = "none";
                                const parent = el.parentElement;
                                if (parent)
                                  parent.innerHTML = `
                                    <div class="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                                      <div class="text-center">
                                        <div class="text-4xl mb-2">📄</div>
                                        <div>No preview</div>
                                      </div>
                                    </div>`;
                              }
                            }}
                          />
                        </Zoom>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                          <div className="text-center">
                            <div className="text-4xl mb-2">📄</div>
                            <div>No preview</div>
                          </div>
                        </div>
                      )}

                      <div className="absolute left-3 top-3">
                        <span className="inline-flex items-center rounded-full bg-red-600/95 text-white text-[11px] px-2 py-0.5 uppercase tracking-wide shadow">
                          {prettyCity}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <Link href={`/city/${cityKey}#${item.id}`} className="flex items-center justify-between gap-2 mb-1 group-hover:text-red-600 transition-colors">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 line-clamp-2" title={item.originalName || `${prettyCity} News`}>
                          {item.originalName ? item.originalName.replace(/\.[^/.]+$/, "") : `${prettyCity} Latest News`}
                        </h2>
                        <span className="text-[11px] text-gray-500 whitespace-nowrap">
                          {formatShortDate(item.date)}
                        </span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Horizontal Ad - Mobile/Tablet Only */}
          <div className="block lg:hidden">
            {rightAd ? (
              <a href={rightAd.link || "#"} target="_blank" rel="noreferrer" className="block w-full rounded-2xl overflow-hidden shadow border hover:shadow-md transition duration-300 max-w-xs mx-auto">
                <img src={rightAd.imageUrl} alt="Bottom Advertisement" className="w-full h-auto object-cover" />
              </a>
            ) : (
              <AdSpace type="horizontal" className="w-full" />
            )}
          </div>

        </div>

        {/* Right Ad Space - Desktop Only */}
        <div className="hidden lg:block w-[180px] xl:w-[260px] shrink-0 sticky top-20">
          {rightAd ? (
            <a href={rightAd.link || "#"} target="_blank" rel="noreferrer" className="block w-full rounded-2xl overflow-hidden shadow border hover:shadow-md transition duration-300">
              <img src={rightAd.imageUrl} alt="Right Advertisement" className="w-full h-auto object-cover" />
            </a>
          ) : (
            <AdSpace type="vertical" className="w-full" />
          )}
        </div>

      </div>
    </div>
  );
}

/* Premium Placeholder for Advertisements */
function AdSpace({ className = "", type }: { className?: string; type: "vertical" | "horizontal" }) {
  return (
    <div
      className={`border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-red-600/30 flex items-center justify-center p-4 text-center transition-all duration-300 select-none shadow-sm ${className} ${
        type === "vertical" ? "min-h-[550px] aspect-[9/16]" : "h-24 w-full"
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-1">
        <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded shadow-sm">
          Advertisement
        </span>
        <p className="text-sm text-slate-600 font-semibold">Space for Ad</p>
        <p className="text-[10px] text-slate-400">विज्ञापन के लिए स्थान</p>
      </div>
    </div>
  );
}
