import React, { useState, useEffect, useRef } from 'react';
import { RoomListing, StudentAccount, RoomMessage } from '../types';
import {
  fetchConversationMessages,
  sendRoomMessage,
  markConversationAsRead,
  getLoggedStudent,
  logoutStudentAccount
} from '../lib/supabaseClient';
import { StudentAuthModal } from './StudentAuthModal';
import {
  X,
  Send,
  User,
  ShieldCheck,
  Phone,
  Clock,
  Sparkles,
  MessageSquare,
  Lock,
  ArrowRight,
  CheckCheck,
  AlertCircle
} from 'lucide-react';

interface RoomDirectChatModalProps {
  room: RoomListing;
  isOpen: boolean;
  onClose: () => void;
  initialStudent?: StudentAccount | null;
}

const QUICK_PROMPTS = [
  'Je, chumba bado kipo wazi?',
  'Naweza kuja kukiona lini?',
  'Kodi inalipwa kwa miezi mingapi?',
  'Je kuna maji masaa 24 na umeme?',
  'Kodi inaweza kupungua kidogo?'
];

export const RoomDirectChatModal: React.FC<RoomDirectChatModalProps> = ({
  room,
  isOpen,
  onClose,
  initialStudent = null
}) => {
  const [currentStudent, setCurrentStudent] = useState<StudentAccount | null>(() => {
    return initialStudent || getLoggedStudent();
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Sync logged student
  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentStudent(getLoggedStudent());
    };
    window.addEventListener('lopcampus_student_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('lopcampus_student_auth_change', handleAuthChange);
    };
  }, []);

  // Load conversation messages
  const loadMessages = async () => {
    if (!currentStudent) return;
    const msgs = await fetchConversationMessages(room.id, currentStudent.id);
    setMessages(msgs);
    // Mark as read by student
    markConversationAsRead(room.id, currentStudent.id, 'student');
  };

  useEffect(() => {
    if (isOpen && currentStudent) {
      loadMessages();
    }
  }, [isOpen, currentStudent, room.id]);

  // Listen for message events (real-time updates from broker replies)
  useEffect(() => {
    const handleMessageEvent = () => {
      if (isOpen && currentStudent) {
        loadMessages();
      }
    };
    window.addEventListener('lopcampus_message_event', handleMessageEvent);
    return () => {
      window.removeEventListener('lopcampus_message_event', handleMessageEvent);
    };
  }, [isOpen, currentStudent, room.id]);

  // Auto-scroll inside chat body only (bila kusukuma window ya browser chini)
  useEffect(() => {
    if (chatBodyRef.current && messages.length > 0) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || !currentStudent || isSending) return;

    setIsSending(true);
    try {
      const sent = await sendRoomMessage({
        room_id: room.id,
        room_title: room.room_type,
        room_price: room.price,
        room_image: room.image_url,
        broker_id: room.broker_id,
        student_id: currentStudent.id,
        student_username: currentStudent.username,
        student_phone: currentStudent.phone_number,
        sender_type: 'student',
        sender_name: currentStudent.full_name || `@${currentStudent.username}`,
        content: content
      });

      setInputText('');
      setMessages((prev) => [...prev, sent]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="bg-white rounded-2xl max-w-lg w-full h-[90vh] max-h-[700px] shadow-2xl flex flex-col overflow-hidden border border-neutral-200 animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-3.5 sm:p-4 shrink-0 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={room.image_url}
                  alt={room.room_type}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/20 shadow-xs"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold truncate block">
                      {room.room_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-100 flex-wrap">
                    <span className="font-extrabold text-yellow-300">
                      TZS {room.price.toLocaleString()}
                      <span className="text-[10px] text-blue-200 font-normal">/mwezi</span>
                    </span>
                    <span>•</span>
                    <span className="truncate">{room.ward}, {room.district}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer shrink-0"
                aria-label="Funga mazungumzo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current user info bar */}
            {currentStudent ? (
              <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-blue-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Umeingia kama:</span>
                  <span className="font-mono font-bold text-white bg-white/20 px-2 py-0.5 rounded-md">
                    @{currentStudent.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logoutStudentAccount();
                    setCurrentStudent(null);
                  }}
                  className="text-[11px] text-blue-200 hover:text-white underline cursor-pointer"
                >
                  Badili Akaunti
                </button>
              </div>
            ) : (
              <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-xs">
                <span className="text-yellow-200 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unahitaji kuingia ili kutuma ujumbe</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-yellow-400 hover:bg-yellow-300 text-neutral-900 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Weka Username & Password
                </button>
              </div>
            )}
          </div>

          {/* Chat Messages Body */}
          <div ref={chatBodyRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/70">
            {/* If user not logged in */}
            {!currentStudent ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-neutral-900">
                    Wasiliana moja kwa moja na Dalali
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                    Ili kutuma ujumbe na kupokea majibu ya chumba hiki, weka Username na Nenosiri lako (au fungua akaunti ya sekunde 5).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>Ingia au Jisajili kama Mwanafunzi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-neutral-500">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-800">
                    Bado hujaanza mazungumzo na dalali wa chumba hiki
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Uliza swali lolote kuhusu kodi, mazingira au ratiba ya kukiona chumba.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_type === 'student';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
                      <span className="font-semibold text-neutral-600">
                        {isMe ? 'Wewe' : 'Dalali'}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-white text-neutral-900 border border-neutral-200/90 rounded-tl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>

                    {isMe && (
                      <span className="text-[10px] text-neutral-400 flex items-center gap-0.5 px-1">
                        <CheckCheck className={`w-3 h-3 ${msg.read_by_broker ? 'text-blue-500' : 'text-neutral-400'}`} />
                        <span>{msg.read_by_broker ? 'Imeonwa na Dalali' : 'Imeenda'}</span>
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Suggestions Chips (only if logged in) */}
          {currentStudent && (
            <div className="px-3 py-2 bg-neutral-100/90 border-t border-neutral-200 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
              <span className="text-[10px] font-bold text-neutral-500 uppercase shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>Maswali:</span>
              </span>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isSending}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-neutral-700 text-xs rounded-lg border border-neutral-200 shadow-2xs whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          {currentStudent ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Andika ujumbe wako kwa dalali hapa..."
                className="flex-1 py-2.5 px-4 text-xs sm:text-sm bg-neutral-100 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Tuma</span>
              </button>
            </form>
          ) : (
            <div className="p-3 bg-neutral-100 border-t border-neutral-200 text-center text-xs text-neutral-600">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="text-blue-600 font-bold underline cursor-pointer"
              >
                Bonyeza hapa kuweka Username na Password ili kuanza mazungumzo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Student Login / Register Modal */}
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(stud) => {
          setCurrentStudent(stud);
          setIsAuthModalOpen(false);
        }}
        title="Ingia ili Kuwasiliana na Dalali"
        subtitle={`Wasiliana kuhusu chumba cha ${room.ward} (${room.room_type})`}
      />
    </>
  );
};
