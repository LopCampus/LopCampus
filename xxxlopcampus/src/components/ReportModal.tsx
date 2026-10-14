import React, { useState } from 'react';
import { RoomListing } from '../types';
import { submitComplaint } from '../lib/supabaseClient';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ReportModalProps {
  room: RoomListing | null;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ room, onClose }) => {
  const [reason, setReason] = useState('Dalali anatapeli / Si mwaminifu');
  const [details, setDetails] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const ok = await submitComplaint({
      room_id: room.id,
      reason,
      details,
      reporter_phone: reporterPhone
    });

    setIsSubmitting(false);
    if (ok) {
      setSuccessMsg(
        'Asante. Taarifa yako kuhusu chumba hiki imepokelewa na itashughulikiwa mara moja kulinda usalama wa wanafunzi.'
      );
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setErrorMsg('Imeshindikana kutuma ripoti. Tafadhali jaribu tena.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200">
        <div className="bg-rose-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
            <h3 className="font-bold text-base">Ripoti Tangazo Hili</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {successMsg ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-neutral-800 text-base">Ripoti Imepokelewa</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-neutral-600">
                Umeona tatizo kwenye tangazo la: <strong>{room.room_type}</strong> (Kata: {room.ward})?
                Tueleze ili tulichunguze mara moja.
              </p>

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Sababu ya Kuripoti *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Dalali anatapeli / Si mwaminifu">Dalali anatapeli / Si mwaminifu</option>
                  <option value="Picha au Video si halisi / Zimekopiwa">Picha au Video si halisi / Zimekopiwa</option>
                  <option value="Chumba tayari kimepangishwa">Chumba tayari kimepangishwa</option>
                  <option value="Bei ya kodi kwenye tangazo sio sahihi">Bei ya kodi kwenye tangazo sio sahihi</option>
                  <option value="Namba ya simu haipatikani">Namba ya simu haipatikani</option>
                  <option value="Nyingine">Sababu Nyingine</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Maelezo ya Ziada (Hiari)</label>
                <textarea
                  rows={2}
                  placeholder="Eleza kwa ufupi ulichokutana nacho..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Namba Yako ya Simu (Hiari)</label>
                <input
                  type="tel"
                  placeholder="0712345678"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Inatuma...' : 'Tuma Ripoti'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
