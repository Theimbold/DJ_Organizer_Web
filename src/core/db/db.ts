import Dexie, { Table } from 'dexie';
import { Track } from '../../types/types';

export class DJOrganizerDB extends Dexie {
  tracks!: Table<Track>;
  settings!: Table<{ key: string; value: any }>;

  constructor() {
    super('DJOrganizerDB');
    this.version(3).stores({
      // Primary key ++id, and indexes for other properties.
      // The fileHandle object cannot be indexed directly.
      tracks: '++id, title, artist, status, genre, mood, original_filename',
      settings: 'key',
    });
  }
}

export const db = new DJOrganizerDB();