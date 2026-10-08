import React from 'react';
import { ViewTab, BrokerProfile } from '../types';
import {
  Home,
  PlusCircle,
  LayoutDashboard,
  LogIn,
  LogOut,
  Sparkles
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
    <header className="sticky top-0 z-40 bg-blue-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div
          onClick={() => setCurrentView('student-view')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-xl tracking-tight group-hover:bg-white/20 transition-all">
            <span className="text-yellow-300">L</span>C
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-lg sm:text-xl tracking-tight">
              <span>LopCampus</span>
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Wanafunzi
              </span>
            </div>
            <p className="text-[11px] text-blue-200 hidden sm:block">
              Vyumba vya Wanafunzi & Mtandao wa Madalali Tanzania
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
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
                <span className="hidden sm:inline">Dashibodi ya Dalali</span>
                <span className="sm:hidden">Dashibodi</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('add-room-view')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Posti Chumba</span>
                <span className="sm:hidden">Posti</span>
              </button>

              <div className="flex items-center gap-1.5 pl-1.5 border-l border-blue-500/50">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold leading-tight truncate max-w-[110px] text-white">
                    {brokerProfile.full_name}
                  </span>
                  <span className="text-[10px] text-blue-200">{brokerProfile.phone_number}</span>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold text-rose-200 hover:text-white hover:bg-rose-600/80 transition-all flex items-center gap-1 cursor-pointer"
                  title="Toka kwenye akaunti ya Dalali"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentView('auth-view')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'auth-view'
                    ? 'bg-yellow-400 text-neutral-900 ring-2 ring-yellow-300'
                    : 'bg-yellow-400 hover:bg-yellow-300 text-neutral-900 shadow-sm'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Dalali Portal</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
