import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-neutral-900 px-4 py-2.5 flex items-center justify-center gap-3 shadow-sm text-xs font-semibold">
      <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
        <WifiOff className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="font-bold text-xs uppercase tracking-wider text-black">
          Haupo Mtandaoni (Offline Mode)
        </p>
        <p className="text-[11px] text-neutral-900">
          Programu inatumia data zilizohifadhiwa kwenye kumbukumbu ya simu yako.
        </p>
      </div>
    </div>
  );
};
