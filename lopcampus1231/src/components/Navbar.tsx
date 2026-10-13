import React, { useState, useEffect } from 'react';
import { ViewTab, BrokerProfile, StudentAccount } from '../types';
import {
  getBrokerUnreadMessagesCount,
  getStudentUnreadMessagesCount,
  getLoggedStudent
} from '../lib/supabaseClient';
import {
  Home,
  PlusCircle,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageSquare,
  User
} from 'lucide-react';

interface NavbarProps {
  currentView: ViewTab;
  setCurrentView: (view: ViewTab) => void;
  brokerProfile: BrokerProfile | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  brokerProfile,
  onLogout
}) => {
  const [studentUser, setStudentUser] = useState<StudentAccount | null>(() => getLoggedStudent());
  const [unreadCount, setUnreadCount] = useState(0);

  const updateCounts = () => {
    const student = getLoggedStudent();
    setStudentUser(student);
    if (brokerProfile) {
      setUnreadCount(getBrokerUnreadMessagesCount(brokerProfile.id));
    } else if (student) {
      setUnreadCount(getStudentUnreadMessagesCount(student.id));
    } else {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    updateCounts();
    const handleAuth = () => updateCounts();
    const handleMsg = () => updateCounts();

    window.addEventListener('lopcampus_student_auth_change', handleAuth);
    window.addEventListener('lopcampus_message_event', handleMsg);
    return () => {
      window.removeEventListener('lopcampus_student_auth_change', handleAuth);
      window.removeEventListener('lopcampus_message_event', handleMsg);
    };
  }, [brokerProfile]);

  return (
    <header className="sticky top-0 z-40 bg-blue-700 text-white shadow-md w-full max-w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div
          onClick={() => setCurrentView('student-view')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-lg sm:text-xl tracking-tight group-hover:bg-white/20 transition-all shrink-0">
            <span className="text-yellow-300">L</span>C
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-base sm:text-xl tracking-tight leading-tight">
              <span>LopCampus</span>
              <span className="bg-emerald-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                Wanafunzi
              </span>
            </div>
            <p className="text-[11px] text-blue-200 hidden md:block leading-tight">
              Vyumba vya Wanafunzi & Mtandao wa Madalali Tanzania
            </p>
          </div>
        </div>

        {/* Mobile Action Controls (md:hidden) */}
        <div className="flex items-center gap-1.5 md:hidden shrink-0">
          {/* Mobile Ujumbe quick button */}
          <button
            type="button"
            onClick={() => setCurrentView('messages-view')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer relative ${
              currentView === 'messages-view'
                ? 'bg-white text-blue-900 ring-2 ring-white/70'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title="Kituo cha Jumbe"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-blue-700 text-[8px] font-bold flex items-center justify-center text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {brokerProfile ? (
            <>
              {/* Post quick button */}
              <button
                type="button"
                onClick={() => setCurrentView('add-room-view')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                  currentView === 'add-room-view'
                    ? 'bg-emerald-400 text-neutral-900 ring-2 ring-emerald-300'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
                title="Posti tangazo jipya la chumba"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Posti</span>
              </button>

              {/* Direct red Logout button */}
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
                title="Toka kwenye akaunti ya Dalali"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Toka</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentView('auth-view')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                currentView === 'auth-view'
                  ? 'bg-yellow-300 text-neutral-900 ring-2 ring-yellow-200'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-neutral-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Dalali Portal</span>
            </button>
          )}
        </div>

        {/* Desktop Action Controls (hidden md:flex) */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {/* Student Rooms Tab */}
          <button
            type="button"
            onClick={() => setCurrentView('student-view')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              currentView === 'student-view'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white hover:bg-blue-600/70'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Vyumba (Wanafunzi)</span>
          </button>

          {/* Unified Messages Center Tab with dynamic counter */}
          <button
            type="button"
            onClick={() => setCurrentView('messages-view')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
              currentView === 'messages-view'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white hover:bg-blue-600/70'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{brokerProfile ? 'Jumbe za Dalali' : studentUser ? 'Jumbe Zangu' : 'Jumbe (Chat)'}</span>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Student Profile snippet if logged in as student & not broker */}
          {!brokerProfile && studentUser && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-xs">
              <User className="w-3.5 h-3.5 text-blue-200" />
              <span className="font-mono font-semibold">@{studentUser.username}</span>
            </div>
          )}

          {/* Broker Logged in vs Guest */}
          {brokerProfile ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentView('dashboard-view')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'dashboard-view'
                    ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                    : 'text-white hover:bg-blue-600/70'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashibodi ya Dalali</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('add-room-view')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer ${
                  currentView === 'add-room-view'
                    ? 'bg-emerald-400 text-neutral-900 ring-2 ring-emerald-300'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Posti Chumba</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-blue-500/50">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold leading-tight truncate max-w-[120px] text-white">
                    {brokerProfile.full_name}
                  </span>
                  <span className="text-[10px] text-blue-200">{brokerProfile.phone_number}</span>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-100 hover:text-white bg-rose-600/80 hover:bg-rose-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Toka kwenye akaunti ya Dalali"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentView('auth-view')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentView === 'auth-view'
                  ? 'bg-yellow-300 text-neutral-900 ring-2 ring-yellow-200'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-neutral-900 shadow-sm'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Dalali Portal</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

