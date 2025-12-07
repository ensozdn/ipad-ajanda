export interface Event {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color: string;
  description?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  notificationEnabled?: boolean;
  notificationTime?: number; // Kaç dakika önce bildirim (örn: 15, 30, 60)
}

export type ViewMode = 'month' | 'week' | 'day' | 'list' | 'documents';

export interface Document {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  imageData: string; // base64 encoded canvas data
  background?: 'plain' | 'lined' | 'grid'; // Sayfa türü
  isFavorite?: boolean; // Favori mi?
}
