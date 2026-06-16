import { http } from './http';
import type { FileRecord } from '../types/admin';

export async function uploadFiles(
  files: File[],
  onStep?: (index: number, total: number) => void,
  city?: string,
  onProgressPercent?: (percent: number) => void
) {
  const total = files.length;
  const saved: FileRecord[] = [];
  if (total === 0) return saved;

  if (total === 1) {
    const form = new FormData();
    form.append('file', files[0]); // PDF
    if (city) form.append('city', city);
    const res = await http.post<{ file: FileRecord }>(`/files/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) {
          const percent = Math.round((e.loaded / e.total) * 100);
          if (onProgressPercent) onProgressPercent(percent);
        }
      },
    });
    saved.push(res.data.file);
    if (onStep) onStep(0, total);
    return saved;
  }

  const form = new FormData();
  files.forEach((f) => form.append('files', f)); // multiple PDFs if ever needed
  if (city) form.append('city', city);
  const res = await http.post<{ files: FileRecord[] }>(`/files/upload-multiple`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total) {
        const percent = Math.round((e.loaded / e.total) * 100);
        if (onProgressPercent) onProgressPercent(percent);
      }
    },
  });
  if (onStep) onStep(total - 1, total);
  return res.data.files;
}

export async function listFiles() {
  const res = await http.get<{ files: FileRecord[] }>(`/files`);
  return res.data.files;
}

export async function deleteFile(id: string) {
  await http.delete(`/files/${id}`);
}

export async function listFilesByCity(params: { city: string; page?: number; limit?: number }) {
  const { city, page = 1, limit = 20 } = params;
  const res = await http.get<{ files: FileRecord[]; total: number; page: number; limit: number }>(
    `/files`,
    { params: { city, page, limit } }
  );
  return res.data;
}

// 🔹 NEW: get one file by id
export async function getFile(id: string) {
  const res = await http.get<{ file: FileRecord }>(`/files/${id}`);
  return res.data.file;
}

// Get page image URLs (from backend / Cloudinary)
export async function getFilePages(
  id: string,
  opts?: { max?: number; width?: number; quality?: string }
) {
  const res = await http.get<{ pages: string[]; count: number; served: number }>(
    `/files/${id}/pages`,
    { params: opts || {} }
  );
  return res.data;
}
