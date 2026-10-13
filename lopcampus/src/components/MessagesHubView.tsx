import React, { useState, useEffect, useRef } from 'react';
import {
  BrokerProfile,
  StudentAccount,
  RoomListing,
  RoomMessage,
  ConversationSummary
} from '../types';
import {
  fetchMessagesForBroker,
  fetchMessagesForStudent,
  sendRoomMessage,
  markConversationAsRead,
  getGroupedBrokerConversations,
  getGroupedStudentConversations,
  getBrokerUnreadMessagesCount,
  getStudentUnreadMessagesCount,
  getLoggedStudent,
  logoutStudentAccount
} from '../lib/supabaseClient';
import { StudentAuthModal } from './StudentAuthModal';
import {
  MessageSquare,
  Send,
  Phone,
  User,
  CheckCheck,
  Sparkles,
  Building2,
  Filter,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Search,
  ExternalLink,
  ShieldCheck,
  Home
} from 'lucide-react';

interface MessagesHubViewProps {
  brokerProfile: BrokerProfile | null;
  rooms: RoomListing[];
  onSelectRoom?: (room: RoomListing) => void;
  onNavigateHome: () => void;
  onNavigateBrokerLogin: () => void;
}

const BROKER_QUICK_REPLIES = [
  'Ndiyo, chumba bado kipo wazi kabisa! Karibu.',
  'Unaweza kuja kukiona leo jioni au kesho mchana.',
  'Kodi inalipwa kuanzia miezi sita (6).',
  'Maji na umeme wa Luku vinajitegemea.',
  'Tafadhali nipigie simu moja kwa moja kwa maelekezo zaidi.'
];

export const MessagesHubView: React.FC<MessagesHubViewProps> = ({
  brokerProfile,
  rooms,
  onSelectRoom,
  onNavigateHome,
  onNavigateBrokerLogin
}) => {
  // Mode: can be 'broker' if brokerProfile exists, or 'student'
  const [activeTab, setActiveTab] = useState<'broker' | 'student'>(() => {
    return brokerProfile ? 'broker' : 'student';
  });

  const [studentUser, setStudentUser] = useState<StudentAccount | null>(() => getLoggedStudent());
  const [isStudentAuthOpen, setIsStudentAuthOpen] = useState(false);

  // Broker filter by specific room
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active selected conversation
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync tab if brokerProfile changes
  useEffect(() => {
    if (brokerProfile && activeTab !== 'broker') {
      setActiveTab('broker');
    }
  }, [brokerProfile]);

  // Sync student auth listener
  useEffect(() => {
    const handleAuthChange = () => {
      setStudentUser(getLoggedStudent());
    };
    window.addEventListener('lopcampus_student_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('lopcampus_student_auth_change', handleAuthChange);
    };
  }, []);

  // Reload conversations
  const loadConversations = () => {
    if (activeTab === 'broker' && brokerProfile) {
      const convs = getGroupedBrokerConversations(brokerProfile.id, rooms);
      setConversations(convs);

      // Keep selected conversation up to date
      if (selectedConversation) {
        const found = convs.find((c) => c.conversation_id === selectedConversation.conversation_id);
        if (found) {
          setSelectedConversation(found);
          markConversationAsRead(found.room_id, found.student_id, 'broker');
        }
      }
    } else if (activeTab === 'student' && studentUser) {
      const convs = getGroupedStudentConversations(studentUser.id);
      setConversations(convs);

      if (selectedConversation) {
        const found = convs.find((c) => c.conversation_id === selectedConversation.conversation_id);
        if (found) {
          setSelectedConversation(found);
          markConversationAsRead(found.room_id, found.student_id, 'student');
        }
      }
    } else {
      setConversations([]);
      setSelectedConversation(null);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [activeTab, brokerProfile, studentUser, rooms]);

  // Listen to message events
  useEffect(() => {
    const handleMessageEvent = () => {
      loadConversations();
    };
    window.addEventListener('lopcampus_message_event', handleMessageEvent);
    return () => {
      window.removeEventListener('lopcampus_message_event', handleMessageEvent);
    };
  }, [activeTab, brokerProfile, studentUser, selectedConversation]);

  // Scroll to bottom when conversation messages change
  useEffect(() => {
    if (selectedConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages.length]);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Room filter (for broker)
    if (activeTab === 'broker' && selectedRoomFilter !== 'all') {
      if (String(c.room_id) !== String(selectedRoomFilter)) {
        return false;
      }
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.student_username?.toLowerCase().includes(q);
      const matchRoom = c.room_title?.toLowerCase().includes(q);
      const matchMsg = c.last_message?.toLowerCase().includes(q);
      const matchPhone = c.student_phone?.includes(q);
      return matchName || matchRoom || matchMsg || matchPhone;
    }
    return true;
  });

  // Distinct rooms from broker listings that have conversations
  const brokerRoomsWithMessages = Array.from(
    new Set(conversations.map((c) => String(c.room_id)))
  );

  const handleSelectConversation = (conv: ConversationSummary) => {
    setSelectedConversation(conv);
    if (activeTab === 'broker') {
      markConversationAsRead(conv.room_id, conv.student_id, 'broker');
    } else {
      markConversationAsRead(conv.room_id, conv.student_id, 'student');
    }
  };

  const handleSendReply = async (textToSend?: string) => {
    const content = (textToSend || replyText).trim();
    if (!content || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      if (activeTab === 'broker' && brokerProfile) {
        await sendRoomMessage({
          room_id: selectedConversation.room_id,
          room_title: selectedConversation.room_title,
          room_price: selectedConversation.room_price,
          room_image: selectedConversation.room_image,
          broker_id: brokerProfile.id,
          student_id: selectedConversation.student_id,
          student_username: selectedConversation.student_username,
          student_phone: selectedConversation.student_phone,
          sender_type: 'broker',
          sender_name: brokerProfile.full_name || 'Dalali',
          content: content
        });
      } else if (activeTab === 'student' && studentUser) {
        await sendRoomMessage({
          room_id: selectedConversation.room_id,
          room_title: selectedConversation.room_title,
          room_price: selectedConversation.room_price,
          room_image: selectedConversation.room_image,
          broker_id: selectedConversation.broker_id,
          student_id: studentUser.id,
          student_username: studentUser.username,
          student_phone: studentUser.phone_number,
          sender_type: 'student',
          sender_name: studentUser.full_name || `@${studentUser.username}`,
          content: content
        });
      }

      setReplyText('');
      loadConversations();
    } finally {
      setIsSending(false);
    }
  };

  const brokerUnreadTotal = brokerProfile ? getBrokerUnreadMessagesCount(brokerProfile.id) : 0;
  const studentUnreadTotal = studentUser ? getStudentUnreadMessagesCount(studentUser.id) : 0;

  return (
    <div className="space-y-4">
      {/* Top Header & Role Switcher */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900">
              Kituo cha Jumbe na Mazungumzo (Chat)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500">
            Wasiliana moja kwa moja kuhusu vyumba, ratiba ya kuona chumba na makubaliano ya kodi.
          </p>
        </div>

        {/* Tab switchers: Dalali vs Mteja */}
        <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-xl self-start md:self-auto shrink-0">
          {brokerProfile && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('broker');
                setSelectedConversation(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'broker'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Jumbe za Dalali</span>
              {brokerUnreadTotal > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {brokerUnreadTotal}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setSelectedConversation(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'student'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Jumbe za Mwanafunzi / Mteja</span>
            {studentUnreadTotal > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {studentUnreadTotal}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Messaging Layout */}
      {activeTab === 'broker' ? (
        /* BROKER PERSPECTIVE */
        !brokerProfile ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <LogIn className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Ingia kama Dalali</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Ili kuona jumbe kutoka kwa wateja walioulizia vyumba vyako, ingia kwenye akaunti yako ya dalali.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateBrokerLogin}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-neutral-900 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Fungua Portal ya Dalali
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden flex flex-col md:flex-row h-[700px] max-h-[80vh]">
            {/* Left Pane: Conversation List */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-neutral-200 flex flex-col bg-neutral-50/50 ${
                selectedConversation ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Room filter selector: "kuona jumbe kutoka kwa kila chumba" */}
              <div className="p-3 border-b border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-blue-600" />
                    <span>Chuja kwa Chumba:</span>
                  </span>
                  <span className="text-[11px] font-bold text-neutral-500">
                    {filteredConversations.length} Mazungumzo
                  </span>
                </div>

                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">Vyumba Vyote Ulivyopost ({conversations.length})</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.ward} - {r.room_type} (TZS {r.price.toLocaleString()})
                    </option>
                  ))}
                  {/* Also show any sample rooms if not in broker list */}
                  {brokerRoomsWithMessages
                    .filter((rId) => !rooms.some((r) => String(r.id) === rId))
                    .map((rId) => (
                      <option key={rId} value={rId}>
                        Chumba #{rId} (Mawasiliano yaliyopokelewa)
                      </option>
                    ))}
                </select>

                {/* Search bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tafuta mteja au ujumbe..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center space-y-2 text-neutral-400">
                    <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
                    <p className="text-xs font-medium text-neutral-600">Hakuna jumbe kwa sasa</p>
                    <p className="text-[11px] text-neutral-400">
                      Wanafunzi wakituma ujumbe kwenye vyumba vyako utaziona hapa mara moja.
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = selectedConversation?.conversation_id === conv.conversation_id;
                    const hasUnread = conv.unread_for_broker > 0;

                    return (
                      <div
                        key={conv.conversation_id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`p-3 transition-colors cursor-pointer flex gap-3 items-start relative ${
                          isSelected
                            ? 'bg-blue-50/80 border-l-4 border-blue-600'
                            : hasUnread
                            ? 'bg-amber-50/60 hover:bg-amber-100/40'
                            : 'hover:bg-neutral-100/70 bg-white'
                        }`}
                      >
                        {/* Student avatar */}
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                            {conv.student_username?.charAt(0).toUpperCase() || 'M'}
                          </div>
                          {hasUnread && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white ring-1 ring-rose-300" />
                          )}
                        </div>

                        {/* Content snippet */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-neutral-900 truncate">
                              @{conv.student_username}
                            </span>
                            <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                              {new Date(conv.last_message_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Room Badge */}
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-neutral-500">
                            <span className="bg-neutral-100 text-neutral-700 font-semibold px-1.5 py-0.2 rounded-md truncate max-w-[140px]">
                              {conv.room_title}
                            </span>
                            {conv.room_price && (
                              <span className="text-emerald-700 font-bold whitespace-nowrap">
                                TZS {conv.room_price.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Last message text */}
                          <p className="text-xs text-neutral-600 truncate mt-1">
                            {conv.last_message}
                          </p>

                          {hasUnread && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                {conv.unread_for_broker} Mpya
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Active Chat Window */}
            <div
              className={`flex-1 flex flex-col bg-white ${
                !selectedConversation ? 'hidden md:flex' : 'flex'
              }`}
            >
              {!selectedConversation ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-neutral-400">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-800">
                      Chagua mazungumzo upande wa kushoto
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                      Unaweza kuchagua chumba chochote na kuona jumbe kutoka kwa wateja, kisha kujibu mara moja.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-3.5 sm:p-4 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Back button for mobile */}
                      <button
                        type="button"
                        onClick={() => setSelectedConversation(null)}
                        className="p-1 rounded-lg text-neutral-600 hover:bg-neutral-200 md:hidden cursor-pointer"
                        aria-label="Rudi nyuma"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      {selectedConversation.room_image && (
                        <img
                          src={selectedConversation.room_image}
                          alt={selectedConversation.room_title}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-neutral-200"
                        />
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                            Mteja: @{selectedConversation.student_username}
                          </h4>
                        </div>
                        <p className="text-xs text-neutral-500 truncate">
                          Chumba: {selectedConversation.room_title}
                          {selectedConversation.room_price && ` (TZS ${selectedConversation.room_price.toLocaleString()})`}
                        </p>
                      </div>
                    </div>

                    {/* Quick Call Action if student provided phone */}
                    {selectedConversation.student_phone && (
                      <a
                        href={`tel:${selectedConversation.student_phone}`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Piga: {selectedConversation.student_phone}</span>
                        <span className="sm:hidden">Piga</span>
                      </a>
                    )}
                  </div>

                  {/* Messages Bubble List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-100/50">
                    {selectedConversation.messages.map((msg) => {
                      const isBroker = msg.sender_type === 'broker';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isBroker ? 'items-end' : 'items-start'} space-y-1`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
                            <span className="font-semibold text-neutral-600">
                              {isBroker ? 'Wewe (Dalali)' : `@${msg.student_username}`}
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
                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                              isBroker
                                ? 'bg-blue-600 text-white rounded-tr-xs'
                                : 'bg-white text-neutral-900 border border-neutral-200/90 rounded-tl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Broker Quick Reply Templates */}
                  <div className="p-2 bg-neutral-50 border-t border-neutral-200 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase shrink-0 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Majibu ya Haraka:</span>
                    </span>
                    {BROKER_QUICK_REPLIES.map((reply, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendReply(reply)}
                        disabled={isSending}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-neutral-700 text-xs rounded-lg border border-neutral-200 shadow-2xs whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>

                  {/* Reply Input Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendReply();
                    }}
                    className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Jibu ujumbe wa @${selectedConversation.student_username}...`}
                      className="flex-1 py-2.5 px-4 text-xs sm:text-sm bg-neutral-100 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      disabled={isSending}
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || isSending}
                      className="p-2.5 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Jibu</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )
      ) : (
        /* STUDENT / CUSTOMER PERSPECTIVE */
        !studentUser ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                Akaunti ya Mwanafunzi / Mteja
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Weka Username na Password ili kuona jumbe zako zote, majibu ya madalali, na kuendelea kuwasiliana.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsStudentAuthOpen(true)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Weka Username & Password (Ingia / Jisajili)</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden flex flex-col md:flex-row h-[700px] max-h-[80vh]">
            {/* Left Pane: Student conversations list */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-neutral-200 flex flex-col bg-neutral-50/50 ${
                selectedConversation ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="p-3.5 border-b border-neutral-200 bg-white flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-800">
                    Mazungumzo Yako ({conversations.length})
                  </span>
                  <p className="text-[10px] text-neutral-400">
                    Akaunti: @{studentUser.username}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logoutStudentAccount();
                    setStudentUser(null);
                  }}
                  className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Toka
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center space-y-3 text-neutral-400">
                    <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
                    <p className="text-xs font-bold text-neutral-700">
                      Bado hujaulizia chumba chochote
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Nenda kwenye ukurasa wa vyumba na ubonyeze "Tuma Ujumbe kwa Dalali" kuanza.
                    </p>
                    <button
                      type="button"
                      onClick={onNavigateHome}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold mt-2"
                    >
                      Tazama Vyumba Sasa
                    </button>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = selectedConversation?.conversation_id === conv.conversation_id;
                    const hasUnread = conv.unread_for_student > 0;

                    return (
                      <div
                        key={conv.conversation_id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`p-3 transition-colors cursor-pointer flex gap-3 items-start relative ${
                          isSelected
                            ? 'bg-blue-50/80 border-l-4 border-blue-600'
                            : hasUnread
                            ? 'bg-emerald-50/60 hover:bg-emerald-100/40'
                            : 'hover:bg-neutral-100/70 bg-white'
                        }`}
                      >
                        {conv.room_image ? (
                          <img
                            src={conv.room_image}
                            alt={conv.room_title}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-neutral-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                            LC
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-neutral-900 truncate">
                              {conv.room_title}
                            </span>
                            <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                              {new Date(conv.last_message_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {conv.room_price && (
                            <span className="text-[10px] text-emerald-700 font-bold block">
                              TZS {conv.room_price.toLocaleString()}/mwezi
                            </span>
                          )}

                          <p className="text-xs text-neutral-600 truncate mt-1">
                            {conv.last_message}
                          </p>

                          {hasUnread && (
                            <span className="mt-1 inline-block bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                              Dalali Amejibu!
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Student active chat */}
            <div
              className={`flex-1 flex flex-col bg-white ${
                !selectedConversation ? 'hidden md:flex' : 'flex'
              }`}
            >
              {!selectedConversation ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-neutral-400">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-800">
                      Chagua mazungumzo kuona majibu ya dalali
                    </h3>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3.5 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedConversation(null)}
                        className="p-1 rounded-lg text-neutral-600 hover:bg-neutral-200 md:hidden cursor-pointer"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      {selectedConversation.room_image && (
                        <img
                          src={selectedConversation.room_image}
                          alt={selectedConversation.room_title}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-neutral-200"
                        />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                          {selectedConversation.room_title}
                        </h4>
                        <span className="text-xs text-emerald-600 font-bold">
                          {selectedConversation.room_price && `TZS ${selectedConversation.room_price.toLocaleString()}/mwezi`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-100/50">
                    {selectedConversation.messages.map((msg) => {
                      const isStudent = msg.sender_type === 'student';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'} space-y-1`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
                            <span className="font-semibold text-neutral-600">
                              {isStudent ? 'Wewe' : 'Dalali'}
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
                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                              isStudent
                                ? 'bg-blue-600 text-white rounded-tr-xs'
                                : 'bg-white text-neutral-900 border border-neutral-200/90 rounded-tl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Student reply input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendReply();
                    }}
                    className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Andika swali au jibu lako hapa..."
                      className="flex-1 py-2.5 px-4 text-xs sm:text-sm bg-neutral-100 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      disabled={isSending}
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || isSending}
                      className="p-2.5 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Tuma</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )
      )}

      {/* Student Auth Modal */}
      <StudentAuthModal
        isOpen={isStudentAuthOpen}
        onClose={() => setIsStudentAuthOpen(false)}
        onSuccess={(stud) => {
          setStudentUser(stud);
          setIsStudentAuthOpen(false);
          loadConversations();
        }}
      />
    </div>
  );
};
