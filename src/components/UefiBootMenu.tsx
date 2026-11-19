import React, { useEffect, useState } from 'react';
import { HardDrive, Usb, ShieldCheck, CornerDownLeft } from 'lucide-react';

interface UefiBootMenuProps {
  onSelectWindows: () => void;
  onSelectHirensUsb: () => void;
  samCleared: boolean;
}

export const UefiBootMenu: React.FC<UefiBootMenuProps> = ({
  onSelectWindows,
  onSelectHirensUsb,
  samCleared,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(samCleared ? 0 : 1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === 0 ? 1 : 0));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === 1 ? 0 : 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex === 0) onSelectWindows();
        else onSelectHirensUsb();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelectWindows, onSelectHirensUsb]);

  return (
    <div className="w-full h-full bg-[#0A1428] text-slate-100 font-mono flex flex-col justify-between p-6 select-none">
      {/* Top Firmware Bar */}
      <div className="border-b border-slate-700 pb-3 flex items-center justify-between text-xs">
        <span>Aptio UEFI Setup Utility · Boot Manager</span>
        <span className="text-slate-400 tabular-nums">Target Host: WIN11-CNET54-LAB</span>
      </div>

      {/* Center Boot Option Modal */}
      <div className="my-auto mx-auto w-full max-w-lg border border-slate-600 bg-[#101E3A] shadow-2xl">
        <div className="bg-slate-200 text-slate-900 px-4 py-2 text-xs font-semibold flex items-center justify-between">
          <span>Please select boot device</span>
          <span>UEFI Mode</span>
        </div>

        <div className="p-3 space-y-1.5">
          <button
            type="button"
            onMouseEnter={() => setSelectedIndex(0)}
            onClick={onSelectWindows}
            className={`w-full flex items-center justify-between px-3 py-3 text-left text-xs transition-colors cursor-pointer ${
              selectedIndex === 0
                ? 'bg-sky-600 text-white'
                : 'bg-slate-900/40 text-slate-200 hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-center gap-3">
              <HardDrive className="w-4 h-4 shrink-0" />
              <div>
                <div className="font-semibold">Windows Boot Manager (NVMe0n1 — C:\Windows)</div>
                <div className={`text-[11px] ${selectedIndex === 0 ? 'text-sky-100' : 'text-slate-400'}`}>
                  {samCleared
                    ? 'SAM updated: cnet54 blank password ready'
                    : 'Primary OS partition (cnet54 password unknown)'}
                </div>
              </div>
            </div>
            <CornerDownLeft className="w-3.5 h-3.5 shrink-0 opacity-75" />
          </button>

          <button
            type="button"
            onMouseEnter={() => setSelectedIndex(1)}
            onClick={onSelectHirensUsb}
            className={`w-full flex items-center justify-between px-3 py-3 text-left text-xs transition-colors cursor-pointer ${
              selectedIndex === 1
                ? 'bg-sky-600 text-white'
                : 'bg-slate-900/40 text-slate-200 hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-center gap-3">
              <Usb className="w-4 h-4 shrink-0" />
              <div>
                <div className="font-semibold">
                  UEFI: Kingston DataTraveler 3.0 — Hiren&apos;s BootCD PE x64
                </div>
                <div className={`text-[11px] ${selectedIndex === 1 ? 'text-sky-100' : 'text-slate-400'}`}>
                  Bootable WinPE Administrative Recovery Environment
                </div>
              </div>
            </div>
            <CornerDownLeft className="w-3.5 h-3.5 shrink-0 opacity-75" />
          </button>
        </div>

        <div className="border-t border-slate-700 px-4 py-2.5 bg-slate-950/60 text-[11px] text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Logging & Lab Recovery Policy Active</span>
          </span>
          <span>&uarr;&darr; Move · Enter Boot</span>
        </div>
      </div>

      {/* Bottom Firmware Key Legend */}
      <div className="border-t border-slate-700 pt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>UEFI Firmware v2.24 · TPM 2.0 Lab Profile</span>
        <span>Click any boot target or press Enter</span>
      </div>
    </div>
  );
};
