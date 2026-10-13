import { RoomListing, RoomComment, StudentAccount, RoomMessage } from '../types';

export const ROOM_TYPES = [
  'Master Chumba Kikubwa',
  'Single Room (Chumba Kimoja)',
  'Chumba & Sebule',
  'Apartment Nzima',
  'Hostel / Chumba cha Wanafunzi',
  'Ghetto Safi',
  'Frame ya Biashara',
] as const;

export const UNIVERSITIES = [
  { name: 'Vyote', query: '' },
  { name: 'UDSM', query: 'udsm' },
  { name: 'UDOM', query: 'udom' },
  { name: 'IFM', query: 'ifm' },
  { name: 'CBE', query: 'cbe' },
  { name: 'DIT', query: 'dit' },
  { name: 'Ardhi', query: 'ardhi' },
  { name: 'Mabibo', query: 'mabibo' },
  { name: 'Mwenge', query: 'mwenge' },
  { name: 'Mzumbe', query: 'mzumbe' },
  { name: 'SAUT', query: 'saut' },
];

export const REGIONS_AND_DISTRICTS: Record<string, string[]> = {
  'Dar es Salaam': ['Ilala', 'Kinondoni', 'Temeke', 'Kigamboni', 'Ubungo'],
  'Dodoma': ['Dodoma City', 'Bahi', 'Chamwino', 'Chemba', 'Kondoa', 'Kongwa', 'Mpwapwa'],
  'Mwanza': ['Ilemela', 'Nyamagana', 'Magu', 'Misungwi', 'Sengerema', 'Ukerewe'],
  'Arusha': ['Arusha City', 'Arusha District', 'Karatu', 'Longido', 'Meru', 'Monduli', 'Ngorongoro'],
  'Mbeya': ['Mbeya City', 'Chunya', 'Kyela', 'Mbarali', 'Rungwe'],
  'Morogoro': ['Morogoro MC', 'Kilosa', 'Mvomero', 'Ifakara TC', 'Gairo'],
  'Tanga': ['Tanga City', 'Handeni', 'Korogwe', 'Lushoto', 'Muheza', 'Pangani'],
  'Kilimanjaro': ['Moshi MC', 'Hai', 'Moshi DC', 'Rombo', 'Same', 'Siha'],
  'Iringa': ['Iringa MC', 'Iringa DC', 'Kilolo', 'Mufindi', 'Mafinga TC'],
  'Geita': ['Geita Town', 'Geita District', 'Bukombe', 'Chato', 'Mbogwe', "Nyang'hwale"],
  'Kagera': ['Bukoba MC', 'Bukoba DC', 'Biharamulo', 'Karagwe', 'Kyerwa', 'Missenyi', 'Muleba', 'Ngara'],
  'Kigoma': ['Kigoma Ujiji MC', 'Kigoma DC', 'Buhigwe', 'Kakonko', 'Kasulu', 'Kibondo', 'Uvinza'],
  'Tabora': ['Tabora MC', 'Igunga', 'Kaliua', 'Nzega', 'Sikonge', 'Urambo', 'Uyui'],
  'Shinyanga': ['Shinyanga MC', 'Kahama MC', 'Kishapu', 'Msalala', 'Ushetu'],
  'Zanzibar Mjini': ['Mjini', 'Magharibi A', 'Magharibi B'],
};

export const SAMPLE_ROOMS: RoomListing[] = [
  {
    id: 'sample-1',
    broker_id: 'sample-broker-1',
    room_type: 'Master Chumba Kikubwa (Tiles & Gypsum)',
    price: 150000,
    region: 'Dar es Salaam',
    district: 'Kinondoni',
    ward: 'Mwenge / Mlalakuwa',
    landmark: 'Karibu na Chuo Kikuu cha Dar es Salaam (UDSM)',
    contact_phone: '0712345678',
    description: 'Chumba kizuri sana chenye tiles, gypsum, choo cha ndani, maji ya DAWASA 24/7 na umeme wa Luku unaojitegemea. Mazingira tulivu ya kujisomea, fensi imara na geti.',
    image_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
    ],
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    video_thumbnail_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    video_duration: 15,
    video_size: 3200000,
    video_status: 'ready',
    views: 89,
    status: 'active',
    duration_days: 14,
    created_at: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 'sample-2',
    broker_id: 'sample-broker-2',
    room_type: 'Single Room (Hosteli ya Wanafunzi)',
    price: 80000,
    region: 'Dar es Salaam',
    district: 'Ubungo',
    ward: 'Mabibo Hosteli',
    landmark: 'Mabibo Hostel pembeni ya Barabara',
    contact_phone: '0755998877',
    description: 'Chumba safi cha mwanafunzi. Choo kinashare watu wawili tu wastaarabu, maji yapo ya uhakika na umeme upo. Ni mita chache kutoka kituo cha daladala na chuo.',
    image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    views: 124,
    status: 'active',
    duration_days: 14,
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'sample-3',
    broker_id: 'sample-broker-3',
    room_type: 'Chumba & Sebule ya Kisasa',
    price: 250000,
    region: 'Dodoma',
    district: 'Dodoma City',
    ward: 'Kikuyu Kaskazini',
    landmark: 'Karibu na Chuo cha UDOM & CBE',
    contact_phone: '0768112233',
    description: 'Chumba kimoja na sebule kubwa, jiko dogo la kisasa, luku ya kwako, parking ipo ya gari na pikipiki. Mazingira tulivu kabisa kwa ajili ya kusoma.',
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80'
    ],
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    video_thumbnail_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    video_duration: 15,
    video_size: 2800000,
    video_status: 'ready',
    views: 145,
    status: 'active',
    duration_days: 14,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'sample-4',
    broker_id: 'sample-broker-1',
    room_type: 'Self Contained Studio',
    price: 180000,
    region: 'Dar es Salaam',
    district: 'Ilala',
    ward: 'Posta / Kivukoni',
    landmark: 'Karibu na Chuo cha IFM & DIT',
    contact_phone: '0712345678',
    description: 'Chumba kizuri katikati ya jiji karibu na IFM. Choo cha ndani, feni, fensi yenye ulinzi wa masaa 24. Hakuna usumbufu wa usafiri.',
    image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
    ],
    views: 67,
    status: 'active',
    duration_days: 14,
    created_at: new Date(Date.now() - 129600000).toISOString(),
  },
  {
    id: 'sample-5',
    broker_id: 'sample-broker-1',
    room_type: 'Frame ya Biashara',
    price: 280000,
    region: 'Dar es Salaam',
    district: 'Kinondoni',
    ward: 'Sinza Palestina',
    landmark: 'Mzunguko wa biashara, mbele ya barabara',
    contact_phone: '0712345678',
    description: 'Frame ya biashara inayofaa kwa duka, stationery, salon au pharmacy. Shutter ya chuma, umeme na maji ya uhakika.',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    video_thumbnail_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    video_duration: 12,
    video_size: 2400000,
    video_status: 'ready',
    views: 92,
    status: 'active',
    duration_days: 14,
    created_at: new Date(Date.now() - 150000000).toISOString(),
  }
];

/**
 * Returns all available images for a room in order:
 * [Picha Kuu, Picha ya Ziada 1, Picha ya Ziada 2]
 */
export function getAllRoomImages(room?: Partial<RoomListing> | null): string[] {
  if (!room) return [];
  const images: string[] = [];
  if (room.image_url) images.push(room.image_url);
  if (Array.isArray(room.additional_images)) {
    room.additional_images.forEach((img) => {
      if (img && !images.includes(img)) images.push(img);
    });
  }
  if (room.image_url_2 && !images.includes(room.image_url_2)) images.push(room.image_url_2);
  if (room.image_url_3 && !images.includes(room.image_url_3)) images.push(room.image_url_3);
  return images.length > 0
    ? images
    : [room.image_url || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80'];
}

export const ROOM_EXPIRY_DAYS = 14; // Matangazo ya vyumba hufutika kiotomatiki baada ya wiki 2 (siku 14)

export const MAX_VIDEO_DURATION_SECONDS = 30;
export const MAX_VIDEO_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const SAMPLE_COMMENTS: RoomComment[] = [
  {
    id: 'comm-1',
    room_id: 'sample-1',
    author_name: 'Kelvin Mushi',
    author_role: 'student',
    content: 'Maji ya DAWASA yanatoka moja kwa moja chooni na bafuni au kuna tanki la akiba?',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    likes: 3,
  },
  {
    id: 'comm-2',
    room_id: 'sample-1',
    parent_id: 'comm-1',
    reply_to_name: 'Kelvin Mushi',
    author_name: 'Dalali Ally',
    author_role: 'broker',
    content: 'Habari Kelvin! Kuna simtangi kubwa ya lita 3000 juu ya paa, hata maji yakikatika mjini unakuwa na maji masaa yote.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    likes: 6,
  },
  {
    id: 'comm-3',
    room_id: 'sample-1',
    author_name: 'Amina Rashid',
    author_role: 'student',
    content: 'Kutoka hapa hadi geti la UDSM (Magufuli Hostel) ni dakika ngapi kwa miguu?',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    likes: 2,
  },
  {
    id: 'comm-4',
    room_id: 'sample-2',
    author_name: 'Baraka Joseph',
    author_role: 'student',
    content: 'Kodi hii ya 60,000 inalipwa kwa mwezi mmoja mmoja au kuanzia miezi mitatu?',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    likes: 4,
  },
  {
    id: 'comm-5',
    room_id: 'sample-2',
    parent_id: 'comm-4',
    reply_to_name: 'Baraka Joseph',
    author_name: 'Dalali Mwita',
    author_role: 'broker',
    content: 'Inaanza kodi ya miezi 3 tu kwa wanafunzi, baada ya hapo unaruhusiwa kulipa mwezi mmoja mmoja bila shida.',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    likes: 5,
  },
  {
    id: 'comm-6',
    room_id: 'sample-3',
    author_name: 'Neema John',
    author_role: 'student',
    content: 'Je eneo lina geti na ulinzi wa mlinzi usiku?',
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    likes: 1,
  }
];

export const SAMPLE_STUDENTS: StudentAccount[] = [
  {
    id: 'stud-kelvin',
    username: 'kelvin_mushi',
    full_name: 'Kelvin Mushi',
    phone_number: '0754123456',
    password: 'password123',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'stud-amina',
    username: 'amina_udom',
    full_name: 'Amina Rashid',
    phone_number: '0714987654',
    password: 'password123',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  }
];

export const SAMPLE_MESSAGES: RoomMessage[] = [
  {
    id: 'msg-1',
    room_id: 'sample-1',
    room_title: 'Master Chumba Kikubwa (Tiles & Gypsum)',
    room_price: 150000,
    room_image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    broker_id: 'demo-dalali-001',
    student_id: 'stud-kelvin',
    student_username: 'kelvin_mushi',
    student_phone: '0754123456',
    sender_type: 'student',
    sender_name: 'Kelvin Mushi (@kelvin_mushi)',
    content: 'Habari dalali! Nimependa chumba hiki cha Mwenge. Je bado kipo wazi? Naweza kuja kukiona leo jioni?',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    read_by_broker: false,
    read_by_student: true,
  },
  {
    id: 'msg-2',
    room_id: 'sample-1',
    room_title: 'Master Chumba Kikubwa (Tiles & Gypsum)',
    room_price: 150000,
    room_image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    broker_id: 'demo-dalali-001',
    student_id: 'stud-kelvin',
    student_username: 'kelvin_mushi',
    student_phone: '0754123456',
    sender_type: 'broker',
    sender_name: 'Dalali Baraka',
    content: 'Habari Kelvin, ndiyo chumba bado kipo wazi kabisa! Karibu sana saa 11 jioni tufike pamoja kukiona.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    read_by_broker: true,
    read_by_student: true,
  },
  {
    id: 'msg-3',
    room_id: 'sample-1',
    room_title: 'Master Chumba Kikubwa (Tiles & Gypsum)',
    room_price: 150000,
    room_image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    broker_id: 'demo-dalali-001',
    student_id: 'stud-amina',
    student_username: 'amina_udom',
    student_phone: '0714987654',
    sender_type: 'student',
    sender_name: 'Amina Rashid (@amina_udom)',
    content: 'Habari kiongozi, kodi ya hiki chumba inaweza kupungua hadi 130,000 nikilipa miezi 6 kwa mkupuo?',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    read_by_broker: false,
    read_by_student: true,
  }
];

