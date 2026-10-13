import React, { useState, useMemo } from 'react';
import { RoomListing } from '../types';
import { REGIONS_AND_DISTRICTS, UNIVERSITIES, getAllRoomImages } from '../lib/constants';
import { getDaysRemaining } from '../lib/supabaseClient';
import { LopCampusTestimonialsPraise } from './LopCampusTestimonialsPraise';
import {
  Search,
  MapPin,
  Filter,
  Eye,
  Building2,
  ArrowRight,
  Sparkles,
  Phone,
  MessageSquare,
  RotateCw,
  GraduationCap,
  Play,
  Video,
  CheckCircle2,
  Clock,
  Images,
  Send,
  Home,
  Building,
  Store,
  Hotel
} from 'lucide-react';


interface StudentRoomsViewProps {
  rooms: RoomListing[];
  isLoading: boolean;
  hasMore: boolean;
  totalCount: number;
  isLoadingMore?: boolean;
  onRefresh: () => void;
  onLoadMore?: () => void;
  onSelectRoom: (room: RoomListing) => void;
  onNavigateBroker: () => void;
  dataSource?: 'supabase' | 'starter';
}

export const StudentRoomsView: React.FC<StudentRoomsViewProps> = ({
  rooms,
  isLoading,
  hasMore,
  totalCount,
  isLoadingMore = false,
  onRefresh,
  onLoadMore,
  onSelectRoom,
  onNavigateBroker,
  dataSource = 'supabase'
}) => {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterVideoOnly, setFilterVideoOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'hostel' | 'vyumba' | 'frame' | 'apartment'>('all');

  const categories = [
    { id: 'all', label: 'Vyote', icon: Home, emoji: '🏠' },
    { id: 'hostel', label: 'Hostel', icon: Hotel, emoji: '🎓' },
    { id: 'vyumba', label: 'Vyumba', icon: Building2, emoji: '🚪' },
    { id: 'frame', label: 'Frame', icon: Store, emoji: '🏬' },
    { id: 'apartment', label: 'Apartment', icon: Building, emoji: '🏢' },
  ] as const;

  const regionNames = useMemo(() => Object.keys(REGIONS_AND_DISTRICTS).sort(), []);
  const availableDistricts = useMemo(() => {
    if (!selectedRegion || !REGIONS_AND_DISTRICTS[selectedRegion]) return [];
    return [...REGIONS_AND_DISTRICTS[selectedRegion]].sort();
  }, [selectedRegion]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegion(e.target.value);
    setSelectedDistrict('');
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Category filter (hostel / vyumba / frame / apartment)
      if (selectedCategory !== 'all') {
        const typeStr = (room.room_type || '').toLowerCase();
        const descStr = (room.description || '').toLowerCase();
        const combined = `${typeStr} ${descStr}`;

        if (selectedCategory === 'hostel') {
          // Inajumuisha hosteli, hostel, wanafunzi
          const isHostel =
            combined.includes('hostel') ||
            combined.includes('hosteli') ||
            combined.includes('mwanafunzi') ||
            combined.includes('wanafunzi');
          if (!isHostel) return false;
        } else if (selectedCategory === 'vyumba') {
          // Vyumba vya kawaida: single room, master room, chumba kimoja, chumba & sebule, ghetto
          const isRoom =
            combined.includes('chumba') ||
            combined.includes('single') ||
            combined.includes('master') ||
            combined.includes('ghetto') ||
            combined.includes('sebule');
          const isNotFrameOnly = !typeStr.includes('frame ya biashara');
          if (!isRoom || !isNotFrameOnly) return false;
        } else if (selectedCategory === 'frame') {
          // Frame ya biashara au duka
          const isFrame =
            combined.includes('frame') ||
            combined.includes('biashara') ||
            combined.includes('duka') ||
            combined.includes('stationery');
          if (!isFrame) return false;
        } else if (selectedCategory === 'apartment') {
          // Apartment nzima au nyumba
          const isApartment =
            combined.includes('apartment') ||
            combined.includes('apartimenti') ||
            combined.includes('nyumba nzima');
          if (!isApartment) return false;
        }
      }

      if (selectedRegion && room.region !== selectedRegion) return false;
      if (selectedDistrict && room.district !== selectedDistrict) return false;
      if (maxPrice && Number(room.price) > Number(maxPrice)) return false;
      if (filterVideoOnly && !room.video_url) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inWard = room.ward?.toLowerCase().includes(q);
        const inLandmark = room.landmark?.toLowerCase().includes(q);
        const inDesc = room.description?.toLowerCase().includes(q);
        const inType = room.room_type?.toLowerCase().includes(q);
        const inRegion = room.region?.toLowerCase().includes(q);
        const inDistrict = room.district?.toLowerCase().includes(q);
        if (!inWard && !inLandmark && !inDesc && !inType && !inRegion && !inDistrict) {
          return false;
        }
      }

      return true;
    });
  }, [rooms, selectedCategory, selectedRegion, selectedDistrict, maxPrice, searchQuery, filterVideoOnly]);

  const videoCount = useMemo(() => rooms.filter((r) => Boolean(r.video_url)).length, [rooms]);

  const handleCall = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (e: React.MouseEvent, room: RoomListing) => {
    e.stopPropagation();
    let clean = room.contact_phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '255' + clean.slice(1);
    } else if (!clean.startsWith('255')) {
      clean = '255' + clean;
    }
    const msg = encodeURIComponent(
      `Habari Dalali, nimeona tangazo lako la "${room.room_type}" (TZS ${Number(room.price).toLocaleString()}) hapa LopCampus. Bado kiko wazi nifike kukiona?`
    );
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Dalali CTA Banner */}
      {onNavigateBroker && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Building2 className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Je, wewe ni Dalali au Mwenye Nyumba?</h3>
              <p className="text-xs text-emerald-100">
                Weka matangazo ya vyumba vyako bure na video ya sekunde 30 ili uwafikie maelfu ya wanafunzi na wapangaji Tanzania nzima.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateBroker}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-neutral-900 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0"
          >
            <span>Fungua Portal ya Dalali</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-6 sm:p-8 shadow-lg overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/30 border border-blue-300/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Vyumba vya Wanafunzi & Madalali Waaminifu Tanzania</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pata Chumba Safi Karibu na Chuo Chako au Kazini
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed">
            Tazama vyumba vilivyopo mikoani pamoja na video halisi kabla ya kwenda kuangalia, wasiliana na madalali moja kwa moja bila kupoteza muda, na ujionee picha halisi na kodi.
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-neutral-100 text-xs font-bold text-neutral-500 uppercase tracking-wider">
          <span className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Vichungi vya Vyumba</span>
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterVideoOnly(!filterVideoOnly)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                filterVideoOnly
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Video className="w-3 h-3 text-red-500" />
              <span>Zenye Video ({videoCount})</span>
            </button>

            <span className="text-neutral-700 font-semibold text-[11px] sm:text-xs">
              {filteredRooms.length} Vimepatikana
            </span>

            <button
              type="button"
              onClick={onRefresh}
              className="p-1 text-neutral-400 hover:text-blue-600 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sehemu ya Kuchagua Hostel / Vyumba / Frame / Apartment (Juu ya Mkoa - Ndogo & Rahisi Kuonekana) */}
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-neutral-50 p-2 sm:p-2.5 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 shrink-0">
            <span className="text-blue-600">Aina ya Eneo:</span>
            <span className="text-[11px] font-normal text-neutral-500 hidden md:inline">(Chagua kwa haraka)</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300 ring-offset-1 scale-[1.02]'
                      : 'bg-white hover:bg-blue-50 text-neutral-700 border border-neutral-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-xs">{cat.emoji}</span>
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Region */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Mkoa</label>
            <select
              value={selectedRegion}
              onChange={handleRegionChange}
              className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Mikoa Yote --</option>
              {regionNames.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Wilaya</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedRegion}
              className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
            >
              <option value="">{selectedRegion ? '-- Wilaya Zote --' : '-- Chagua Mkoa Kwanza --'}</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Upeo wa Bei (TZS)</label>
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Bei Yoyote</option>
              <option value="60000">Hadi TZS 60,000</option>
              <option value="100000">Hadi TZS 100,000</option>
              <option value="150000">Hadi TZS 150,000</option>
              <option value="250000">Hadi TZS 250,000</option>
              <option value="500000">Hadi TZS 500,000</option>
            </select>
          </div>

          {/* Search query */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Kata / Mtaa / Chuo</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Mf. Mwenge, UDSM, Kikuyu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg pl-8 pr-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>

        {/* University Fast Filter Chips */}
        <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-neutral-500 inline-flex items-center gap-1 mr-1">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>Vyuo Vikuu:</span>
          </span>
          {UNIVERSITIES.map((u) => {
            const isActive = (!u.query && !searchQuery) || (Boolean(u.query) && searchQuery.toLowerCase().includes(u.query));
            return (
              <button
                key={u.name}
                type="button"
                onClick={() => setSearchQuery(u.query)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {u.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Listings Grid */}
      {isLoading && rooms.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500 font-semibold">Inapakia vyumba vinavyopatikana...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-neutral-300">
          <p className="text-neutral-500 text-sm">Hakuna chumba kilichopatikana kwa vigezo hivi.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedRegion('');
              setSelectedDistrict('');
              setMaxPrice('');
              setSearchQuery('');
              setFilterVideoOnly(false);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Onyesha Vyumba Vyote
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => {
              const hasVideo = Boolean(room.video_url);
              const totalImages = getAllRoomImages(room).length;

              return (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room)}
                  className="group bg-white rounded-2xl overflow-hidden border border-neutral-200/90 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
                >
                  {/* Media Container: Photo with Video Play Badge */}
                  <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                    <img
                      src={room.image_url}
                      alt={room.room_type}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    {/* Views & Direct Chat Badge */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <div className="bg-black/65 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Eye className="w-3 h-3" />
                        <span>{room.views || 0}</span>
                      </div>
                    </div>

                    {/* Region Badge */}
                    <div className="absolute bottom-2.5 left-2.5 bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{room.region}</span>
                    </div>

                    {/* Prominent Video Badge / Play Icon if video exists */}
                    {hasVideo && (
                      <div className="absolute top-2.5 left-2.5 bg-red-600/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Video (30s)</span>
                      </div>
                    )}

                    {/* Multi-Photo Count Badge */}
                    {totalImages > 1 && (
                      <div
                        className={`absolute ${
                          hasVideo ? 'top-9' : 'top-2.5'
                        } left-2.5 bg-black/65 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm`}
                      >
                        <Images className="w-3 h-3 text-emerald-400" />
                        <span>{totalImages} Picha</span>
                      </div>
                    )}

                    {/* Center Play Button on hover for videos */}
                    {hasVideo && (
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/95 text-blue-700 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-neutral-900 leading-snug group-hover:text-blue-600 transition-colors">
                          {room.room_type}
                        </h3>
                      </div>

                      <p className="mt-1 font-black text-lg text-emerald-600 tracking-tight">
                        TZS {Number(room.price).toLocaleString()}
                        <span className="text-xs font-normal text-neutral-400 ml-1">/ mwezi</span>
                      </p>

                      <p className="mt-1.5 text-xs text-neutral-600 line-clamp-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span>
                          {room.ward}, {room.district}
                        </span>
                      </p>

                      {room.landmark && (
                        <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5 pl-4">
                          Karibu: {room.landmark}
                        </p>
                      )}

                      {/* 14-Day fresh expiry badge & Comments chip */}
                      <div className="mt-2.5 flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                          <Clock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          <span>Siku {getDaysRemaining(room.created_at)} zimebaki</span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80">
                          <Send className="w-2.5 h-2.5 text-blue-600" />
                          <span>Chat na Dalali</span>
                        </div>
                      </div>
                    </div>

                    {/* Direct Contact Buttons */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectRoom(room)}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        title="Tuma ujumbe wa moja kwa moja kwa dalali"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Chat / Ujumbe</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCall(e, room.contact_phone)}
                        className="py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Piga simu kwa dalali"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Piga</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleWhatsApp(e, room)}
                        className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Tuma ujumbe WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sehemu ya Chini Mwisho wa Post za Vyumba: Kusifia Huduma & Kushukuru LopCampus kwa Kupata Chumba kwa Urahisi */}
      <div className="pt-4 pb-2">
        <LopCampusTestimonialsPraise />
      </div>
    </div>
  );
};
