import React, { useState, useEffect, useCallback } from 'react';
import { RoomListing, BrokerProfile, ViewTab } from './types';
import { fetchAllActiveRooms, fetchRoomsByBroker, incrementViews, supabase } from './lib/supabaseClient';
import { Navbar } from './components/Navbar';
import { StudentRoomsView } from './components/StudentRoomsView';
import { BrokerDashboard } from './components/BrokerDashboard';
import { PostRoomView } from './components/PostRoomView';
import { AuthView } from './components/AuthView';
import { RoomDetailsModal } from './components/RoomDetailsModal';
import { ReportModal } from './components/ReportModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<ViewTab>('student-view');
  const [rooms, setRooms] = useState<RoomListing[]>([]);
  const [brokerRooms, setBrokerRooms] = useState<RoomListing[]>([]);
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('lopcampus_logged_broker');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBrokerLoading, setIsBrokerLoading] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'starter'>('supabase');
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals & Selected Room
  const [selectedRoom, setSelectedRoom] = useState<RoomListing | null>(null);
  const [reportingRoom, setReportingRoom] = useState<RoomListing | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Automatic load of all active rooms from Supabase
  const loadInitialRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAllActiveRooms();
      setRooms(res.rooms);
      setTotalCount(res.totalCount);
      setDataSource(res.source);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load broker rooms
  const loadBrokerRooms = useCallback(async (brokerId: string) => {
    setIsBrokerLoading(true);
    try {
      const bRooms = await fetchRoomsByBroker(brokerId);
      setBrokerRooms(bRooms);
    } finally {
      setIsBrokerLoading(false);
    }
  }, []);

  // Check auth session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (session?.user) {
          const u = session.user;
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();

          const b: BrokerProfile = profile || {
            id: u.id,
            full_name: u.user_metadata?.full_name || 'Dalali',
            phone_number: u.user_metadata?.phone_number || '',
            role: 'broker'
          };
          setBrokerProfile(b);
          loadBrokerRooms(b.id);
        } else if (brokerProfile?.id) {
          loadBrokerRooms(brokerProfile.id);
        }
      } catch {}

      await loadInitialRooms();
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();

        const b: BrokerProfile = profile || {
          id: u.id,
          full_name: u.user_metadata?.full_name || 'Dalali',
          phone_number: u.user_metadata?.phone_number || '',
          role: 'broker'
        };
        setBrokerProfile(b);
        loadBrokerRooms(b.id);
      } else if (event === 'SIGNED_OUT') {
        setBrokerProfile(null);
        setBrokerRooms([]);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [loadInitialRooms, loadBrokerRooms]);

  const handleSelectRoom = (room: RoomListing) => {
    setSelectedRoom(room);
    incrementViews(room.id);
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, views: (r.views || 0) + 1 } : r))
    );
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('lopcampus_logged_broker');
    setBrokerProfile(null);
    setBrokerRooms([]);
    setCurrentView('student-view');
    showToast('Umetoka kwenye akaunti ya Dalali.');
  };

  const handleAuthSuccess = (broker: BrokerProfile) => {
    setBrokerProfile(broker);
    loadBrokerRooms(broker.id);
    loadInitialRooms();
    setCurrentView('dashboard-view');
    showToast(`Karibu ${broker.full_name}! Umeingia kikamilifu.`);
  };

  const handlePostRoomSuccess = (newRoom: RoomListing) => {
    if (brokerProfile) {
      loadBrokerRooms(brokerProfile.id);
    }
    loadInitialRooms();
    setCurrentView('dashboard-view');
    showToast('Hongera! Tangazo lako limepakiwa na linaonekana kwa wanafunzi wote.');
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-neutral-100 flex flex-col text-neutral-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Offline Indicator Banner */}
      <OfflineIndicator />

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        brokerProfile={brokerProfile}
        onLogout={handleLogout}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-neutral-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Router */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 md:p-8 py-4 sm:py-6 pb-24 md:pb-8">
        {currentView === 'student-view' && (
          <StudentRoomsView
            rooms={rooms}
            isLoading={isLoading}
            hasMore={false}
            totalCount={totalCount}
            onRefresh={loadInitialRooms}
            onSelectRoom={handleSelectRoom}
            onNavigateBroker={() => setCurrentView(brokerProfile ? 'dashboard-view' : 'auth-view')}
            dataSource={dataSource}
          />
        )}

        {currentView === 'dashboard-view' &&
          (brokerProfile ? (
            <BrokerDashboard
              brokerProfile={brokerProfile}
              rooms={brokerRooms}
              isLoading={isBrokerLoading}
              onRefresh={() => loadBrokerRooms(brokerProfile.id)}
              onNavigatePostRoom={() => setCurrentView('add-room-view')}
              onNavigateStudentView={() => setCurrentView('student-view')}
              onSelectRoom={handleSelectRoom}
              onLogout={handleLogout}
            />
          ) : (
            <AuthView onSuccess={handleAuthSuccess} onCancel={() => setCurrentView('student-view')} />
          ))}

        {currentView === 'add-room-view' &&
          (brokerProfile ? (
            <PostRoomView
              brokerProfile={brokerProfile}
              onSuccess={handlePostRoomSuccess}
              onCancel={() => setCurrentView('dashboard-view')}
            />
          ) : (
            <AuthView onSuccess={handleAuthSuccess} onCancel={() => setCurrentView('student-view')} />
          ))}

        {currentView === 'auth-view' && (
          <AuthView onSuccess={handleAuthSuccess} onCancel={() => setCurrentView('student-view')} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-12 py-8 text-xs text-neutral-500 mb-16 md:mb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              LC
            </div>
            <span className="font-bold text-neutral-800">LopCampus Tanzania</span>
            <span className="text-neutral-300">•</span>
            <span>Mtandao Salama wa Makazi ya Vyuo Vikuu na Madalali</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Hakiki chumba kabla ya malipo</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <MobileBottomNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        brokerProfile={brokerProfile}
        onLogout={handleLogout}
      />

      {/* Modals */}
      {selectedRoom && (
        <RoomDetailsModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onReport={(r) => {
            setSelectedRoom(null);
            setReportingRoom(r);
          }}
        />
      )}

      {reportingRoom && (
        <ReportModal room={reportingRoom} onClose={() => setReportingRoom(null)} />
      )}
    </div>
  );
}

export default App;
