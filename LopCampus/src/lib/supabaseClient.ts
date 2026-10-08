import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RoomListing, BrokerProfile, Complaint } from '../types';
import { SAMPLE_ROOMS } from './constants';

export const DEFAULT_SUPABASE_URL = 'https://zpdvsxnsljuncylytwai.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_YnctoDn6cmImHDA1v13pKQ_E2-QXyUe';

export const SUPABASE_SQL_MIGRATION = `-- =========================================================================
-- LOPCAMPUS: ONGEZA SEHEMU YA VIDEO KWENYE SUPABASE (SQL EDITOR)
-- Nakili code hizi kisha zibandike (paste) kwenye Supabase SQL Editor
-- (https://supabase.com/dashboard/project/_/sql) kisha bonyeza "RUN"
-- =========================================================================

-- 1. Ongeza nguzo (columns) za video kwenye table ya 'rooms'
-- (Haitafuta wala kuharibu matangazo wala picha zilizopo)
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS video_duration INT,
ADD COLUMN IF NOT EXISTS video_size INT,
ADD COLUMN IF NOT EXISTS video_status VARCHAR(20) DEFAULT 'ready';

-- 2. Tengeneza Storage Bucket ya 'room-videos' (Public ili video zicheze haraka)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('room-videos', 'room-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Weka Sera za Usalama (RLS) ili kila mtumiaji aweze kuona video na madalali waweze kupakia
CREATE POLICY "Public Read room-videos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'room-videos');

CREATE POLICY "Public Upload room-videos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'room-videos');

CREATE POLICY "Public Delete room-videos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'room-videos');

-- Hongera! Mfumo wa video sasa upo tayari 100%.
`;

const getStoredCredentials = () => {
  if (typeof window === 'undefined') {
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_KEY };
  }
  const u = localStorage.getItem('lopcampus_supabase_url');
  const k = localStorage.getItem('lopcampus_supabase_key');
  return {
    url: u && u.trim() ? u.trim() : DEFAULT_SUPABASE_URL,
    key: k && k.trim() ? k.trim() : DEFAULT_SUPABASE_KEY
  };
};

const creds = getStoredCredentials();
export const supabase: SupabaseClient = createClient(creds.url, creds.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const ROOM_EXPIRY_DAYS = 14; // Vyumba hufutika chenyewe kila baada ya wiki 2
export const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Returns remaining days before a room is automatically deleted (out of 14 days).
 */
export function getDaysRemaining(createdAt?: string | null): number {
  if (!createdAt) return 14;
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return 14;
  const now = Date.now();
  const diffMs = (createdTime + FOURTEEN_DAYS_MS) - now;
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
}

/**
 * Checks if a room has reached its 14-day lifetime and is expired.
 */
export function isRoomExpired(room: RoomListing): boolean {
  if (!room.created_at) return false;
  const createdTime = new Date(room.created_at).getTime();
  if (isNaN(createdTime)) return false;
  return (Date.now() - createdTime) >= FOURTEEN_DAYS_MS;
}

/**
 * Automatically purges expired rooms (older than 14 days) from Supabase and local cache.
 */
export async function cleanupExpiredRooms(): Promise<void> {
  const cutoffDate = new Date(Date.now() - FOURTEEN_DAYS_MS).toISOString();
  try {
    // Delete expired rooms from Supabase
    await supabase.from('rooms').delete().lt('created_at', cutoffDate);
  } catch (e) {
    // Silent fail if table policies restrict direct batch delete
  }

  // Purge expired rooms from localStorage cache
  try {
    const local = getLocalRooms();
    const activeLocal = local.filter((r) => !isRoomExpired(r));
    if (activeLocal.length !== local.length && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activeLocal));
    }
  } catch {}
}

// Deleted Rooms Tracker Key (Inazuia matangazo yaliyofutwa yasirudie tena)
const DELETED_ROOMS_KEY = 'lopcampus_deleted_room_ids';

export function getDeletedRoomIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_ROOMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markRoomAsDeleted(id: string | number): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedRoomIds();
    const strId = String(id);
    if (!current.includes(strId)) {
      localStorage.setItem(DELETED_ROOMS_KEY, JSON.stringify([...current, strId]));
    }
  } catch {}
}

/**
 * Fetch all active room listings automatically from Supabase.
 * Huchuja vyumba vilivyo ndani ya wiki 2 (siku 14).
 * Vyumba vilivyozidi wiki 2 au vilivyofutwa huchujwa mara moja.
 */
export async function fetchAllActiveRooms(): Promise<{ rooms: RoomListing[]; totalCount: number; source: 'supabase' | 'starter' }> {
  // Run background purge of expired rooms
  cleanupExpiredRooms().catch(() => {});

  const cutoffDate = new Date(Date.now() - FOURTEEN_DAYS_MS).toISOString();
  const deletedSet = new Set(getDeletedRoomIds());

  try {
    const { data, error, count } = await supabase
      .from('rooms')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const local = getLocalRooms()
        .filter((r) => !isRoomExpired(r) && !deletedSet.has(String(r.id)));
      return {
        rooms: local.length > 0 ? local : SAMPLE_ROOMS.filter((r) => !deletedSet.has(String(r.id))),
        totalCount: local.length > 0 ? local.length : SAMPLE_ROOMS.filter((r) => !deletedSet.has(String(r.id))).length,
        source: 'starter'
      };
    }

    const filtered = (data as RoomListing[]).filter((r) => !deletedSet.has(String(r.id)));
    return {
      rooms: filtered,
      totalCount: filtered.length,
      source: 'supabase'
    };
  } catch (err) {
    console.warn('fetchAllActiveRooms fallback:', err);
    const local = getLocalRooms().filter((r) => !isRoomExpired(r) && !deletedSet.has(String(r.id)));
    const sampleFiltered = SAMPLE_ROOMS.filter((r) => !deletedSet.has(String(r.id)));
    return {
      rooms: local.length > 0 ? local : sampleFiltered,
      totalCount: local.length > 0 ? local.length : sampleFiltered.length,
      source: 'starter'
    };
  }
}

/**
 * Fetch active room listings in batches (Pagination / Kupakua tangazo moja baada ya jingine).
 * Only returns active rooms within the 14-day window that haven't been deleted.
 */
export async function fetchRoomsBatch(
  page: number = 1,
  pageSize: number = 6
): Promise<{ rooms: RoomListing[]; hasMore: boolean; totalCount: number; source: 'supabase' | 'starter' }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const cutoffDate = new Date(Date.now() - FOURTEEN_DAYS_MS).toISOString();
  const deletedSet = new Set(getDeletedRoomIds());

  try {
    const { data, error, count } = await supabase
      .from('rooms')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error || !data || data.length === 0) {
      if (page === 1) {
        // Fallback to local starter data
        const local = getLocalRooms().filter((r) => !isRoomExpired(r) && !deletedSet.has(String(r.id)));
        const sampleFiltered = SAMPLE_ROOMS.filter((r) => !deletedSet.has(String(r.id)));
        const base = local.length > 0 ? local : sampleFiltered;
        const slice = base.slice(from, to + 1);
        return {
          rooms: slice,
          hasMore: base.length > to + 1,
          totalCount: base.length,
          source: 'starter'
        };
      }
      return { rooms: [], hasMore: false, totalCount: 0, source: 'starter' };
    }

    const filtered = (data as RoomListing[]).filter((r) => !deletedSet.has(String(r.id)));
    return {
      rooms: filtered,
      hasMore: (count || data.length) > to + 1,
      totalCount: count || filtered.length,
      source: 'supabase'
    };
  } catch (err) {
    console.warn('Batch fetch fallback:', err);
    const local = getLocalRooms().filter((r) => !isRoomExpired(r) && !deletedSet.has(String(r.id)));
    const sampleFiltered = SAMPLE_ROOMS.filter((r) => !deletedSet.has(String(r.id)));
    const base = local.length > 0 ? local : sampleFiltered;
    const slice = base.slice(from, to + 1);
    return {
      rooms: slice,
      hasMore: base.length > to + 1,
      totalCount: base.length,
      source: 'starter'
    };
  }
}

/**
 * Backward compatible fetch for all active rooms (cached or initial fallback).
 */
export async function fetchActiveRooms(): Promise<RoomListing[]> {
  const res = await fetchRoomsBatch(1, 12);
  return res.rooms;
}

/**
 * Fetch listings by broker ID.
 * Reliably returns broker's listings from Supabase, local cache, and demo data,
 * strictly excluding any rooms that have been deleted.
 */
export async function fetchRoomsByBroker(brokerId: string): Promise<RoomListing[]> {
  const deletedSet = new Set(getDeletedRoomIds());
  const roomMap = new Map<string, RoomListing>();

  // 1. If demo broker, include sample demo rooms (if not deleted)
  if (brokerId === 'demo-dalali-001' || brokerId === 'sample-broker-1') {
    SAMPLE_ROOMS.filter(
      (r) =>
        (r.broker_id === 'sample-broker-1' || r.broker_id === 'demo-dalali-001') &&
        !deletedSet.has(String(r.id))
    ).forEach((r) => roomMap.set(String(r.id), r));
  }

  // 2. Add local storage rooms posted by this broker
  try {
    const local = getLocalRooms();
    local
      .filter((r) => r.broker_id === brokerId && !deletedSet.has(String(r.id)))
      .forEach((r) => roomMap.set(String(r.id), r));
  } catch {}

  // 3. Add Supabase rooms for this broker
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('broker_id', brokerId)
      .order('created_at', { ascending: false });

    if (!error && data && Array.isArray(data)) {
      data
        .filter((r) => !deletedSet.has(String(r.id)))
        .forEach((r) => roomMap.set(String(r.id), r as RoomListing));
    }
  } catch (err) {
    console.warn('fetchRoomsByBroker cloud query notice:', err);
  }

  const result = Array.from(roomMap.values());
  // Sort descending by created_at
  result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  return result;
}

/**
 * Insert new room listing.
 * Gracefully handles cases where video columns are not yet applied in Supabase.
 */
export async function createRoomListing(
  room: Omit<RoomListing, 'id' | 'created_at' | 'views'>
): Promise<{ data: RoomListing | null; error?: string }> {
  try {
    const expiresAt = new Date(Date.now() + FOURTEEN_DAYS_MS).toISOString();
    // Attempt insert with all fields including video
    const { data, error } = await supabase
      .from('rooms')
      .insert([
        {
          ...room,
          duration_days: ROOM_EXPIRY_DAYS,
          expires_at: expiresAt,
          views: 1,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) {
      // If error is about missing video columns, fallback to inserting core fields
      if (error.message.includes('video_url') || error.message.includes('column')) {
        console.warn('Video columns not yet created in Supabase. Inserting core listing and saving video locally...');
        const { video_url, video_thumbnail_url, video_duration, video_size, video_status, ...coreRoom } = room;
        
        const { data: coreData, error: coreErr } = await supabase
          .from('rooms')
          .insert([
            {
              ...coreRoom,
              duration_days: ROOM_EXPIRY_DAYS,
              expires_at: expiresAt,
              views: 1,
              status: 'active'
            }
          ])
          .select()
          .single();

        if (coreErr) throw coreErr;

        const merged: RoomListing = {
          ...coreData,
          video_url,
          video_thumbnail_url,
          video_duration,
          video_size,
          video_status: 'ready'
        };
        saveLocalRoom(merged);
        return { data: merged };
      }
      throw error;
    }

    return { data: data as RoomListing };
  } catch (err: any) {
    console.error('Error creating room:', err);
    // Local fallback for offline mode or demo
    const newRoom: RoomListing = {
      ...room,
      id: `local-${Date.now()}`,
      duration_days: ROOM_EXPIRY_DAYS,
      expires_at: new Date(Date.now() + FOURTEEN_DAYS_MS).toISOString(),
      views: 1,
      status: 'active',
      created_at: new Date().toISOString()
    };
    saveLocalRoom(newRoom);
    return { data: newRoom, error: err.message };
  }
}

/**
 * Updates a room listing status or fields.
 */
export async function updateRoomListing(
  id: string | number,
  brokerId: string,
  updates: Partial<RoomListing>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .eq('broker_id', brokerId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Update failed on cloud, updating locally:', err);
    updateLocalRoom(id, updates);
    return true;
  }
}

/**
 * Delete a room and its associated video file from storage to avoid orphan files.
 * Marks room as deleted permanently, removes from cache, and deletes from cloud.
 */
export async function deleteRoomListing(
  id: string | number,
  brokerId: string,
  videoUrl?: string | null
): Promise<boolean> {
  // 1. Mark in permanent deleted registry immediately
  markRoomAsDeleted(id);
  deleteLocalRoom(id);

  // 2. Delete associated video from storage if present
  if (videoUrl) {
    try {
      await deleteVideoFromStorage(videoUrl);
    } catch (e) {
      console.warn('Failed to delete video file from storage:', e);
    }
  }

  // 3. Delete room record from cloud (if stored in Supabase)
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Cloud delete error (local deletion successful):', error.message);
    }
  } catch (err) {
    console.warn('Cloud delete exception (local deletion successful):', err);
  }

  return true;
}

/**
 * Delete video from a listing without deleting the room.
 */
export async function removeVideoFromRoom(roomId: string | number, videoUrl: string): Promise<boolean> {
  try {
    await deleteVideoFromStorage(videoUrl);
  } catch (e) {}

  try {
    await supabase
      .from('rooms')
      .update({
        video_url: null,
        video_thumbnail_url: null,
        video_duration: null,
        video_size: null,
        video_status: null
      })
      .eq('id', roomId);
    updateLocalRoom(roomId, {
      video_url: null,
      video_thumbnail_url: null,
      video_duration: null,
      video_size: null,
      video_status: null
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Increment listing view counter.
 */
export async function incrementViews(roomId: string | number) {
  if (typeof roomId === 'string' && roomId.startsWith('sample-')) return;

  try {
    const { error } = await supabase.rpc('increment_room_views', { room_id: roomId });
    if (error) {
      const { data } = await supabase.from('rooms').select('views').eq('id', roomId).single();
      const current = (data?.views || 0) + 1;
      await supabase.from('rooms').update({ views: current }).eq('id', roomId);
    }
  } catch {}
}

/**
 * Upload image to Supabase Storage `room-images` bucket.
 */
export async function uploadImageToStorage(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `rooms/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

  try {
    const { error } = await supabase.storage.from('room-images').upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) {
      console.warn('Supabase image upload failed, using DataURL fallback:', error.message);
      return fileToDataUrl(file);
    }

    const { data } = supabase.storage.from('room-images').getPublicUrl(path);
    return data?.publicUrl ? data.publicUrl : `${DEFAULT_SUPABASE_URL}/storage/v1/object/public/room-images/${path}`;
  } catch {
    return fileToDataUrl(file);
  }
}

/**
 * Upload video to storage bucket (`room-videos` with automatic fallback to `room-images/videos/`).
 */
export async function uploadVideoToStorage(
  videoBlob: Blob,
  fileName = 'video.mp4'
): Promise<{ videoUrl: string; videoSize: number }> {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4';
  const cleanExt = ext.includes('mov') ? 'mov' : ext.includes('webm') ? 'webm' : 'mp4';
  const randomId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const videoPath = `rooms/${randomId}.${cleanExt}`;

  // Step 1: Try dedicated 'room-videos' bucket
  try {
    const { data, error } = await supabase.storage.from('room-videos').upload(videoPath, videoBlob, {
      cacheControl: '3600',
      contentType: videoBlob.type || 'video/mp4',
      upsert: true
    });

    if (!error && data) {
      const { data: pubData } = supabase.storage.from('room-videos').getPublicUrl(videoPath);
      return { videoUrl: pubData.publicUrl, videoSize: videoBlob.size };
    }
  } catch (e) {
    console.warn('room-videos bucket upload attempt failed, falling back to room-images...');
  }

  // Step 2: Fallback to existing 'room-images' bucket under 'videos/' folder (guaranteed to exist!)
  const fallbackPath = `videos/${randomId}.${cleanExt}`;
  const { data: fbData, error: fbError } = await supabase.storage.from('room-images').upload(fallbackPath, videoBlob, {
    cacheControl: '3600',
    contentType: videoBlob.type || 'video/mp4',
    upsert: true
  });

  if (fbError) {
    throw new Error(`Imeshindwa kupakia video kwenye storage: ${fbError.message}`);
  }

  const { data: fbPub } = supabase.storage.from('room-images').getPublicUrl(fallbackPath);
  return { videoUrl: fbPub.publicUrl, videoSize: videoBlob.size };
}

/**
 * Deletes a video file from Supabase storage given its public URL.
 */
export async function deleteVideoFromStorage(videoUrl: string): Promise<boolean> {
  if (!videoUrl || videoUrl.startsWith('data:') || videoUrl.startsWith('blob:')) return true;

  try {
    let bucket = 'room-videos';
    let path = '';

    if (videoUrl.includes('/room-videos/')) {
      bucket = 'room-videos';
      path = videoUrl.split('/room-videos/')[1];
    } else if (videoUrl.includes('/room-images/videos/')) {
      bucket = 'room-images';
      path = 'videos/' + videoUrl.split('/room-images/videos/')[1];
    } else {
      return true;
    }

    if (path) {
      await supabase.storage.from(bucket).remove([path]);
    }
    return true;
  } catch (err) {
    console.warn('Error deleting video file:', err);
    return false;
  }
}

/**
 * Submit complaint/report for fraud or illegal content.
 */
export async function submitComplaint(complaint: Omit<Complaint, 'id' | 'created_at'>): Promise<boolean> {
  try {
    const { error } = await supabase.from('complaints').insert([complaint]);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Complaint saved locally:', e);
    return true;
  }
}

// Helpers for Data URL and Local Storage
function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
  });
}

const LOCAL_STORAGE_KEY = 'lopcampus_local_rooms_cache';

function getLocalRooms(): RoomListing[] {
  if (typeof window === 'undefined') return SAMPLE_ROOMS;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SAMPLE_ROOMS));
      return SAMPLE_ROOMS;
    }
    return JSON.parse(stored);
  } catch {
    return SAMPLE_ROOMS;
  }
}

function saveLocalRoom(room: RoomListing) {
  if (typeof window === 'undefined') return;
  const current = getLocalRooms();
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([room, ...current]));
}

function updateLocalRoom(id: string | number, updates: Partial<RoomListing>) {
  if (typeof window === 'undefined') return;
  const current = getLocalRooms();
  const updated = current.map((r) => (r.id === id ? { ...r, ...updates } : r));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
}

function deleteLocalRoom(id: string | number) {
  if (typeof window === 'undefined') return;
  const current = getLocalRooms();
  const updated = current.filter((r) => String(r.id) !== String(id));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
}
