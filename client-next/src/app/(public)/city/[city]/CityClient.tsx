'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import type { CityItem } from "@/lib/types/city";
import { pretty } from "@/lib/utils/format";
import { getCityFiles } from "@/lib/services/publicCityService";

const PAGE_SIZE = 10;

type LightboxState = {
  fileId: string | null;
  src: string | null;
  page: number | null;
  name: string | null;
};

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

  const [lightbox, setLightbox] = useState<LightboxState>({
    fileId: null,
    src: null,
    page: null,
    name: null,
  });

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

  const openLightbox = (payload: LightboxState) => {
    setLightbox({
      fileId: payload.fileId ?? null,
      src: payload.src ?? null,
      page: payload.page ?? null,
      name: payload.name ?? null,
    });
  };

  const closeLightbox = () => {
    setLightbox({ fileId: null, src: null, page: null, name: null });
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
            <article key={f.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              {/* Info row */}
              <div className="px-4 py-3 text-sm flex items-center gap-2 border-b bg-gray-50">
                <span className="bg-red-600 text-white text-[11px] px-2 py-0.5 rounded uppercase font-semibold">
                  {title}
                </span>
                <span className="text-gray-600">
                  {f.uploadedAt
                    ? new Date(f.uploadedAt).toLocaleDateString()
                    : ""}
                </span>
                <span
                  className="text-gray-900 ml-2 truncate font-medium flex-1"
                  title={f.originalName}
                >
                  {f.originalName}
                </span>
              </div>

              {/* Image list */}
              <div className="p-4 flex flex-col gap-6">
                {slice.map((p) => (
                  <Zoom key={p.page}>
                    <button
                      className="relative border bg-white rounded-lg overflow-hidden text-left w-full block focus:outline-none focus:ring-2 focus:ring-red-600"
                      onClick={() =>
                        openLightbox({
                          fileId: f.id,
                          src: p.url,
                          page: p.page,
                          name: f.originalName ?? null,
                        })
                      }
                    >
                      <img
                        src={p.url}
                        className="block w-full h-auto object-contain cursor-zoom-in"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        alt={`${f.originalName || title} — page ${p.page}`}
                      />
                      <span className="absolute top-2 left-2 text-[10px] bg-black/60 text-white px-2 py-1 rounded font-semibold">
                        {p.page}
                      </span>
                    </button>
                  </Zoom>
                ))}
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

      {/* Lightbox */}
      {lightbox.src && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-6"
          onClick={closeLightbox}
          role="dialog"
          aria-label="Image viewer"
        >
          <Zoom>
            <img
              src={lightbox.src}
              className="max-w-full max-h-full rounded-lg shadow-2xl cursor-zoom-in"
              onClick={(e) => e.stopPropagation()}
              alt={lightbox.name ?? "Document page"}
            />
          </Zoom>
        </div>
      )}
    </div>
  );
}
