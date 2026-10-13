import React, { useState } from 'react';
import { SUPABASE_SQL_MIGRATION } from '../lib/supabaseClient';
import { Copy, Check, Database, X, ExternalLink, ShieldCheck } from 'lucide-react';

interface SqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlModal: React.FC<SqlModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-neutral-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">Code ya Supabase SQL (Chat & Accounts)</h3>
              <p className="text-xs text-blue-200">Database kamili yenye video, akaunti za wanafunzi na jumbe za chat</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Instructions Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-950">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Hatua Rahisi za Kuweka kwenye Supabase (Safe & Idempotent):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs text-blue-800 leading-relaxed">
              <li>Bonyeza kitufe cha <strong>"Nakili Code ya SQL"</strong> hapa chini.</li>
              <li>Fungua Supabase Dashboard yako kisha nenda kwenye <strong>SQL Editor</strong>.</li>
              <li>Bandika (Paste) code hii kisha bonyeza kitufe cha kijani <strong>"RUN"</strong>.</li>
              <li>Code hii ina <code>DROP POLICY IF EXISTS</code>, kwa hiyo hata ikirudiwa mara kadhaa haitaleta kosa lolote (error).</li>
            </ol>
          </div>

          {/* Code Viewer with Copy Button */}
          <div className="relative">
            <div className="flex items-center justify-between bg-neutral-900 text-neutral-300 px-4 py-2 rounded-t-xl text-xs font-mono">
              <span>supabase_video_migration.sql</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Imenakiliwa!' : 'Nakili Code ya SQL'}</span>
              </button>
            </div>
            <pre className="p-4 bg-neutral-950 text-emerald-400 font-mono text-xs rounded-b-xl overflow-x-auto max-h-64 border border-neutral-800 select-all leading-relaxed">
              {SUPABASE_SQL_MIGRATION}
            </pre>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-bold"
            >
              <span>Fungua Supabase Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Funga Dirisha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
