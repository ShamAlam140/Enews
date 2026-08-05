import { http } from './http';

export type AdRecord = {
  _id: string;
  imageUrl: string;
  position: 'left' | 'right';
  link?: string;
  driveFileId?: string;
  isActive: boolean;
  uploadedAt: string;
};

export type ActiveAdsResponse = {
  leftAd: AdRecord | null;
  rightAd: AdRecord | null;
};

// Fetch active ads for left and right sidebars (Public)
export async function listActiveAds() {
  const res = await http.get<{ success: boolean; leftAd: AdRecord | null; rightAd: AdRecord | null }>('/ads');
  return { leftAd: res.data.leftAd, rightAd: res.data.rightAd };
}

// Fetch all ads (Admin dashboard)
export async function listAllAds() {
  const res = await http.get<{ success: boolean; ads: AdRecord[] }>('/ads/all');
  return res.data.ads;
}

// Upload new Ad
export async function uploadAd(
  file: File,
  position: 'left' | 'right',
  link = '',
  onProgressPercent?: (percent: number) => void
) {
  const form = new FormData();
  form.append('file', file);
  form.append('position', position);
  if (link) form.append('link', link);

  const res = await http.post<{ success: boolean; ad: AdRecord }>('/ads/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgressPercent) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgressPercent(percent);
      }
    },
  });

  return res.data.ad;
}

// Toggle ad active status
export async function toggleAdActive(id: string) {
  const res = await http.put<{ success: boolean; ad: AdRecord }>(`/ads/${id}/toggle`);
  return res.data.ad;
}

// Delete ad
export async function deleteAd(id: string) {
  await http.delete(`/ads/${id}`);
}
