import React, { useState } from 'react';
import { ArrowRight, Power, RotateCcw, Usb, Eye, EyeOff, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SamAccount } from '../types/lab';
import { WIN11_WALLPAPER_URL } from '../data/initialLabState';

interface Win11LockScreenProps {
  cnetAccount: SamAccount;
  onAttemptSignIn: (passwordAttempt: string) => { success: boolean; message: string };
  onRebootToUefi: () => void;
}

export const Win11LockScreen: React.FC<Win11LockScreenProps> = ({
  cnetAccount,
  onAttemptSignIn,
  onRebootToUefi,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isBlankReady = !cnetAccount.hasPassword && cnetAccount.passwordIsBlank;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onAttemptSignIn(password);
    if (!res.success) {
      setFeedback({ type: 'error', text: res.message });
      setPassword('');
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950 text-white">
      {!imgError ? (
        <img
          src={WIN11_WALLPAPER_URL}
          alt="Windows 11 desktop backdrop"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover scale-105 blur-md brightness-75"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950" />
      )}
      <div className="absolute inset-0 bg-slate-950/45" />

      {/* Top subtle environment marker */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 text-xs text-slate-200/80">
        <span>WIN11-CNET54-LAB · Windows 11 Pro</span>
        <span className="font-mono tabular-nums">
          {isBlankReady ? 'SAM Password: Blank (Ready)' : 'SAM Password: Set (Unknown)'}
        </span>
      </div>

      {/* Center Sign-in Card */}
      <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100%-8.5rem)] px-4">
        <div className="w-28 h-28 rounded-full bg-slate-800/80 border border-white/20 flex items-center justify-center shadow-2xl mb-4">
          <span className="text-3xl font-semibold tracking-tight text-white">C54</span>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-white mb-1">cnet54</h2>
        <p className="text-xs text-slate-300 mb-6">
          {cnetAccount.fullName} · {cnetAccount.groups.join(', ')}
        </p>

        {isBlankReady ? (
          <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col items-center gap-3">
            <div className="w-full px-3.5 py-2.5 rounded-md bg-emerald-950/60 border border-emerald-400/40 text-xs text-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Password cleared to blank in SAM. Ready for direct sign-in.</span>
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors shadow-lg cursor-pointer"
            >
              <span>Sign in (Blank Password)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col items-center gap-3">
            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (feedback) setFeedback(null);
                }}
                placeholder="Password"
                aria-label="Password for cnet54"
                className="w-full pl-3.5 pr-20 py-2.5 rounded-md bg-slate-900/85 border border-white/25 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="p-1.5 text-slate-300 hover:text-white rounded cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="submit"
                  title="Attempt Sign In"
                  className="p-1.5 bg-white/15 hover:bg-white/25 text-white rounded cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {feedback && (
              <div className="w-full px-3 py-2 rounded-md bg-red-950/75 border border-red-400/40 text-xs text-red-100 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                <span>{feedback.text}</span>
              </div>
            )}

            <p className="text-xs text-slate-300 text-center leading-relaxed mt-1">
              Password is unknown. Use Power &rarr; Restart to Boot Menu to boot from Hiren&apos;s BootCD PE USB.
            </p>
          </form>
        )}
      </div>

      {/* Bottom Right Power Controls */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4">
        <div className="text-xs text-slate-300/80">
          Press <span className="font-mono text-white">Power &rarr; Boot Menu</span> to boot USB recovery media
        </div>

        <div className="relative">
          {powerMenuOpen && (
            <div className="absolute right-0 bottom-11 w-64 rounded-lg bg-slate-900/95 border border-white/15 shadow-2xl p-1.5 backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setPowerMenuOpen(false);
                  onRebootToUefi();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-100 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              >
                <Usb className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Restart to UEFI Boot Menu (USB)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPowerMenuOpen(false);
                  onRebootToUefi();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-100 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Restart (Shift + Restart)</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setPowerMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-900/75 hover:bg-slate-800/90 border border-white/15 text-xs text-white transition-colors cursor-pointer"
          >
            <Power className="w-4 h-4" />
            <span>Power</span>
          </button>
        </div>
      </div>
    </div>
  );
};
