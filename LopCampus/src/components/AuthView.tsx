import React, { useState } from 'react';
import { BrokerProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Shield, LogIn, UserPlus, AlertCircle, Phone, Lock, User, Sparkles } from 'lucide-react';

interface AuthViewProps {
  onSuccess: (broker: BrokerProfile) => void;
  onCancel: () => void;
}

interface RegisteredAccount {
  id: string;
  phone_number: string;
  full_name: string;
  password?: string;
  created_at: string;
}

const REGISTERED_ACCOUNTS_STORAGE_KEY = 'lopcampus_registered_brokers';

function getStoredRegisteredBrokers(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [
    {
      id: 'demo-dalali-001',
      phone_number: '0712345678',
      full_name: 'Dalali Baraka Juma (Demo)',
      password: 'password123',
      created_at: new Date().toISOString()
    }
  ];
}

function saveRegisteredBroker(broker: RegisteredAccount) {
  try {
    const current = getStoredRegisteredBrokers();
    const existingIdx = current.findIndex((b) => b.phone_number === broker.phone_number);
    if (existingIdx >= 0) {
      current[existingIdx] = { ...current[existingIdx], ...broker };
    } else {
      current.push(broker);
    }
    localStorage.setItem(REGISTERED_ACCOUNTS_STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onCancel }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPhoneNumber = (input: string) => {
    let clean = input.replace(/[^0-9]/g, '');
    if (clean.startsWith('255')) {
      clean = '0' + clean.slice(3);
    }
    return clean;
  };

  const getDalaliEmail = (phone: string) => {
    const clean = formatPhoneNumber(phone);
    return `dalali_${clean}@lopcampus.co.tz`;
  };

  const handleDemoLogin = () => {
    const demoAccount: RegisteredAccount = {
      id: 'demo-dalali-001',
      full_name: 'Dalali Baraka Juma (Demo)',
      phone_number: '0712345678',
      password: 'password123',
      created_at: new Date().toISOString()
    };
    saveRegisteredBroker(demoAccount);

    const demoBroker: BrokerProfile = {
      id: demoAccount.id,
      full_name: demoAccount.full_name,
      phone_number: demoAccount.phone_number,
      role: 'broker',
      is_active: true
    };
    localStorage.setItem('lopcampus_logged_broker', JSON.stringify(demoBroker));
    onSuccess(demoBroker);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = formatPhoneNumber(phoneNumber);
    if (cleanPhone.length < 10) {
      setErrorMessage('Tafadhali weka namba sahihi ya simu (mfano 0712345678).');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Nenosiri linapaswa kuwa na angalau herufi au tarakimu 6.');
      return;
    }

    setIsLoading(true);
    const email = getDalaliEmail(cleanPhone);

    try {
      if (mode === 'login') {
        // ULINZI MKUBWA: Thibitisha kwanza kama akaunti ipo kabla ya kuruhusu mtu kuingia
        const localAccounts = getStoredRegisteredBrokers();
        const existingLocal = localAccounts.find((a) => a.phone_number === cleanPhone);

        // Angalia pia profiles kwenye Supabase
        let existingProfile = null;
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone_number', cleanPhone)
            .maybeSingle();
          existingProfile = data;
        } catch {}

        // Kama akaunti haipo kwenye Supabase wala kwenye akaunti zilizosajiliwa
        if (!existingLocal && !existingProfile) {
          // Jaribu pia Supabase auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (authError || !authData?.user) {
            setErrorMessage(
              `Akaunti hii haipo kwenye mfumo! Huna akaunti yenye namba ya simu ${cleanPhone}. Tafadhali bofya kitufe cha "Sajili Mpya (Bure)" hapo juu ili ufungue akaunti yako ya dalali kwanza.`
            );
            setIsLoading(false);
            return;
          }

          // Ikiwa imepatikana Supabase auth
          const userBroker: BrokerProfile = {
            id: authData.user.id,
            full_name: authData.user.user_metadata?.full_name || 'Dalali',
            phone_number: cleanPhone,
            role: 'broker',
            is_active: true
          };
          saveRegisteredBroker({
            id: userBroker.id,
            phone_number: cleanPhone,
            full_name: userBroker.full_name,
            password,
            created_at: new Date().toISOString()
          });
          localStorage.setItem('lopcampus_logged_broker', JSON.stringify(userBroker));
          onSuccess(userBroker);
          return;
        }

        // Ikiwa akaunti ipo, sasa thibitisha nenosiri lake (Security check)
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (!authError && authData?.user) {
          const bObj: BrokerProfile = existingProfile || {
            id: authData.user.id,
            full_name: authData.user.user_metadata?.full_name || existingLocal?.full_name || 'Dalali',
            phone_number: cleanPhone,
            role: 'broker',
            is_active: true
          };
          saveRegisteredBroker({
            id: bObj.id,
            phone_number: cleanPhone,
            full_name: bObj.full_name,
            password,
            created_at: new Date().toISOString()
          });
          localStorage.setItem('lopcampus_logged_broker', JSON.stringify(bObj));
          onSuccess(bObj);
          return;
        }

        // Ikiwa Supabase auth imefeli mtandao au nenosiri halikulingana na Supabase, thibitisha na password ya akaunti iliyopo
        if (existingLocal) {
          if (existingLocal.password && existingLocal.password !== password) {
            setErrorMessage('Nenosiri (password) sio sahihi. Tafadhali hakiki nenosiri lako na ujaribu tena.');
            setIsLoading(false);
            return;
          }

          const loggedBroker: BrokerProfile = {
            id: existingLocal.id,
            full_name: existingLocal.full_name,
            phone_number: existingLocal.phone_number,
            role: 'broker',
            is_active: true
          };
          localStorage.setItem('lopcampus_logged_broker', JSON.stringify(loggedBroker));
          onSuccess(loggedBroker);
          return;
        }

        setErrorMessage('Nenosiri sio sahihi au taarifa hazilingani. Tafadhali jaribu tena.');
      } else {
        // Register mode: Sajili akaunti mpya
        if (!fullName.trim()) {
          setErrorMessage('Tafadhali jaza Jina lako Kamili.');
          setIsLoading(false);
          return;
        }

        // Angalia kama namba hii ya simu tayari imesajiliwa
        const localAccounts = getStoredRegisteredBrokers();
        const alreadyExists = localAccounts.find((a) => a.phone_number === cleanPhone);
        if (alreadyExists) {
          setErrorMessage(
            `Namba hii ya simu (${cleanPhone}) tayari ina akaunti! Tafadhali nenda kwenye sehemu ya "Ingia (Bure)" kuingia kwenye akaunti yako.`
          );
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone_number: cleanPhone,
              role: 'broker'
            }
          }
        });

        if (error) {
          console.warn('Supabase sign up warning:', error.message);
        }

        const newBroker: BrokerProfile = {
          id: data?.user?.id || `broker-${cleanPhone}-${Date.now()}`,
          full_name: fullName.trim(),
          phone_number: cleanPhone,
          role: 'broker',
          is_active: true
        };

        // Try creating profile row in Supabase
        try {
          if (data?.user?.id) {
            await supabase.from('profiles').upsert([
              {
                id: data.user.id,
                full_name: fullName.trim(),
                phone_number: cleanPhone,
                role: 'broker'
              }
            ]);
          }
        } catch {}

        // Hifadhi akaunti kwenye kumbukumbu ya mfumo (security registry)
        saveRegisteredBroker({
          id: newBroker.id,
          phone_number: cleanPhone,
          full_name: fullName.trim(),
          password,
          created_at: new Date().toISOString()
        });

        localStorage.setItem('lopcampus_logged_broker', JSON.stringify(newBroker));
        onSuccess(newBroker);
      }
    } catch (err: any) {
      setErrorMessage(`Hitilafu ya ulinzi: ${err.message || 'Kuna tatizo la mtandao. Jaribu tena.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-6 text-center">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
            <Shield className="w-6 h-6 text-yellow-300" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">LopCampus Dalali & Landlord Portal</h2>
          <p className="text-xs text-blue-100 mt-1">
            Ingia au sajili akaunti yako kuanza kupost vyumba kwa maelfu ya wanafunzi wa vyuo
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-xs text-emerald-200 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Usajili wa BURE • Hakuna Tozo</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3.5 text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/50'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Ingia (Bure)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3.5 text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'text-emerald-700 border-b-2 border-emerald-700 bg-emerald-50/50'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Sajili Mpya (Bure)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Quick Demo Login Option */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-amber-900">Majaribio ya Haraka:</span>
              <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                1-Click
              </span>
            </div>
            <p className="text-xs text-amber-800 mb-2">
              Bofya hapa chini kujaribu dashibodi ya dalali na kupakia tangazo lenye picha na video mara moja.
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
            >
              Ingia Mara Moja kama Dalali wa Majaribio
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Jina Kamili *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Mf. Juma Rashid au Dalali Makini"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Namba ya Simu *</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Nenosiri (Password) *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Angalau herufi 6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              } disabled:opacity-50`}
            >
              {isLoading ? 'Inathibitisha...' : mode === 'login' ? 'Ingia Kwenye Akaunti' : 'Kamilisha Usajili wa Bure'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-neutral-500 hover:text-neutral-800 underline cursor-pointer"
            >
              Rudi kwenye orodha ya vyumba vya wanafunzi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
