export type PageImage = {
  page: number;
  url: string;
};

export type CityItem = {
  id: string;
  city?: string;
  originalName?: string;
  uploadedAt?: string;
  pageCount?: number;
  driveFileId?: string | null;
  pageImages: PageImage[];
  viewerUrl?: string | null;
};
