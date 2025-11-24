import { getDb } from '../db';
import type { VideoMetadata } from '../../lib/types';

export function getVideoMetadata(id: string): VideoMetadata | null {
  const db = getDb();
  const stmt = db.prepare('SELECT metadata FROM video_metadata WHERE id = ?');
  stmt.bind([id]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject();
    const metadataStr = row.metadata as string;
    stmt.free();
    
    try {
      const metadata = JSON.parse(metadataStr);

      return {
        id: id,
        title: metadata.title,
        uploader: metadata.uploader,
        uploader_url: metadata.uploader_url,
      };
    } catch (e) {
      console.error('Failed to parse video metadata', e);
      return null;
    }
  }
  
  stmt.free();
  return null;
}
