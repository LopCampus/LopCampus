import { RoomListing } from '../types';

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
