import { Metadata } from 'next';
import CityClient from './CityClient';
import { getCityFiles } from '@/lib/services/publicCityService';
import { titleCaseCity } from '@/lib/utils/format';

import type { CityItem } from '@/lib/types/city';

type Props = {
  params: { city: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const prettyCity = titleCaseCity(params.city);
  return {
    title: `${prettyCity} News - Khabre Aaj Tak | ताज़ा खबरें`,
    description: `Read all the latest e-papers and news documents from ${prettyCity}. Stay updated with daily local news.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function Page({ params }: Props) {
  const city = params.city || '';
  let initialFiles: CityItem[] = [];
  try {
    initialFiles = await getCityFiles(city);
  } catch (err) {
    console.error(`[Next Server] Error fetching files for city ${city}:`, err);
  }

  return <CityClient city={city} initialFiles={initialFiles} />;
}
