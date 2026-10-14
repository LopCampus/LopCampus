import React, { useState, useEffect, useRef } from 'react';
import { RoomListing } from '../types';
import { RoomVideoPlayer } from './RoomVideoPlayer';
import { LopCampusTestimonialsPraise } from './LopCampusTestimonialsPraise';
import { RoomDirectChatModal } from './RoomDirectChatModal';
import { getDaysRemaining } from '../lib/supabaseClient';
import {
  X,
  Share2,
  Phone,
  MessageSquare,
  MapPin,
  Eye,
  AlertTriangle,
  Check,
  Video,
  Image as ImageIcon,
  Clock,
  Info,
  Send
} from 'lucide-react';

interface RoomDetailsModalProps {
  room: RoomListing | null;
  currentBrokerId?: string;
  onClose: () => void;
  onReport: (room: RoomListing) => void;
}

export const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  room,
  currentBrokerId,
  onClose,
  onReport
}) => {
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'video' | 'photo'>(
    room?.video_url ? 'video' : 'photo'
  );
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Pale mtu anapofungua chumba, mbele ibaki video (kama ipo), vinginevyo picha na scroll ianzie juu kabisa
  useEffect(() => {
    setActiveMediaTab(room?.video_url ? 'video' : 'photo');
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  }, [room?.id, room?.video_url]);

  if (!room) return null;

  const hasVideo = Boolean(room.video_url);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `LopCampus: ${room.room_type}`,
          text: `Chumba kizuri ${room.ward}, ${room.district} - TZS ${Number(room.price).toLocaleString()}/mwezi`,
          url: window.location.href
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${room.contact_phone}`;
  };

  const handleWhatsApp = () => {
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
    <div
      ref={modalScrollRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-2 sm:p-5 animate-in fade-in"
    >
      <div className="min-h-full flex items-start sm:items-center justify-center py-2 sm:py-6">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200">
        {/* Floating Top Action Buttons */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          {copied && (
            <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Imenakiliwa!</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
            title="Shiriki tangazo"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
            title="Funga"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Container: Video Player or Photo Banner */}
        <div className="relative bg-neutral-900 w-full overflow-hidden">
          {hasVideo && (
            <div className="absolute top-3 left-3 z-30 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/20">
              <button
                type="button"
                onClick={() => setActiveMediaTab('video')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeMediaTab === 'video'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-red-400" />
                <span>Video (30s)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMediaTab('photo')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeMediaTab === 'photo'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Picha</span>
              </button>
            </div>
          )}

          {hasVideo && activeMediaTab === 'video' ? (
            <div className="relative w-full h-72 sm:h-80 md:h-96">
              <RoomVideoPlayer
                videoUrl={room.video_url!}
                thumbnailUrl={room.video_thumbnail_url || room.image_url}
                duration={room.video_duration || 30}
                title={room.room_type}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="relative w-full h-72 sm:h-80 md:h-96">
              <img
                src={room.image_url}
                alt={room.room_type}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600/90 text-xs font-semibold mb-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {room.region} • {room.district}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black drop-shadow-md">{room.room_type}</h2>
                </div>

                <div className="text-right">
                  <span className="text-xs text-neutral-300 block">Kodi kwa mwezi</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 drop-shadow-md">
                    TZS {Number(room.price).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* If video was shown above, show title and price bar */}
          {hasVideo && activeMediaTab === 'video' && (
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-neutral-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {room.region} • {room.district}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900">{room.room_type}</h2>
              </div>

              <div className="text-right">
                <span className="text-xs text-neutral-500 block">Kodi kwa mwezi</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600">
                  TZS {Number(room.price).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Location Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
            <div>
              <span className="text-neutral-500 block">Kata / Mtaa:</span>
              <span className="font-bold text-neutral-800">{room.ward || 'Haijatajwa'}</span>
            </div>

            <div>
              <span className="text-neutral-500 block">Eneo la Karibu / Chuo:</span>
              <span className="font-bold text-neutral-800">{room.landmark || 'Halijatajwa'}</span>
            </div>

            <div>
              <span className="text-neutral-500 block">Muda wa Tangazo:</span>
              <span className="font-bold text-neutral-800">Siku 14 (Wiki 2)</span>
            </div>
          </div>

          {/* Expiry & Broker Guidance Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Tangazo hili linafutika kiotomatiki baada ya siku <strong>{getDaysRemaining(room.created_at)}</strong> (Utaratibu wa wiki 2).
              </span>
            </div>
            <p className="text-neutral-600 text-[11px] leading-relaxed">
              Dalali anapaswa kufuta tangazo mara moja pindi chumba kinapopata mpangaji ili wateja wengine wasipoteze muda kupiga simu.
            </p>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Maelezo ya Chumba
            </h4>
            <p className="text-sm text-neutral-600 leading-relaxed bg-white border border-neutral-200 rounded-xl p-3.5 whitespace-pre-wrap">
              {room.description ||
                'Chumba hiki kipo katika hali nzuri ya usafi na mazingira salama. Wasiliana na dalali au mwenye nyumba kwa namba zilizopo hapa chini kupata maelekezo zaidi na kufanya ukaguzi.'}
            </p>
          </div>

          {/* Broker Contact Information */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs text-blue-600 font-bold block">Mawasiliano ya Dalali / Mwenye Nyumba:</span>
              <span className="text-base sm:text-lg font-black text-neutral-900 font-mono">
                {room.contact_phone}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ring-2 ring-blue-300"
                title="Tuma ujumbe wa moja kwa moja kwa dalali"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Tuma Ujumbe (Chat)</span>
              </button>

              <button
                type="button"
                onClick={handleCall}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Piga Simu</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Direct Chat Modal between Customer & Broker */}
          {isChatOpen && (
            <RoomDirectChatModal
              room={room}
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
            />
          )}


          {/* Sehemu ya Kusifia Huduma & Kushukuru LopCampus (Badala ya mfumo wa maoni & maswali) */}
          <div className="pt-2">
            <LopCampusTestimonialsPraise />
          </div>

          {/* Bottom Footer: Report listing */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>Views: {room.views || 0}</span>
            </div>

            <button
              type="button"
              onClick={() => onReport(room)}
              className="text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Ripoti tangazo hili (Utapeli au Taarifa potofu)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
