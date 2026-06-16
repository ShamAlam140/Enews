'use client';

import { useEffect, useState } from 'react';
import { useUpload } from '@/lib/hooks/useUpload';
import { listFiles, deleteFile } from '@/lib/services/fileService';
import type { FileRecord } from '@/lib/types/admin';

export default function UploadImages() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const { upload, isUploading, progress } = useUpload();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const cities = [
    'mumbai', 'delhi', 'noida', 'gurugram', 'bangalore', 'chennai', 'jaipur', 'hyderabad', 'kolkata', 'bhopal',
    'ahmedabad', 'pune', 'surat', 'lucknow', 'kanpur',
  ];
  const [selectedCity, setSelectedCity] = useState<string>('mumbai');
  const [filterCity, setFilterCity] = useState<string>('all');

  function formatDateTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function refresh() {
    try {
      const list = await listFiles();
      setFiles(list);
    } catch (err) {
      console.error('Failed to load files:', err);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    try {
      // Expect exactly one PDF
      const saved = await upload([selected[0]], selectedCity);
      setFiles((prev) => [...saved, ...prev]);
    } catch (err) {
      console.error(err);
      alert('Upload failed. Please try again.');
    } finally {
      e.target.value = '';
    }
  }

  async function onDelete(id: string) {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error(err);
      alert('Delete failed. Please try again.');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const visibleFiles = files.filter((f) => (filterCity === 'all' ? true : (f.city || '') === filterCity));

  const isPdf = (mime?: string, url?: string) =>
    (mime && mime.toLowerCase().includes('pdf')) || (url && url.toLowerCase().endsWith('.pdf'));

  return (
    <div className="grid gap-6 text-gray-900">
      {/* Upload card */}
      <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Upload New PDF</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">City:</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {cities.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <input
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-black cursor-pointer text-sm text-gray-500"
            type="file"
            accept="application/pdf"
            onChange={onSelect}
          />

          {isUploading && (
            <span className="inline-flex items-center gap-2 text-sm text-gray-700 font-semibold">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
              Uploading... {typeof progress === 'number' ? `${progress}%` : null}
            </span>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-gray-600 font-medium">Total PDFs: {files.length}</div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter by city:</label>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">All</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {visibleFiles.map((f) => {
          const deleting = deletingIds.has(f.id);
          return (
            <div
              key={f.id}
              className="relative border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col justify-between"
              aria-busy={deleting ? 'true' : 'false'}
            >
              {/* Overlay loader when deleting */}
              {deleting && (
                <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center">
                  <span className="inline-block h-6 w-6 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
                  <span className="mt-2 text-xs text-gray-700 font-semibold">Deleting…</span>
                </div>
              )}

              <div className="p-4 flex-1">
                {isPdf(f.mimetype, f.url) ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-800 font-semibold truncate max-w-[60%]" title={f.originalName || f.filename}>
                      {f.originalName || f.filename || 'Document.pdf'}
                    </div>
                    {f.url ? (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-gray-900 text-white hover:bg-black font-semibold"
                      >
                        Open PDF
                      </a>
                    ) : null}
                  </div>
                ) : (
                  f.url ? (
                    <img src={f.url} alt={f.originalName || ''} className="w-full h-40 object-cover rounded" />
                  ) : (
                    <div className="text-sm text-gray-700 font-medium">{f.filename}</div>
                  )
                )}
              </div>

              <div className="px-4 pb-3 pt-2 bg-gray-50 border-t space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-700 font-medium truncate max-w-[70%]" title={f.originalName || f.filename}>
                    {f.originalName || f.filename}
                  </div>
                  <button
                    onClick={() => onDelete(f.id)}
                    disabled={deleting}
                    className={`text-sm font-semibold hover:underline ${
                      deleting ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'
                    }`}
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
                <div className="text-[11px] text-gray-500">
                  Uploaded: {formatDateTime(f.uploadedAt)}
                </div>
                {f.city && (
                  <div className="text-[11px] text-gray-500">
                    City: {f.city.charAt(0).toUpperCase() + f.city.slice(1)}
                  </div>
                )}
                <div className="text-[11px] text-gray-500">
                  Type: {f.mimetype || '—'}
                </div>
                <div className="text-[11px] text-gray-500 truncate">
                  ID: <span className="font-mono text-[10px]">{f.id}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
