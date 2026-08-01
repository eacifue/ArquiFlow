export interface SiteLogPhoto {
  id: string;
  fileUrl: string;
  caption: string | null;
}

export interface SiteLogEntry {
  id: string;
  projectId: string;
  date: string;
  notes: string | null;
  weather: string | null;
  authorName: string;
  photos: SiteLogPhoto[];
}

export interface CreateSiteLogEntryInput {
  date: string;
  notes?: string;
  weather?: string;
  photos: File[];
}
