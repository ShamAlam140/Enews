'use client';

import { useEffect, useState } from 'react';
import { listAllAds, uploadAd, toggleAdActive, deleteAd, type AdRecord } from '@/lib/services/adService';

export default function ManageAds() {
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  
  // Form State
  const [position, setPosition] = useState<'left' | 'right'>('left');
  const [link, setLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function fetchAds() {
    setLoading(true);
    try {
      const data = await listAllAds();
      setAds(data);
    } catch (err) {
      console.error('Failed to load ads:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAds();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please choose an ad image file to upload.');
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const saved = await uploadAd(selectedFile, position, link, (percent) => {
        setProgress(percent);
      });
      setAds((prev) => [saved, ...prev]);
      
      // Reset form
      setLink('');
      setSelectedFile(null);
      const fileInput = document.getElementById('ad-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      alert('Advertisement uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to upload ad. Please verify your connection.');
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  async function handleToggle(id: string) {
    try {
      const updated = await toggleAdActive(id);
      setAds((prev) => prev.map((ad) => (ad._id === id ? updated : ad)));
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update status.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this ad? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteAd(id);
      setAds((prev) => prev.filter((ad) => ad._id !== id));
    } catch (err) {
      console.error('Failed to delete ad:', err);
      alert('Failed to delete ad.');
    }
  }

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

  return (
    <div className="grid gap-6 text-gray-900">
      {/* Header Description */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Advertisements</h1>
        <p className="text-sm text-slate-500">Upload and position custom ad banners on the landing page</p>
      </div>

      {/* Upload Form Card */}
      <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Upload New Advertisement Banner</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Position Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Ad Position:</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as 'left' | 'right')}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="left">Left Sidebar Ad (Home)</option>
                <option value="right">Right Sidebar Ad (Home)</option>
              </select>
            </div>

            {/* Link Input */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Redirect Link URL (Optional):</label>
              <input
                type="url"
                placeholder="https://example.com/ad-landing-page"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            
            {/* File Pick */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Choose Ad Banner Image:</label>
              <input
                id="ad-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-black cursor-pointer text-sm text-gray-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3">
              {uploading && (
                <span className="inline-flex items-center gap-2 text-sm text-gray-700 font-semibold">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
                  Uploading... {progress !== null ? `${progress}%` : ''}
                </span>
              )}
              <button
                type="submit"
                disabled={uploading}
                className="h-10 px-5 rounded-md bg-gray-900 text-white hover:bg-black font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading…' : 'Upload Advertisement'}
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* Ads Grid */}
      <div className="space-y-3">
        <div className="text-sm text-gray-600 font-medium">Active & Saved Ads ({ads.length})</div>
        
        {loading ? (
          <div className="text-center text-slate-500 py-10 bg-white rounded-xl border">Loading saved ads...</div>
        ) : ads.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed p-8">
            <div className="text-3xl mb-2">📢</div>
            <p className="font-semibold text-slate-700">No advertisements uploaded yet</p>
            <p className="text-xs text-slate-400 mt-1">Upload a vertical image to place inside left or right banner columns.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {ads.map((ad) => (
              <div key={ad._id} className="bg-white rounded-xl border overflow-hidden shadow-sm flex flex-col justify-between">
                
                {/* Image display */}
                <div className="relative aspect-[9/12] bg-slate-50 border-b flex items-center justify-center overflow-hidden p-2">
                  <img
                    src={ad.imageUrl}
                    alt={`${ad.position} ad`}
                    className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className={`absolute top-3 left-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
                    ad.position === 'left' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ad.position.toUpperCase()} SIDE
                  </span>
                </div>

                {/* Details Footer */}
                <div className="p-4 space-y-2">
                  {ad.link && (
                    <div className="text-xs text-slate-500 truncate">
                      <span className="font-semibold text-slate-700">Link: </span>
                      <a href={ad.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {ad.link}
                      </a>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">
                    Uploaded: {formatDateTime(ad.uploadedAt)}
                  </div>
                  
                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    
                    {/* Toggle Active status */}
                    <button
                      onClick={() => handleToggle(ad._id)}
                      className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold shadow-sm border transition-colors ${
                        ad.isActive
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {ad.isActive ? 'Active | de-activate' : 'Inactive | activate'}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(ad._id)}
                      className="text-xs text-red-600 font-semibold hover:underline"
                    >
                      Delete Ad
                    </button>

                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
