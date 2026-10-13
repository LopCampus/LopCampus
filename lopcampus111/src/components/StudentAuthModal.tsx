import React, { useState } from 'react';
import { StudentAccount } from '../types';
import {
  registerStudentAccount,
  loginStudentAccount,
  getStoredRegisteredStudents
} from '../lib/supabaseClient';
import {
  User,
  Lock,
  Phone,
  Sparkles,
  X,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: StudentAccount) => void;
  initialMode?: 'login' | 'register';
  title?: string;
  subtitle?: string;
}

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  title = 'Akaunti ya Mwanafunzi / Mteja',
  subtitle = 'Weka Username na Nenosiri ili kutuma na kupokea ujumbe kutoka kwa madalali'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDemoStudentLogin = () => {
    const students = getStoredRegisteredStudents();
    const demo = students[0] || {
      id: 'stud-kelvin',
      username: 'kelvin_mushi',
      full_name: 'Kelvin Mushi',
      phone_number: '0754123456',
      password: 'password123',
      created_at: new Date().toISOString()
    };
    loginStudentAccount(demo.username, demo.password || 'password123');
    onSuccess(demo);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        const res = registerStudentAccount(username, password, phoneNumber, fullName);
        if (!res.success || !res.student) {
          setError(res.error || 'Imeshindikana kusajili akaunti.');
          setIsSubmitting(false);
          return;
        }
        onSuccess(res.student);
        onClose();
      } else {
        const res = loginStudentAccount(username, password);
        if (!res.success || !res.student) {
          setError(res.error || 'Imeshindikana kuingia.');
          setIsSubmitting(false);
          return;
        }
        onSuccess(res.student);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Hitilafu imetokea. Tafadhali jaribu tena.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-neutral-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
            aria-label="Funga"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-white/15 text-yellow-300">
              <User className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-2 py-0.5 rounded-md">
              Mwanafunzi / Mteja
            </span>
          </div>

          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-xs text-blue-100 mt-1 leading-relaxed">{subtitle}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Ingia (Login)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Fungua Akaunti Mpya</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Extra Fields */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Jina Kamili (Hiari)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="mfano: Kelvin Mushi"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Namba ya Simu (Hiari - kwa ajili ya dalali kukupigia)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="mfano: 0754123456"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-neutral-400 font-mono text-sm">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mfano: kelvin_mushi au amina22"
                className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              Jina litakalotumiwa kumtambua mteja anapotuma ujumbe.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Nenosiri (Password) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Weka angalau herufi 4"
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{mode === 'login' ? 'Ingia na Endelea' : 'Kamilisha Usajili na Ingia'}</span>
          </button>

          {/* Quick Demo Student Button */}
          <div className="pt-2 border-t border-neutral-100 text-center">
            <button
              type="button"
              onClick={handleDemoStudentLogin}
              className="text-xs text-blue-700 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 py-2 px-3 rounded-xl border border-blue-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer w-full justify-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ingia Haraka kama Demo Mwanafunzi (@kelvin_mushi)</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Taarifa zako zinalindwa kwa usalama LopCampus Tanzania</span>
          </div>
        </form>
      </div>
    </div>
  );
};
