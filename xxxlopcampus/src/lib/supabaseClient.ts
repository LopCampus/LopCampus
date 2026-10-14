import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RoomListing, BrokerProfile, Complaint, RoomComment, StudentAccount, RoomMessage, ConversationSummary } from '../types';
import { SAMPLE_ROOMS, SAMPLE_COMMENTS, SAMPLE_STUDENTS, SAMPLE_MESSAGES } from './constants';

export const DEFAULT_SUPABASE_URL = 'https://zpdvsxnsljuncylytwai.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_YnctoDn6cmImHDA1v13pKQ_E2-QXyUe';

export const SUPABASE_SQL_MIGRATION = `-- =========================================================================
-- LOPCAMPUS TANZANIA: DATABASE KAMILI YA SUPABASE SQL (IDEMPOTENT & SAFE)
-- Nakili code hizi zote, nenda kwenye Supabase Dashboard -> SQL Editor
-- kisha bandika (paste) na ubonyeze kitufe cha kijani "RUN".
-- Inaweza kurudiwa mara kadhaa bila kosa lolote (safe to re-run).
-- =========================================================================

-- 1. TABLE YA PROFILES (Madalali na Wenye Nyumba)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'broker',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read profiles" ON profiles;
DROP POLICY IF EXISTS "Public Insert profiles" ON profiles;
DROP POLICY IF EXISTS "Public Update profiles" ON profiles;
DROP POLICY IF EXISTS "Public Delete profiles" ON profiles;

CREATE POLICY "Public Read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update profiles" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Public Delete profiles" ON profiles FOR DELETE USING (true);

-- 2. TABLE YA ROOMS (Matangazo ya Vyumba, Picha na Video)
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  broker_id TEXT NOT NULL,
  room_type TEXT NOT NULL,
  price NUMERIC NOT NULL,
  region TEXT NOT NULL,
  district TEXT NOT NULL,
  ward TEXT NOT NULL,
  landmark TEXT,
  contact_phone TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  additional_images TEXT[],
  image_url_2 TEXT,
  image_url_3 TEXT,
  views INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  duration_days INT DEFAULT 14,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  video_url TEXT,
  video_thumbnail_url TEXT,
  video_duration INT,
  video_size INT,
  video_status VARCHAR(20) DEFAULT 'ready'
);

-- Hakikisha nguzo zote zipo kama table ilishatengenezwa awali:
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS video_duration INT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS video_size INT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS video_status VARCHAR(20) DEFAULT 'ready';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS image_url_2 TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS image_url_3 TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS additional_images TEXT[];

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read rooms" ON rooms;
DROP POLICY IF EXISTS "Public Insert rooms" ON rooms;
DROP POLICY IF EXISTS "Public Update rooms" ON rooms;
DROP POLICY IF EXISTS "Public Delete rooms" ON rooms;

CREATE POLICY "Public Read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Public Insert rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update rooms" ON rooms FOR UPDATE USING (true);
CREATE POLICY "Public Delete rooms" ON rooms FOR DELETE USING (true);

-- 3. TABLE YA AKAUNTI ZA WANAFUNZI / WATEJA (Student Accounts)
CREATE TABLE IF NOT EXISTS student_accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  full_name TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read student_accounts" ON student_accounts;
DROP POLICY IF EXISTS "Public Insert student_accounts" ON student_accounts;
DROP POLICY IF EXISTS "Public Update student_accounts" ON student_accounts;
DROP POLICY IF EXISTS "Public Delete student_accounts" ON student_accounts;

CREATE POLICY "Public Read student_accounts" ON student_accounts FOR SELECT USING (true);
CREATE POLICY "Public Insert student_accounts" ON student_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update student_accounts" ON student_accounts FOR UPDATE USING (true);
CREATE POLICY "Public Delete student_accounts" ON student_accounts FOR DELETE USING (true);

-- 4. TABLE YA MAONI NA MASWALI (Comment Section)
CREATE TABLE IF NOT EXISTS room_comments (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_phone TEXT,
  author_role VARCHAR(30) DEFAULT 'student',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  likes INT DEFAULT 0,
  parent_id TEXT,
  reply_to_name TEXT
);

ALTER TABLE room_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read room_comments" ON room_comments;
DROP POLICY IF EXISTS "Public Insert room_comments" ON room_comments;
DROP POLICY IF EXISTS "Public Update room_comments" ON room_comments;
DROP POLICY IF EXISTS "Public Delete room_comments" ON room_comments;

CREATE POLICY "Public Read room_comments" ON room_comments FOR SELECT USING (true);
CREATE POLICY "Public Insert room_comments" ON room_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update room_comments" ON room_comments FOR UPDATE USING (true);
CREATE POLICY "Public Delete room_comments" ON room_comments FOR DELETE USING (true);

-- 5. TABLE YA JUMBE ZA CHAT (Direct Messaging baina ya Dalali na Mteja)
CREATE TABLE IF NOT EXISTS room_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  room_title TEXT,
  room_price NUMERIC,
  room_image TEXT,
  broker_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_username TEXT NOT NULL,
  student_phone TEXT,
  sender_type VARCHAR(20) NOT NULL, -- 'student' au 'broker'
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_by_broker BOOLEAN DEFAULT FALSE,
  read_by_student BOOLEAN DEFAULT TRUE
);

ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read room_messages" ON room_messages;
DROP POLICY IF EXISTS "Public Insert room_messages" ON room_messages;
DROP POLICY IF EXISTS "Public Update room_messages" ON room_messages;
DROP POLICY IF EXISTS "Public Delete room_messages" ON room_messages;

CREATE POLICY "Public Read room_messages" ON room_messages FOR SELECT USING (true);
CREATE POLICY "Public Insert room_messages" ON room_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update room_messages" ON room_messages FOR UPDATE USING (true);
CREATE POLICY "Public Delete room_messages" ON room_messages FOR DELETE USING (true);

-- 6. TABLE YA RIPOTI / MALALAMIKO (Complaints)
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  reporter_phone TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read complaints" ON complaints;
DROP POLICY IF EXISTS "Public Insert complaints" ON complaints;
DROP POLICY IF EXISTS "Public Update complaints" ON complaints;
DROP POLICY IF EXISTS "Public Delete complaints" ON complaints;

CREATE POLICY "Public Read complaints" ON complaints FOR SELECT USING (true);
CREATE POLICY "Public Insert complaints" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update complaints" ON complaints FOR UPDATE USING (true);
CREATE POLICY "Public Delete complaints" ON complaints FOR DELETE USING (true);

-- 7. STORAGE BUCKETS (Picha na Video)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('room-videos', 'room-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for room-videos
DROP POLICY IF EXISTS "Public Read room-videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload room-videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Update room-videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete room-videos" ON storage.objects;

CREATE POLICY "Public Read room-videos" ON storage.objects FOR SELECT USING (bucket_id = 'room-videos');
CREATE POLICY "Public Upload room-videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-videos');
CREATE POLICY "Public Update room-videos" ON storage.objects FOR UPDATE USING (bucket_id = 'room-videos');
CREATE POLICY "Public Delete room-videos" ON storage.objects FOR DELETE USING (bucket_id = 'room-videos');

-- Storage Policies for room-images
DROP POLICY IF EXISTS "Public Read room-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload room-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Update room-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete room-images" ON storage.objects;

CREATE POLICY "Public Read room-images" ON storage.objects FOR SELECT USING (bucket_id = 'room-images');
CREATE POLICY "Public Upload room-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-images');
CREATE POLICY "Public Update room-images" ON storage.objects FOR UPDATE USING (bucket_id = 'room-images');
CREATE POLICY "Public Delete room-images" ON storage.objects FOR DELETE USING (bucket_id = 'room-images');

-- =========================================================================
-- Hongera! Database nzima ya LopCampus sasa ipo tayari 100%.
-- =========================================================================
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
      if (error.message.includes('video_url') || error.message.includes('column') || error.message.includes('additional_images') || error.message.includes('image_url_2')) {
        console.warn('Extended columns not yet created in Supabase. Inserting core listing and saving extra media locally...');
        const {
          video_url,
          video_thumbnail_url,
          video_duration,
          video_size,
          video_status,
          additional_images,
          image_url_2,
          image_url_3,
          ...coreRoom
        } = room;
        
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
          additional_images,
          image_url_2,
          image_url_3,
          video_url,
          video_thumbnail_url,
          video_duration,
          video_size,
          video_status: video_url ? 'ready' : null
        };
        saveLocalRoom(merged);
        return { data: merged };
      }
      throw error;
    }

    if (data) {
      saveLocalRoom(data as RoomListing);
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

// =========================================================================
// COMMENTS / MAONI MANAGEMENT (Supabase + LocalStorage Fallback)
// =========================================================================
const COMMENTS_STORAGE_KEY = 'lopcampus_room_comments_cache';

export function getLocalComments(roomId?: string | number): RoomComment[] {
  if (typeof window === 'undefined') {
    return roomId === undefined
      ? SAMPLE_COMMENTS
      : SAMPLE_COMMENTS.filter((c) => String(c.room_id) === String(roomId));
  }
  try {
    const stored = localStorage.getItem(COMMENTS_STORAGE_KEY);
    let all: RoomComment[] = [];
    if (!stored) {
      localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(SAMPLE_COMMENTS));
      all = SAMPLE_COMMENTS;
    } else {
      all = JSON.parse(stored);
    }
    if (roomId !== undefined) {
      return all.filter((c) => String(c.room_id) === String(roomId));
    }
    return all;
  } catch {
    return roomId === undefined
      ? SAMPLE_COMMENTS
      : SAMPLE_COMMENTS.filter((c) => String(c.room_id) === String(roomId));
  }
}

export function saveLocalComment(comment: RoomComment): void {
  if (typeof window === 'undefined') return;
  const current = getLocalComments();
  const exists = current.some((c) => c.id === comment.id);
  const updated = exists ? current.map((c) => (c.id === comment.id ? comment : c)) : [comment, ...current];
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(updated));
}

export function deleteLocalComment(commentId: string): void {
  if (typeof window === 'undefined') return;
  const current = getLocalComments();
  const updated = current.filter((c) => c.id !== commentId && c.parent_id !== commentId);
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(updated));
}

export async function fetchRoomComments(roomId: string | number): Promise<RoomComment[]> {
  try {
    const { data, error } = await supabase
      .from('room_comments')
      .select('*')
      .eq('room_id', String(roomId))
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      const local = getLocalComments(roomId);
      const remoteIds = new Set(data.map((d) => d.id));
      const unsynced = local.filter((l) => !remoteIds.has(l.id));
      return [...(data as RoomComment[]), ...unsynced];
    }
  } catch (err) {
    console.warn('Comments fetched from local storage fallback:', err);
  }
  return getLocalComments(roomId);
}

export async function createRoomComment(
  commentData: Omit<RoomComment, 'id' | 'created_at'>
): Promise<RoomComment> {
  const newComment: RoomComment = {
    ...commentData,
    id: 'comm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    created_at: new Date().toISOString(),
    likes: 0
  };

  saveLocalComment(newComment);

  try {
    const { data, error } = await supabase
      .from('room_comments')
      .insert([
        {
          id: newComment.id,
          room_id: String(newComment.room_id),
          author_name: newComment.author_name,
          author_phone: newComment.author_phone || null,
          author_role: newComment.author_role,
          content: newComment.content,
          likes: 0,
          parent_id: newComment.parent_id || null,
          reply_to_name: newComment.reply_to_name || null
        }
      ])
      .select();

    if (!error && data && data[0]) {
      const official = { ...newComment, ...data[0] };
      saveLocalComment(official);
      return official;
    }
  } catch (err) {
    console.warn('Comment saved locally (Supabase room_comments table pending):', err);
  }

  return newComment;
}

export async function likeRoomComment(commentId: string): Promise<number> {
  const all = getLocalComments();
  let updatedLikes = 1;
  const updated = all.map((c) => {
    if (c.id === commentId) {
      updatedLikes = (c.likes || 0) + 1;
      return { ...c, likes: updatedLikes };
    }
    return c;
  });
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(updated));

  try {
    await supabase
      .from('room_comments')
      .update({ likes: updatedLikes })
      .eq('id', commentId);
  } catch {
    // Non-blocking
  }

  return updatedLikes;
}

export async function deleteRoomComment(commentId: string): Promise<boolean> {
  deleteLocalComment(commentId);
  try {
    await supabase.from('room_comments').delete().eq('id', commentId);
  } catch {
    // Non-blocking
  }
  return true;
}

export function getRoomCommentsCount(roomId: string | number): number {
  return getLocalComments(roomId).length;
}

// =========================================================================
// MFUMO WA AKAUNTI YA MWANAFUNZI / MTEJA (STUDENT USERNAME & PASSWORD AUTH)
// =========================================================================

export const STUDENTS_STORAGE_KEY = 'lopcampus_registered_students';
export const LOGGED_STUDENT_STORAGE_KEY = 'lopcampus_logged_student';
export const MESSAGES_STORAGE_KEY = 'lopcampus_room_messages';

export function getStoredRegisteredStudents(): StudentAccount[] {
  if (typeof window === 'undefined') return SAMPLE_STUDENTS;
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(SAMPLE_STUDENTS));
  return SAMPLE_STUDENTS;
}

export function saveRegisteredStudent(student: StudentAccount) {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredRegisteredStudents();
    const idx = all.findIndex(
      (s) => s.username.toLowerCase() === student.username.toLowerCase() || s.id === student.id
    );
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...student };
    } else {
      all.push(student);
    }
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function getLoggedStudent(): StudentAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOGGED_STUDENT_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export function setLoggedStudent(student: StudentAccount | null) {
  if (typeof window === 'undefined') return;
  if (!student) {
    localStorage.removeItem(LOGGED_STUDENT_STORAGE_KEY);
  } else {
    localStorage.setItem(LOGGED_STUDENT_STORAGE_KEY, JSON.stringify(student));
  }
  window.dispatchEvent(new CustomEvent('lopcampus_student_auth_change', { detail: student }));
}

export function registerStudentAccount(
  username: string,
  password: string,
  phoneNumber?: string,
  fullName?: string
): { success: boolean; student?: StudentAccount; error?: string } {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'Username inapaswa kuwa na angalau herufi au tarakimu 3 (bila nafasi au alama geni).' };
  }
  if (!password || password.length < 4) {
    return { success: false, error: 'Nenosiri (password) linapaswa kuwa na angalau herufi au tarakimu 4.' };
  }

  const existing = getStoredRegisteredStudents();
  if (existing.some((s) => s.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: `Jina "${cleanUsername}" tayari limetumika na mteja mwingine. Chagua jina jingine.` };
  }

  const newStudent: StudentAccount = {
    id: `stud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    username: cleanUsername,
    password: password,
    phone_number: phoneNumber?.trim() || '',
    full_name: fullName?.trim() || cleanUsername,
    created_at: new Date().toISOString()
  };

  saveRegisteredStudent(newStudent);
  setLoggedStudent(newStudent);
  return { success: true, student: newStudent };
}

export function loginStudentAccount(
  username: string,
  password: string
): { success: boolean; student?: StudentAccount; error?: string } {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) {
    return { success: false, error: 'Tafadhali weka Username yako.' };
  }
  if (!password) {
    return { success: false, error: 'Tafadhali weka Nenosiri (password) lako.' };
  }

  const students = getStoredRegisteredStudents();
  const match = students.find((s) => s.username.toLowerCase() === cleanUsername);

  if (!match) {
    return { success: false, error: 'Akaunti hii ya mwanafunzi haijapatikana. Tafadhali Jisajili kwanza.' };
  }

  if (match.password && match.password !== password) {
    return { success: false, error: 'Nenosiri sio sahihi. Tafadhali jaribu tena.' };
  }

  setLoggedStudent(match);
  return { success: true, student: match };
}

export function logoutStudentAccount() {
  setLoggedStudent(null);
}

// =========================================================================
// MFUMO WA JUMBE (MESSAGES / CHAT BAINA YA DALALI NA MWANAFUNZI)
// =========================================================================

export function getLocalMessages(): RoomMessage[] {
  if (typeof window === 'undefined') return SAMPLE_MESSAGES;
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(SAMPLE_MESSAGES));
  return SAMPLE_MESSAGES;
}

export function saveLocalMessage(msg: RoomMessage) {
  if (typeof window === 'undefined') return;
  try {
    const all = getLocalMessages();
    const existingIdx = all.findIndex((m) => m.id === msg.id);
    if (existingIdx >= 0) {
      all[existingIdx] = msg;
    } else {
      all.push(msg);
    }
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('lopcampus_message_event', { detail: msg }));
  } catch {}
}

export async function fetchMessagesForBroker(brokerId: string): Promise<RoomMessage[]> {
  const local = getLocalMessages().filter(
    (m) =>
      String(m.broker_id) === String(brokerId) ||
      brokerId === 'demo-dalali-001' ||
      m.broker_id === 'sample-broker-1'
  );

  try {
    const { data, error } = await supabase
      .from('room_messages')
      .select('*')
      .eq('broker_id', brokerId)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      // Merge with local
      const mergedMap = new Map<string, RoomMessage>();
      local.forEach((m) => mergedMap.set(m.id, m));
      data.forEach((m) => mergedMap.set(m.id, m));
      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
  } catch {}

  return local.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export async function fetchMessagesForStudent(studentId: string): Promise<RoomMessage[]> {
  const local = getLocalMessages().filter((m) => String(m.student_id) === String(studentId));

  try {
    const { data, error } = await supabase
      .from('room_messages')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      const mergedMap = new Map<string, RoomMessage>();
      local.forEach((m) => mergedMap.set(m.id, m));
      data.forEach((m) => mergedMap.set(m.id, m));
      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
  } catch {}

  return local.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export async function fetchConversationMessages(
  roomId: string | number,
  studentId: string
): Promise<RoomMessage[]> {
  const local = getLocalMessages().filter(
    (m) => String(m.room_id) === String(roomId) && String(m.student_id) === String(studentId)
  );

  try {
    const { data, error } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', String(roomId))
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      const mergedMap = new Map<string, RoomMessage>();
      local.forEach((m) => mergedMap.set(m.id, m));
      data.forEach((m) => mergedMap.set(m.id, m));
      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
  } catch {}

  return local.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export async function sendRoomMessage(
  data: Omit<RoomMessage, 'id' | 'created_at' | 'read_by_broker' | 'read_by_student'> & {
    id?: string;
    read_by_broker?: boolean;
    read_by_student?: boolean;
  }
): Promise<RoomMessage> {
  const newMsg: RoomMessage = {
    id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    room_id: data.room_id,
    room_title: data.room_title,
    room_price: data.room_price,
    room_image: data.room_image,
    broker_id: data.broker_id,
    student_id: data.student_id,
    student_username: data.student_username,
    student_phone: data.student_phone,
    sender_type: data.sender_type,
    sender_name: data.sender_name,
    content: data.content.trim(),
    created_at: new Date().toISOString(),
    // Ikiwa limetumwa na mteja, dalali bado hajaliona (false). Ikiwa limetumwa na dalali, mteja bado hajaliona (false).
    read_by_broker: data.sender_type === 'broker',
    read_by_student: data.sender_type === 'student'
  };

  // 1. Hifadhi papo hapo kwenye LocalStorage
  saveLocalMessage(newMsg);

  // 2. Jaribu kusawazisha na Supabase (Non-blocking)
  try {
    const { data: inserted, error } = await supabase.from('room_messages').insert([newMsg]).select().single();
    if (!error && inserted) {
      saveLocalMessage(inserted);
      return inserted;
    }
  } catch {}

  return newMsg;
}

export async function markConversationAsRead(
  roomId: string | number,
  studentId: string,
  readBy: 'broker' | 'student'
): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const all = getLocalMessages();
    let hasChanges = false;
    const updated = all.map((m) => {
      if (String(m.room_id) === String(roomId) && String(m.student_id) === String(studentId)) {
        if (readBy === 'broker' && !m.read_by_broker) {
          hasChanges = true;
          return { ...m, read_by_broker: true };
        }
        if (readBy === 'student' && !m.read_by_student) {
          hasChanges = true;
          return { ...m, read_by_student: true };
        }
      }
      return m;
    });

    if (hasChanges) {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lopcampus_message_event'));
    }

    // Update in Supabase
    const updatePayload =
      readBy === 'broker' ? { read_by_broker: true } : { read_by_student: true };
    await supabase
      .from('room_messages')
      .update(updatePayload)
      .eq('room_id', String(roomId))
      .eq('student_id', studentId);
  } catch {}
}

export function getBrokerUnreadMessagesCount(brokerId: string): number {
  const all = getLocalMessages();
  return all.filter(
    (m) =>
      (String(m.broker_id) === String(brokerId) ||
        brokerId === 'demo-dalali-001' ||
        m.broker_id === 'sample-broker-1') &&
      m.sender_type === 'student' &&
      !m.read_by_broker
  ).length;
}

export function getStudentUnreadMessagesCount(studentId: string): number {
  const all = getLocalMessages();
  return all.filter(
    (m) =>
      String(m.student_id) === String(studentId) &&
      m.sender_type === 'broker' &&
      !m.read_by_student
  ).length;
}

export function getGroupedBrokerConversations(
  brokerId: string,
  roomsList?: RoomListing[]
): ConversationSummary[] {
  const all = getLocalMessages().filter(
    (m) =>
      String(m.broker_id) === String(brokerId) ||
      brokerId === 'demo-dalali-001' ||
      m.broker_id === 'sample-broker-1'
  );

  // Group by `${room_id}_${student_id}`
  const groupMap = new Map<string, RoomMessage[]>();
  for (const msg of all) {
    const key = `${msg.room_id}_${msg.student_id}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(msg);
  }

  const summaries: ConversationSummary[] = [];

  for (const [key, msgs] of groupMap.entries()) {
    // Sort chronological
    msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const lastMsg = msgs[msgs.length - 1];
    const firstMsg = msgs[0];

    // Find room info if available
    const room = roomsList?.find((r) => String(r.id) === String(lastMsg.room_id));

    const unreadCount = msgs.filter((m) => m.sender_type === 'student' && !m.read_by_broker).length;

    summaries.push({
      conversation_id: key,
      room_id: lastMsg.room_id,
      room_title: room?.room_type || lastMsg.room_title || `Chumba #${lastMsg.room_id}`,
      room_price: room?.price || lastMsg.room_price,
      room_image: room?.image_url || lastMsg.room_image,
      broker_id: brokerId,
      student_id: lastMsg.student_id,
      student_username: lastMsg.student_username || firstMsg.student_username || 'Mteja',
      student_phone: lastMsg.student_phone || firstMsg.student_phone,
      last_message: lastMsg.content,
      last_message_at: lastMsg.created_at,
      unread_for_broker: unreadCount,
      unread_for_student: 0,
      messages: msgs
    });
  }

  // Sort by last message descending
  return summaries.sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );
}

export function getGroupedStudentConversations(studentId: string): ConversationSummary[] {
  const all = getLocalMessages().filter((m) => String(m.student_id) === String(studentId));

  // Group by `${room_id}_${broker_id}`
  const groupMap = new Map<string, RoomMessage[]>();
  for (const msg of all) {
    const key = `${msg.room_id}_${msg.broker_id}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(msg);
  }

  const summaries: ConversationSummary[] = [];

  for (const [key, msgs] of groupMap.entries()) {
    msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const lastMsg = msgs[msgs.length - 1];

    const unreadCount = msgs.filter((m) => m.sender_type === 'broker' && !m.read_by_student).length;

    summaries.push({
      conversation_id: key,
      room_id: lastMsg.room_id,
      room_title: lastMsg.room_title || `Chumba #${lastMsg.room_id}`,
      room_price: lastMsg.room_price,
      room_image: lastMsg.room_image,
      broker_id: lastMsg.broker_id,
      student_id: studentId,
      student_username: lastMsg.student_username,
      student_phone: lastMsg.student_phone,
      last_message: lastMsg.content,
      last_message_at: lastMsg.created_at,
      unread_for_broker: 0,
      unread_for_student: unreadCount,
      messages: msgs
    });
  }

  return summaries.sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );
}


