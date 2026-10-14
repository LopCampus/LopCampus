import React, { useState, useEffect } from 'react';
import { ViewTab, BrokerProfile, StudentAccount } from '../types';
import {
  getBrokerUnreadMessagesCount,
  getStudentUnreadMessagesCount,
  getLoggedStudent
} from '../lib/supabaseClient';
import { Home, LayoutDashboard, PlusCircle, LogIn, LogOut, MessageSquare } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: ViewTab;
  setCurrentView: (view: ViewTab) => void;
  brokerProfile: BrokerProfile | null;
  onLogout: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  setCurrentView,
  brokerProfile,
  onLogout
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const updateUnread = () => {
    if (brokerProfile) {
      setUnreadCount(getBrokerUnreadMessagesCount(brokerProfile.id));
    } else {
      const student = getLoggedStudent();
      setUnreadCount(student ? getStudentUnreadMessagesCount(student.id) : 0);
    }
  };

  useEffect(() => {
    updateUnread();
    const handleAuth = () => updateUnread();
    const handleMsg = () => updateUnread();

    window.addEventListener('lopcampus_student_auth_change', handleAuth);
    window.addEventListener('lopcampus_message_event', handleMsg);
    return () => {
      window.removeEventListener('lopcampus_student_auth_change', handleAuth);
      window.removeEventListener('lopcampus_message_event', handleMsg);
    };
  }, [brokerProfile]);

  return (
    <nav
      aria-label="Menyu ya Chini ya Simu"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-1 py-1"
    >
      <div className={`max-w-md mx-auto grid ${brokerProfile ? 'grid-cols-5' : 'grid-cols-3'} gap-1 items-center`}>
        {/* Tab 1: Vyumba */}
        <button
          type="button"
          onClick={() => setCurrentView('student-view')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            currentView === 'student-view'
              ? 'text-blue-600 font-bold bg-blue-50/80'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-tight">Vyumba</span>
        </button>

        {/* Tab 2: Ujumbe (Messages) */}
        <button
          type="button"
          onClick={() => setCurrentView('messages-view')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
            currentView === 'messages-view'
              ? 'text-blue-600 font-bold bg-blue-50/80'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 leading-tight">Ujumbe</span>
        </button>

        {brokerProfile ? (
          <>
            {/* Tab 3: Dashibodi */}
            <button
              type="button"
              onClick={() => setCurrentView('dashboard-view')}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                currentView === 'dashboard-view'
                  ? 'text-blue-600 font-bold bg-blue-50/80'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 leading-tight">Dashibodi</span>
            </button>

            {/* Tab 4: Posti Chumba */}
            <button
              type="button"
              onClick={() => setCurrentView('add-room-view')}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                currentView === 'add-room-view'
                  ? 'text-emerald-700 font-bold bg-emerald-50/80 ring-1 ring-emerald-300'
                  : 'text-emerald-600 hover:text-emerald-700'
              }`}
            >
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] mt-0.5 leading-tight font-bold">Posti</span>
            </button>

            {/* Tab 5: Toka */}
            <button
              type="button"
              onClick={onLogout}
              className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
              title="Toka kwenye akaunti ya Dalali"
            >
              <LogOut className="w-5 h-5 text-rose-600" />
              <span className="text-[10px] mt-0.5 leading-tight font-bold">Toka</span>
            </button>
          </>
        ) : (
          /* Tab 3: Ingia Dalali */
          <button
            type="button"
            onClick={() => setCurrentView('auth-view')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              currentView === 'auth-view'
                ? 'text-amber-800 font-bold bg-amber-100'
                : 'text-amber-700 hover:text-amber-900 bg-amber-50'
            }`}
          >
            <LogIn className="w-5 h-5 text-amber-600" />
            <span className="text-[10px] mt-0.5 leading-tight font-bold">Ingia Dalali</span>
          </button>
        )}
      </div>
    </nav>
  );
};

