import { Metadata } from 'next';
import GalleryClient from './GalleryClient';
import { getLatestByCity } from '@/lib/services/publicFileService';
import type { CityLatest } from '@/lib/types/files';

export const metadata: Metadata = {
  title: 'SusaNews - ताज़ा खबरें | Latest e-Papers & News Documents',
  description: 'Read the latest e-papers and news documents from SusaNews. Find daily news and updates organized by city.',
};

// Revalidate this page at most every 60 seconds for high performance ISR
export const revalidate = 60;

export default async function Page() {
  let initialCities: CityLatest[] = [];
  try {
    initialCities = await getLatestByCity();
    // Sort by date desc
    initialCities = [...initialCities].sort((a, b) => {
      const ta = new Date(a?.date || 0).getTime();
      const tb = new Date(b?.date || 0).getTime();
      return tb - ta;
    });
  } catch (err) {
    console.error('[Next Server] Error fetching cities on server:', err);
  }

  return <GalleryClient initialCities={initialCities} />;
}
