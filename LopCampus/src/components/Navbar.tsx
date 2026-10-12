import React from 'react';
import { ViewTab, BrokerProfile } from '../types';
import {
  Home,
  PlusCircle,
  LayoutDashboard,
  LogIn,
  LogOut
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

        {/* Mobile Action Controls (md:hidden) - Strictly fits screen with NO horizontal sliding */}
        <div className="flex items-center gap-1.5 md:hidden shrink-0">
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

              {/* Direct red Logout button - Always visible right in the top bar! */}
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
