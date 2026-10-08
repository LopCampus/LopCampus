export interface RoomListing {
  id: string | number;
  broker_id: string;
  room_type: string;
  price: number;
  region: string;
  district: string;
  ward: string;
  landmark?: string | null;
  contact_phone: string;
  description?: string | null;
  image_url: string;
  views: number;
  status: 'active' | 'rented' | 'inactive';
  duration_days: number;
  created_at: string;
  expires_at?: string;

  // Video fields (Optional - added for video support)
  video_url?: string | null;
  video_thumbnail_url?: string | null;
  video_duration?: number | null; // In seconds (max 30s)
  video_size?: number | null; // In bytes (max ~15MB)
  video_status?: 'ready' | 'processing' | 'failed' | null;
}

export interface BrokerProfile {
  id: string;
  full_name: string;
  phone_number: string;
  role: 'broker' | 'landlord' | 'admin';
  is_active?: boolean;
  created_at?: string;
}

export interface Complaint {
  id?: string;
  room_id: string | number;
  reason: string;
  details?: string;
  reporter_phone: string;
  status?: string;
  created_at?: string;
}

export interface VideoProcessingProgress {
  stage: 'idle' | 'validating' | 'compressing' | 'uploading' | 'completed' | 'error';
  message: string;
  progressPercent: number;
  error?: string;
}

export interface VideoValidationResult {
  isValid: boolean;
  duration: number; // in seconds (capped at 30 if trimmed)
  originalDuration?: number; // original seconds before auto-cut
  needsTrim?: boolean;
  trimNotice?: string;
  size: number; // in bytes
  width: number;
  height: number;
  error?: string;
}

export type ViewTab = 'student-view' | 'dashboard-view' | 'add-room-view' | 'auth-view';
