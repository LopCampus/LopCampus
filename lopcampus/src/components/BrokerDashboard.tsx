import React, { useState, useEffect } from 'react';
import { BrokerProfile, RoomListing } from '../types';
import { updateRoomListing, deleteRoomListing, removeVideoFromRoom, getDaysRemaining, getBrokerUnreadMessagesCount } from '../lib/supabaseClient';
import { getAllRoomImages } from '../lib/constants';
import {
  PlusCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  Video,
  Play,
  RotateCw,
  MapPin,
  Building2,
  Phone,
  Film,
  AlertTriangle,
  Clock,
  X,
  LogOut,
  Images,
  MessageSquare,
  Send
} from 'lucide-react';

interface BrokerDashboardProps {
  brokerProfile: BrokerProfile;
  rooms: RoomListing[];
  isLoading: boolean;
  onRefresh: () => void;
  onNavigatePostRoom: () => void;
  onNavigateStudentView: () => void;
  onNavigateMessages?: () => void;
  onSelectRoom: (room: RoomListing) => void;
  onLogout?: () => void;
}


type ConfirmModalType = 'rented_delete' | 'permanent_delete' | 'remove_video';

interface ConfirmModalState {
  isOpen: boolean;
  type: ConfirmModalType;
  room: RoomListing;
}

export const BrokerDashboard: React.FC<BrokerDashboardProps> = ({
  brokerProfile,
  rooms,
  isLoading,
  onRefresh,
  onNavigatePostRoom,
  onNavigateStudentView,
  onNavigateMessages,
  onSelectRoom,
  onLogout
}) => {
  const [currentRooms, setCurrentRooms] = useState<RoomListing[]>(rooms);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | number | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Keep local rooms state in sync with parent props
  useEffect(() => {
    setCurrentRooms(rooms);
  }, [rooms]);

  const totalViews = currentRooms.reduce((acc, r) => acc + (r.views || 0), 0);
  const activeRooms = currentRooms.filter((r) => r.status === 'active').length;
  const rentedRooms = currentRooms.filter((r) => r.status === 'rented').length;
  const videoRooms = currentRooms.filter((r) => Boolean(r.video_url)).length;

  const showFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleToggleStatus = async (e: React.MouseEvent, room: RoomListing) => {
    e.stopPropagation();
    const newStatus = room.status === 'active' ? 'rented' : 'active';
    // Optimistic update
    setCurrentRooms((prev) =>
      prev.map((r) => (String(r.id) === String(room.id) ? { ...r, status: newStatus } : r))
    );

    const success = await updateRoomListing(room.id, brokerProfile.id, { status: newStatus });
    if (success) {
      showFeedback(
        newStatus === 'rented'
          ? 'Chumba kimewekwa alama ya "Kimepangishwa".'
          : 'Chumba kimerudishwa "Kiko Wazi".'
      );
      onRefresh();
    } else {
      showFeedback('Imeshindikana kubadili hali ya chumba.');
      onRefresh();
    }
  };

  // Trigger modal for normal deletion
  const promptDeleteRoom = (e: React.MouseEvent, room: RoomListing) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      type: 'permanent_delete',
      room
    });
  };

  // Trigger modal for rented & delete
  const promptRentedAndDelete = (e: React.MouseEvent, room: RoomListing) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      type: 'rented_delete',
      room
    });
  };

  // Trigger modal for video removal
  const promptRemoveVideo = (e: React.MouseEvent, room: RoomListing) => {
    e.stopPropagation();
    if (!room.video_url) return;
    setConfirmModal({
      isOpen: true,
      type: 'remove_video',
      room
    });
  };

  // Execute deletion confirmed by broker
  const handleExecuteConfirmedAction = async () => {
    if (!confirmModal) return;
    const { type, room } = confirmModal;
    setIsProcessingAction(true);
    setDeletingRoomId(room.id);

    try {
      if (type === 'permanent_delete' || type === 'rented_delete') {
        // Optimistically remove from UI immediately
        setCurrentRooms((prev) => prev.filter((r) => String(r.id) !== String(room.id)));

        const success = await deleteRoomListing(room.id, brokerProfile.id, room.video_url);

        if (success) {
          showFeedback(
            type === 'rented_delete'
              ? '✅ Safi sana! Tangazo limefutwa mara moja baada ya chumba kupangishwa.'
              : '✅ Tangazo la chumba limefutwa kikamilifu.'
          );
        } else {
          showFeedback('Hitilafu ilitokea wakati wa kufuta.');
        }
      } else if (type === 'remove_video') {
        // Optimistically clear video
        setCurrentRooms((prev) =>
          prev.map((r) =>
            String(r.id) === String(room.id)
              ? {
                  ...r,
                  video_url: null,
                  video_thumbnail_url: null,
                  video_duration: null,
                  video_size: null,
                  video_status: null
                }
              : r
          )
        );

        const ok = await removeVideoFromRoom(room.id, room.video_url || '');
        if (ok) {
          showFeedback('✅ Video ya tangazo hili imefutwa salama.');
        } else {
          showFeedback('Hitilafu ilitokea wakati wa kufuta video.');
        }
      }

      setConfirmModal(null);
      onRefresh();
    } catch (err) {
      console.error('Action execution failed:', err);
      showFeedback('Hitilafu ilitokea. Tafadhali jaribu tena.');
    } finally {
      setIsProcessingAction(false);
      setDeletingRoomId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast feedback */}
      {actionMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-semibold shadow-md flex items-center justify-between animate-fade-in">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-100 hover:text-white ml-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sehemu Ndogo ya Dalali (Kanuni za LopCampus - Sehemu Moja Tu) */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 sm:p-3.5 space-y-2 text-xs text-amber-950 shadow-2xs">
        <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Maelekezo Muhimu ya Uendeshaji (Kanuni za LopCampus):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-0.5">
          <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 space-y-1">
            <span className="font-bold text-rose-700 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>1. Chumba Kikipangishwa / Ukiuza:</span>
            </span>
            <p className="text-neutral-700 leading-snug">
              Tafadhali kifute mara moja kwa kubonyeza kitufe chekundu cha <strong className="text-rose-700">"Kimepangishwa (Futa Sasa)"</strong> ili kulinda heshima yako na kuzuia wateja wengine kukupigia simu bure.
            </p>
          </div>

          <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 space-y-1">
            <span className="font-bold text-amber-800 flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>2. Kufutika Kiotomatiki (Wiki 2 / Siku 14):</span>
            </span>
            <p className="text-neutral-700 leading-snug">
              Kila tangazo linafutika lenyewe kiotomatiki baada ya <strong>wiki 2</strong> tangu kupakiwa ili kuhakikisha wanafunzi wanaona vyumba vilivyopo hewani pekee.
            </p>
          </div>
        </div>
      </div>

      {/* Dalali Profile & Quick Actions Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
            {brokerProfile.full_name?.charAt(0) || 'D'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 truncate">
                {brokerProfile.full_name}
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Dalali Aliyethibitishwa
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-mono">
              Simu: {brokerProfile.phone_number || 'Imehifadhiwa'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
          {onNavigateMessages && (
            <button
              type="button"
              onClick={onNavigateMessages}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Jumbe za Wateja</span>
              {getBrokerUnreadMessagesCount(brokerProfile.id) > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {getBrokerUnreadMessagesCount(brokerProfile.id)} Mpya
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateStudentView}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <span>Tazama Vyumba</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              title="Toka kwenye akaunti ya Dalali"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Toka (Logout)</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase">Vyumba Vyote</span>
          <p className="text-2xl font-black text-neutral-900 mt-1">{rooms.length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase">Viko Wazi</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeRooms}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase">Vimepangishwa</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{rentedRooms}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase">Jumla ya Views</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{totalViews}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-neutral-900">Vyumba Vyako Ulivyopost</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
            {currentRooms.length}
          </span>
          {videoRooms > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1">
              <Film className="w-3 h-3" />
              <span>{videoRooms} Vina Video</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onNavigatePostRoom}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Weka Chumba Kipya</span>
          </button>
        </div>
      </div>

      {/* Rooms List */}
      {isLoading && currentRooms.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500">Inapakia matangazo yako ya vyumba...</p>
        </div>
      ) : currentRooms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-neutral-300 space-y-3">
          <Building2 className="w-10 h-10 text-neutral-400 mx-auto" />
          <h3 className="font-bold text-neutral-800 text-base">Hujachapisha chumba chochote bado</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Weka chumba chako cha kwanza bure chenye picha na video ya sekunde 30 ili kianze kuonekana kwa maelfu ya wanafunzi nchini kote.
          </p>
          <button
            type="button"
            onClick={onNavigatePostRoom}
            className="mt-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Weka Chumba cha Kwanza
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentRooms.map((room) => {
            const hasVideo = Boolean(room.video_url);

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row cursor-pointer group"
              >
                {/* Media thumbnail */}
                <div className="relative sm:w-44 h-40 sm:h-auto bg-neutral-900 shrink-0 overflow-hidden">
                  <img
                    src={room.image_url}
                    alt={room.room_type}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {hasVideo && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Video 30s</span>
                    </div>
                  )}

                  {getAllRoomImages(room).length > 1 && (
                    <div
                      className={`absolute ${
                        hasVideo ? 'top-7' : 'top-2'
                      } left-2 bg-black/65 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs`}
                    >
                      <Images className="w-3 h-3 text-emerald-400" />
                      <span>{getAllRoomImages(room).length} Picha</span>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs">
                    <Eye className="w-3 h-3" />
                    <span>{room.views || 0} views</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-neutral-900 group-hover:text-blue-600 transition-colors">
                        {room.room_type}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          room.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {room.status === 'active' ? 'Kiko Wazi' : 'Kimepangishwa'}
                      </span>
                    </div>

                    <p className="text-base font-black text-emerald-600 mt-0.5">
                      TZS {Number(room.price).toLocaleString()}
                      <span className="text-xs font-normal text-neutral-400 ml-1">/ mwezi</span>
                    </p>

                    <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>
                        {room.ward}, {room.district}
                      </span>
                    </p>

                    {/* Expiry countdown badge (Wiki 2) & Direct Chat status */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>
                          Zimebaki siku <strong>{getDaysRemaining(room.created_at)}</strong> (Wiki 2)
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">
                        <Send className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>Chat Moja kwa Moja</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => promptRentedAndDelete(e, room)}
                        disabled={deletingRoomId === room.id || isProcessingAction}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Bofya chumba kikiuzwa au kikipangishwa ili kifutwe mara moja"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kimepangishwa (Futa Sasa)</span>
                      </button>

                      {onNavigateMessages && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateMessages();
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                          title="Tazama jumbe na maulizo ya wateja kuhusu chumba hiki"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>Ujumbe</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasVideo && (
                        <button
                          type="button"
                          onClick={(e) => promptRemoveVideo(e, room)}
                          disabled={deletingRoomId === room.id || isProcessingAction}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Futa video pekee"
                        >
                          <Film className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => promptDeleteRoom(e, room)}
                        disabled={deletingRoomId === room.id || isProcessingAction}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Futa tangazo lote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive In-App Confirmation Modal (Haitumii window.confirm inayozuiwa na browser) */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => {
            if (!isProcessingAction) setConfirmModal(null);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    confirmModal.type === 'rented_delete'
                      ? 'bg-rose-100 text-rose-600'
                      : confirmModal.type === 'remove_video'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {confirmModal.type === 'rented_delete' ? (
                    <CheckCircle2 className="w-5 h-5 text-rose-600" />
                  ) : confirmModal.type === 'remove_video' ? (
                    <Film className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-neutral-900 text-base">
                    {confirmModal.type === 'rented_delete'
                      ? 'Kimepangishwa (Futa Sasa)'
                      : confirmModal.type === 'remove_video'
                      ? 'Futa Video ya Tangazo'
                      : 'Futa Tangazo la Chumba'}
                  </h3>
                  <p className="text-xs text-neutral-500 font-semibold line-clamp-1">
                    {confirmModal.room.room_type}
                  </p>
                </div>
              </div>

              {!isProcessingAction && (
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 leading-relaxed space-y-1.5">
              {confirmModal.type === 'rented_delete' ? (
                <>
                  <p className="font-semibold text-rose-700">
                    🎉 Hongera kwa kupata mpangaji au kuuza chumba hiki!
                  </p>
                  <p>
                    Kufuta tangazo mara moja kuzuia wateja wapya kukupigia simu bure na kunalinda heshima yako kwenye mfumo wa LopCampus.
                  </p>
                </>
              ) : confirmModal.type === 'remove_video' ? (
                <p>
                  Una uhakika unataka kuondoa video ya sekunde 30 kwenye tangazo hili? Picha na maelezo mengine ya chumba yatabaki mtandaoni.
                </p>
              ) : (
                <p>
                  Una uhakika unataka kufuta kabisa tangazo hili? Tangazo litaondolewa hewani na halitaonekana tena kwa wanafunzi.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Ghairi
              </button>

              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                disabled={isProcessingAction}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  confirmModal.type === 'remove_video'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } ${isProcessingAction ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isProcessingAction ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Inafuta...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {confirmModal.type === 'rented_delete'
                        ? 'Ndiyo, Futa Mara Moja'
                        : confirmModal.type === 'remove_video'
                        ? 'Ndiyo, Futa Video'
                        : 'Ndiyo, Futa Tangazo'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
