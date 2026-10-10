export interface EventModel {
  id?: number;
  userId: number;
  title: string;
  description?: string;
  startTime: string; // Formato ISO / TIMESTAMPTZ
  endTime: string;
  timezone: string; // Ej: 'America/Bogota'
}