'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import "react-medium-image-zoom/dist/styles.css";

import type { CityItem } from "@/lib/types/city";
import { pretty } from "@/lib/utils/format";
import { getCityFiles } from "@/lib/services/publicCityService";

const Zoom = dynamic(() => import("react-medium-image-zoom"), {
  ssr: false,
});

const PAGE_SIZE = 10;

export default function CityClient({ city, initialFiles }: { city: string; initialFiles: CityItem[] }) {
  const title = useMemo(() => pretty(city), [city]);
  
  const [files, setFiles] = useState<CityItem[]>(initialFiles);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  
  // page navigation state per fileId
  const [pageByFile, setPageByFile] = useState<Record<string, number>>(() => {
    const initialMap: Record<string, number> = {};
    initialFiles.forEach((f) => {
      initialMap[f.id] = 1;
    });
    return initialMap;
  });

  // Track loading status of individual images
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const reload = async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await getCityFiles(city);
      setFiles(data);
      const newMap: Record<string, number> = {};
      data.forEach((f) => {
        newMap[f.id] = pageByFile[f.id] || 1;
      });
      setPageByFile(newMap);
      setStatus("success");
    } catch (e: any) {
      setError(e?.message || "Failed to load");
      setStatus("error");
    }
  };

  const setFilePage = (fileId: string, page: number) => {
    setPageByFile((prev) => ({ ...prev, [fileId]: page }));
  };

  const loading = status === "loading";

  return (
    <div className="mx-auto max-w-screen-xl px-3 md:px-6 py-6 md:py-10 text-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur py-2 md:py-3 mb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border hover:bg-gray-50 text-gray-700"
              aria-label="Back to home"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg md:text-2xl font-extrabold tracking-tight">
              <span className="bg-red-600 text-white px-2 py-0.5 rounded">
                {title}
              </span>
              <span className="ml-2">— All Documents</span>
            </h1>
          </div>
          <div className="text-xs md:text-sm text-gray-500">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 text-red-700 p-3 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={reload}
            className="ml-4 inline-flex items-center rounded border border-red-300 px-2 py-1 text-xs hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="text-center text-gray-500 py-10">Loading…</div>}

      {/* Empty */}
      {!loading && files.length === 0 && (
        <div className="text-center py-10 text-gray-600 font-medium">
          No documents for {title}
        </div>
      )}

      {/* Documents */}
      <div className="grid gap-10 grid-cols-1">
        {files.map((f) => {
          const current = pageByFile[f.id] || 1;
          const total = Math.max(
            1,
            Math.ceil((f.pageImages?.length ?? 0) / PAGE_SIZE)
          );
          const slice = (f.pageImages ?? []).slice(
            (current - 1) * PAGE_SIZE,
            current * PAGE_SIZE
          );

          return (
            <article key={f.id} id={f.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden scroll-mt-24">
              {/* Info row */}
              <div className="px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3 border-b bg-gray-50">
                <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                  <span className="bg-red-600 text-white text-[11px] px-2 py-0.5 rounded uppercase font-semibold shrink-0">
                    {title}
                  </span>
                  <span className="text-gray-600 shrink-0">
                    {f.uploadedAt
                      ? new Date(f.uploadedAt).toLocaleDateString()
                      : ""}
                  </span>
                  <span
                    className="text-gray-900 ml-2 truncate font-medium max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg"
                    title={f.originalName}
                  >
                    {f.originalName ? f.originalName.replace(/\.[^/.]+$/, "") : ""}
                  </span>
                </div>

                {/* Actions (Download & Share) */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* WhatsApp Share */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `खबरें आज तक - ${f.originalName ? f.originalName.replace(/\.[^/.]+$/, "") : title} e-Paper पढ़ने के लिए क्लिक करें: ${
                        typeof window !== "undefined"
                          ? `${window.location.origin}/city/${city}#${f.id}`
                          : ""
                      }`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20ba5a] transition shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-3.5 h-3.5 fill-current">
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                    </svg>
                    WhatsApp Share
                  </a>

                  {/* PDF Download */}
                  {f.driveFileId && (
                    <a
                      href={`https://drive.google.com/uc?export=download&id=${f.driveFileId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 text-white text-xs font-semibold hover:bg-black transition shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download
                    </a>
                  )}
                </div>
              </div>

              {/* Image list */}
              <div className="p-4 flex flex-col gap-6">
                {slice.map((p) => {
                  const imageKey = `${f.id}_${p.page}`;
                  const isLoaded = loadedImages[imageKey];

                  return (
                    <div key={p.page} className="relative border bg-gray-50 rounded-lg overflow-hidden w-full min-h-[400px] md:min-h-[600px] flex items-center justify-center">
                      {/* Premium Shimmer Skeleton Loader */}
                      {!isLoaded && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 animate-pulse">
                          {/* Animated Shimmer lines */}
                          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-red-600 animate-spin mb-3"></div>
                          <span className="text-xs text-gray-500 font-semibold tracking-wider">
                            Loading Page {p.page}...
                          </span>
                        </div>
                      )}
                      
                      <Zoom>
                        <img
                          src={p.url}
                          onLoad={() => setLoadedImages(prev => ({ ...prev, [imageKey]: true }))}
                          className={`block w-full h-auto object-contain cursor-zoom-in transition-all duration-700 ease-out ${
                            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute'
                          }`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          alt={`${f.originalName || title} — page ${p.page}`}
                        />
                      </Zoom>
                      
                      <span className="absolute top-2 left-2 text-[10px] bg-black/60 text-white px-2 py-1 rounded font-semibold z-10">
                        {p.page}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="px-4 pb-4 pt-2 border-t flex justify-between items-center text-xs text-gray-700">
                <button
                  disabled={current <= 1}
                  onClick={() => setFilePage(f.id, current - 1)}
                  className="px-3 py-1.5 border rounded disabled:opacity-40 hover:bg-gray-50 font-medium transition"
                >
                  ← Prev
                </button>

                <span className="font-semibold">
                  Page {current} / {total}
                </span>

                <button
                  disabled={current >= total}
                  onClick={() => setFilePage(f.id, current + 1)}
                  className="px-3 py-1.5 border rounded disabled:opacity-40 hover:bg-gray-50 font-medium transition"
                >
                  Next →
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
