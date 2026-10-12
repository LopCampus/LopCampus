import React from 'react';
import { ViewTab, BrokerProfile } from '../types';
import { Home, LayoutDashboard, PlusCircle, LogIn, LogOut } from 'lucide-react';

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
  return (
    <nav
      aria-label="Menyu ya Chini ya Simu"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1 items-center">
        {/* Tab 1: Vyumba / Nyumbani */}
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

        {brokerProfile ? (
          <>
            {/* Tab 2: Dashibodi */}
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

            {/* Tab 3: Posti Chumba */}
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

            {/* Tab 4: Toka (Logout) - Always easily clickable on mobile without scrolling */}
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
          <>
            {/* When not logged in: Empty/Student filler + Dalali Login */}
            <div className="col-span-2"></div>
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
          </>
        )}
      </div>
    </nav>
  );
};
