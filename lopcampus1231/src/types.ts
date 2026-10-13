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
  image_url: string; // Picha Kuu
  additional_images?: string[]; // Hadi picha 2 za ziada (Hiari)
  image_url_2?: string | null; // Picha ya ziada 1
  image_url_3?: string | null; // Picha ya ziada 2
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

export interface RoomComment {
  id: string;
  room_id: string | number;
  author_name: string;
  author_phone?: string;
  author_role: 'student' | 'broker' | 'landlord' | 'visitor';
  content: string;
  created_at: string;
  likes?: number;
  parent_id?: string | null;
  reply_to_name?: string | null;
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

export interface StudentAccount {
  id: string;
  username: string;
  phone_number?: string;
  full_name?: string;
  created_at: string;
  password?: string;
}

export interface RoomMessage {
  id: string;
  room_id: string | number;
  room_title?: string;
  room_price?: number;
  room_image?: string;
  broker_id: string;
  student_id: string;
  student_username: string;
  student_phone?: string;
  sender_type: 'student' | 'broker';
  sender_name: string;
  content: string;
  created_at: string;
  read_by_broker: boolean;
  read_by_student: boolean;
}

export interface ConversationSummary {
  conversation_id: string; // `${room_id}_${student_id}`
  room_id: string | number;
  room_title: string;
  room_price?: number;
  room_image?: string;
  broker_id: string;
  student_id: string;
  student_username: string;
  student_phone?: string;
  last_message: string;
  last_message_at: string;
  unread_for_broker: number;
  unread_for_student: number;
  messages: RoomMessage[];
}

export type ViewTab = 'student-view' | 'dashboard-view' | 'add-room-view' | 'auth-view' | 'messages-view';

