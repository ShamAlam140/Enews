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

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Smart date matcher checking both ISO uploadedAt & filename dates */
function matchesSelectedDate(item: CityLatest, selectedDate: string): boolean {
  if (selectedDate === "all") return true;

  // 1. Check item.date (uploadedAt timestamp)
  if (item.date) {
    const d = new Date(item.date);
    if (!isNaN(d.getTime())) {
      const isoDate = d.toISOString().split("T")[0];
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const localDate = `${year}-${month}-${day}`;
      
      if (isoDate === selectedDate || localDate === selectedDate) {
        return true;
      }
    }
  }

  // 2. Check item.originalName (e.g. "Mumbai---06-August-2026.pdf" or "Khabre Aaj Tak 6.8.2026.pdf")
  if (item.originalName) {
    const name = item.originalName;

    // Pattern A: 6.8.2026 or 06.08.2026 or 10.7.2026
    const dotMatch = name.match(/(\d{1,2})[\.\-](\d{1,2})[\.\-](\d{4})/);
    if (dotMatch) {
      const day = String(parseInt(dotMatch[1], 10)).padStart(2, "0");
      const month = String(parseInt(dotMatch[2], 10)).padStart(2, "0");
      const year = dotMatch[3];
      const parsedDate = `${year}-${month}-${day}`;
      if (parsedDate === selectedDate) return true;
    }

    // Pattern B: 06-August-2026 or 06-Aug-2026
    const monthMap: Record<string, string> = {
      january: "01", feb: "02", february: "02", mar: "03", march: "03",
      apr: "04", april: "04", may: "05", june: "06", jun: "06",
      july: "07", jul: "07", aug: "08", august: "08", sep: "09", september: "09",
      oct: "10", october: "10", nov: "11", november: "11", dec: "12", december: "12"
    };
    const namedMatch = name.match(/(\d{1,2})[\-\_\s]+([a-zA-Z]+)[\-\_\s]+(\d{4})/);
    if (namedMatch) {
      const day = String(parseInt(namedMatch[1], 10)).padStart(2, "0");
      const monthName = namedMatch[2].toLowerCase();
      const year = namedMatch[3];
      if (monthMap[monthName]) {
        const parsedDate = `${year}-${monthMap[monthName]}-${day}`;
        if (parsedDate === selectedDate) return true;
      }
    }
  }

  return false;
}

export default function GalleryClient({ initialCities }: { initialCities: CityLatest[] }) {
  const todayStr = useMemo(() => getTodayDateString(), []);
  const yesterdayStr = useMemo(() => getYesterdayDateString(), []);

  // Today is selected by default; users can select yesterday or specific date
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
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

  // Filter cities client-side based on selected date
  const filteredCities = useMemo(() => {
    return cities.filter((item) => matchesSelectedDate(item, selectedDate));
  }, [cities, selectedDate]);

  const isToday = selectedDate === todayStr;
  const isYesterday = selectedDate === yesterdayStr;

  return (
    <div className="mx-auto max-w-screen-2xl px-3 md:px-6 py-6 md:py-10 text-gray-900">
      {/* Header & Date Filter Bar */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none flex items-center gap-2">
            <span className="bg-red-600 text-white px-2.5 py-1 rounded-md shadow-sm">
              {isToday ? "आज की खबरें" : isYesterday ? "कल की खबरें" : "पुराने अंक"}
            </span>
            <span className="text-gray-900">
              {isToday ? "Today's News" : "Archived News"}
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {`तारीख: ${new Date(selectedDate + "T00:00:00").toLocaleDateString('hi-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
          </p>
        </div>

        {/* Date Selector Tools */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
              isToday
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-white hover:shadow-xs"
            }`}
          >
            आज (Today)
          </button>
          
          <button
            onClick={() => setSelectedDate(yesterdayStr)}
            className={`px-3 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
              isYesterday
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-white hover:shadow-xs"
            }`}
          >
            कल (Yesterday)
          </button>

          {/* Calendar Date Picker */}
          <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-gray-300 shadow-xs hover:border-red-500 transition">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">तारीख चुनें:</span>
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="text-xs font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
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
          ) : filteredCities.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-slate-50/50 p-10 text-center my-4">
              <div className="text-5xl mb-3">📰</div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                इस तारीख ({new Date(selectedDate + "T00:00:00").toLocaleDateString('hi-IN')}) की कोई खबर उपलब्ध नहीं है
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                चुनी गई तारीख के लिए कोई ई-पेपर नहीं मिला। आप कल की खबरें देख सकते हैं।
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setSelectedDate(yesterdayStr)}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition shadow-sm"
                >
                  <span>कल (Yesterday) की खबरें देखें</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {filteredCities.map((item) => {
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
