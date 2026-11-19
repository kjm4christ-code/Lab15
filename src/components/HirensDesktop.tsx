import React, { useState } from 'react';
import {
  KeyRound,
  Terminal,
  Shield,
  FileText,
  RotateCcw,
  CheckCircle2,
  Unlock,
  Save,
  FolderOpen,
  X,
  HardDrive,
} from 'lucide-react';
import { AuditLogEntry, GpoSetting, HirensWindowId, SamAccount } from '../types/lab';
import { HIRENS_WALLPAPER_URL } from '../data/initialLabState';

interface HirensDesktopProps {
  accounts: SamAccount[];
  gpoSettings: GpoSetting[];
  logs: AuditLogEntry[];
  samHiveLoaded: boolean;
  onLoadSamHive: () => void;
  onClearPassword: (username: string) => void;
  onUnlockAccount: (username: string) => void;
  onSaveSamChanges: () => void;
  samPendingSave: boolean;
  onUpdateGpo: (id: string, value: string) => void;
  onRebootToWindows: () => void;
}

export const HirensDesktop: React.FC<HirensDesktopProps> = ({
  accounts,
  gpoSettings,
  logs,
  samHiveLoaded,
  onLoadSamHive,
  onClearPassword,
  onUnlockAccount,
  onSaveSamChanges,
  samPendingSave,
  onUpdateGpo,
  onRebootToWindows,
}) => {
  const [openWindows, setOpenWindows] = useState<HirensWindowId[]>(['ntpwedit']);
  const [activeWindow, setActiveWindow] = useState<HirensWindowId>('ntpwedit');
  const [selectedUser, setSelectedUser] = useState<string>('cnet54');
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // WinPE CMD terminal state
  const [cmdInput, setCmdInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([
    "Hiren's BootCD PE x64 (WinPE 11) [Version 10.0.22621]",
    'RAMDisk mounted at X:\\ · Windows 11 target volume mounted at C:\\',
    'Type "help" for available offline recovery commands.',
    '',
  ]);

  const openApp = (id: HirensWindowId) => {
    if (!openWindows.includes(id)) {
      setOpenWindows((prev) => [...prev, id]);
    }
    setActiveWindow(id);
    setStartMenuOpen(false);
  };

  const closeApp = (id: HirensWindowId) => {
    const next = openWindows.filter((w) => w !== id);
    setOpenWindows(next);
    if (activeWindow === id && next.length > 0) {
      setActiveWindow(next[next.length - 1]);
    }
  };

  const currentAccount = accounts.find((a) => a.username === selectedUser) || accounts[1];

  const handleCmdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = cmdInput.trim();
    if (!raw) return;
    const cmd = raw.toLowerCase();
    const output: string[] = [`X:\\Windows\\System32> ${raw}`];

    if (cmd === 'help') {
      output.push(
        'Available WinPE recovery commands:',
        '  dir c:\\windows\\system32\\config   List offline SAM/SYSTEM/SECURITY registry hives',
        '  whoami                             Display current WinPE execution context',
        '  ntpwedit                           Open NTPWEdit Password Reset utility',
        '  reg query lsa                      Inspect LimitBlankPasswordUse in offline SYSTEM hive',
        '  auditpol                           Show offline Audit Policy configuration',
        '  wpeutil reboot                     Reboot VM to UEFI / Windows Boot Manager',
        '  cls                                Clear terminal output'
      );
    } else if (cmd === 'cls') {
      setCmdHistory([]);
      setCmdInput('');
      return;
    } else if (cmd === 'whoami') {
      output.push('nt authority\\system (WinPE Offline Maintenance Session)');
    } else if (cmd.startsWith('dir')) {
      output.push(
        ' Volume in drive C is Windows11_OS',
        ' Directory of C:\\Windows\\System32\\config',
        '  SAM          65,536 bytes   (Local Account Database)',
        '  SECURITY     98,304 bytes   (Audit & Local Security Policy)',
        '  SOFTWARE  8,126,464 bytes   (Machine Policies & UAC)',
        '  SYSTEM    4,718,592 bytes   (LSA & Kernel Config)'
      );
    } else if (cmd === 'ntpwedit') {
      openApp('ntpwedit');
      output.push('Launched NTPWEdit 0.7 GUI.');
    } else if (cmd.startsWith('reg query')) {
      const lbp = gpoSettings.find((g) => g.id === 'limit-blank-password');
      const val = lbp?.value === 'Disabled' ? '0x0 (Blank passwords permitted)' : '0x1 (Restricted)';
      output.push(
        'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Lsa',
        `    LimitBlankPasswordUse    REG_DWORD    ${val}`
      );
    } else if (cmd.startsWith('auditpol')) {
      output.push(
        'Offline SECURITY\\Policy\\PolAdtEv:',
        ...gpoSettings
          .filter((g) => g.section === 'Audit Policy')
          .map((g) => `  ${g.name.padEnd(32)} ${g.value}`)
      );
    } else if (cmd === 'wpeutil reboot' || cmd === 'reboot') {
      onRebootToWindows();
      return;
    } else {
      output.push(`'${raw}' is not recognized as an internal or external command. Type "help".`);
    }

    setCmdHistory((prev) => [...prev, ...output, '']);
    setCmdInput('');
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-900 text-slate-100 flex flex-col">
      {!imgError ? (
        <img
          src={HIRENS_WALLPAPER_URL}
          alt="Hiren's BootCD PE desktop backdrop"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
      )}

      {/* Desktop Canvas */}
      <div className="relative z-10 flex-1 p-4 flex">
        {/* Desktop Icons Column */}
        <div className="flex flex-col gap-3 w-28 shrink-0">
          <button
            type="button"
            onClick={() => openApp('ntpwedit')}
            className="flex flex-col items-center gap-1.5 p-2 rounded hover:bg-white/10 transition-colors text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <span className="text-[11px] font-medium text-white drop-shadow">NTPWEdit Reset</span>
          </button>

          <button
            type="button"
            onClick={() => openApp('policy')}
            className="flex flex-col items-center gap-1.5 p-2 rounded hover:bg-white/10 transition-colors text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-sky-300" />
            </div>
            <span className="text-[11px] font-medium text-white drop-shadow">Offline Policy</span>
          </button>

          <button
            type="button"
            onClick={() => openApp('cmd')}
            className="flex flex-col items-center gap-1.5 p-2 rounded hover:bg-white/10 transition-colors text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-500/40 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-slate-200" />
            </div>
            <span className="text-[11px] font-medium text-white drop-shadow">WinPE CMD</span>
          </button>

          <button
            type="button"
            onClick={() => openApp('logs')}
            className="flex flex-col items-center gap-1.5 p-2 rounded hover:bg-white/10 transition-colors text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="text-[11px] font-medium text-white drop-shadow">Recovery Logs</span>
          </button>

          <button
            type="button"
            onClick={onRebootToWindows}
            className="flex flex-col items-center gap-1.5 p-2 rounded hover:bg-white/10 transition-colors text-center cursor-pointer mt-2"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-indigo-200" />
            </div>
            <span className="text-[11px] font-medium text-white drop-shadow">Reboot to Win11</span>
          </button>
        </div>

        {/* Active Application Window Stage */}
        <div className="flex-1 flex items-center justify-center px-3 pb-2 min-w-0">
          {openWindows.includes(activeWindow) && activeWindow === 'ntpwedit' && (
            <div className="w-full max-w-2xl bg-[#F1F5F9] text-slate-900 rounded-md shadow-2xl border border-slate-400 overflow-hidden">
              {/* Window Title Bar */}
              <div className="bg-slate-800 text-white px-3 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-semibold">
                    NTPWEdit 0.7 — Windows Password & SAM Editor (Hiren&apos;s BootCD PE)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => closeApp('ntpwedit')}
                  className="p-0.5 hover:bg-white/15 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 space-y-4 text-xs">
                {/* SAM Path Row */}
                <div className="flex items-center gap-2">
                  <label className="font-medium text-slate-700 whitespace-nowrap">Path to SAM file:</label>
                  <input
                    type="text"
                    readOnly
                    value="C:\Windows\System32\config\SAM"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={onLoadSamHive}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-700 hover:bg-sky-600 text-white font-medium cursor-pointer whitespace-nowrap"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{samHiveLoaded ? 'Reload SAM' : 'Open'}</span>
                  </button>
                </div>

                {!samHiveLoaded ? (
                  <div className="p-6 bg-white border border-slate-300 rounded text-center space-y-2">
                    <HardDrive className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="font-medium text-slate-800">
                      Click &ldquo;Open&rdquo; to mount C:\Windows\System32\config\SAM
                    </p>
                    <p className="text-slate-500">
                      Offline SAM hive access allows resetting local user credentials before booting Windows 11.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* User List Table */}
                    <div className="bg-white border border-slate-300 rounded overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-[11px] text-slate-600">
                            <th className="px-3 py-1.5 font-semibold">RID</th>
                            <th className="px-3 py-1.5 font-semibold">Account Name</th>
                            <th className="px-3 py-1.5 font-semibold">Groups</th>
                            <th className="px-3 py-1.5 font-semibold">Password State</th>
                            <th className="px-3 py-1.5 font-semibold">Account Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                          {accounts.map((acc) => {
                            const isSelected = acc.username === selectedUser;
                            return (
                              <tr
                                key={acc.username}
                                onClick={() => setSelectedUser(acc.username)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected ? 'bg-sky-100 text-slate-950' : 'hover:bg-slate-50'
                                }`}
                              >
                                <td className="px-3 py-2 tabular-nums">{acc.rid}</td>
                                <td className="px-3 py-2 font-semibold">{acc.username}</td>
                                <td className="px-3 py-2 font-sans text-slate-600">{acc.groups.join(', ')}</td>
                                <td className="px-3 py-2">
                                  {acc.passwordIsBlank ? (
                                    <span className="text-emerald-700 font-semibold">Blank (Cleared)</span>
                                  ) : acc.hasPassword ? (
                                    <span className="text-amber-700">Set (Hash Present)</span>
                                  ) : (
                                    <span className="text-slate-500">None</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {acc.isDisabled ? 'Disabled' : acc.isLocked ? 'Locked' : 'Active'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-300 rounded p-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900">
                          Selected: <span className="font-mono">{currentAccount.username}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {currentAccount.passwordIsBlank
                            ? 'Password cleared to blank. Click Save changes to commit SAM hive.'
                            : 'Select "Clear password (Set Blank)" to remove the unknown password.'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onClearPassword(currentAccount.username)}
                          disabled={currentAccount.passwordIsBlank}
                          className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-500 text-white font-medium cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          Clear password (Set Blank)
                        </button>
                        <button
                          type="button"
                          onClick={() => onUnlockAccount(currentAccount.username)}
                          disabled={!currentAccount.isLocked && !currentAccount.isDisabled}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 font-medium cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unlock</span>
                        </button>
                        <button
                          type="button"
                          onClick={onSaveSamChanges}
                          disabled={!samPendingSave}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium cursor-pointer whitespace-nowrap ${
                            samPendingSave
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save changes</span>
                        </button>
                      </div>
                    </div>

                    {!samPendingSave && currentAccount.username === 'cnet54' && currentAccount.passwordIsBlank && (
                      <div className="flex items-center justify-between px-3 py-2 rounded bg-emerald-50 border border-emerald-300 text-emerald-900">
                        <span className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>
                            SAM hive saved: cnet54 password is now blank. Verify Offline Policy or Reboot to Windows 11.
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={onRebootToWindows}
                          className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-medium cursor-pointer whitespace-nowrap"
                        >
                          Reboot to Win11
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {openWindows.includes(activeWindow) && activeWindow === 'policy' && (
            <div className="w-full max-w-2xl bg-[#F1F5F9] text-slate-900 rounded-md shadow-2xl border border-slate-400 overflow-hidden">
              <div className="bg-slate-800 text-white px-3 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-sky-300" />
                  <span className="font-semibold">
                    Offline Registry Policy Editor (C:\Windows\System32\config\SYSTEM & SECURITY)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => closeApp('policy')}
                  className="p-0.5 hover:bg-white/15 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-3 text-xs max-h-[380px] overflow-y-auto">
                <p className="text-slate-600">
                  Ensure Local Group Policy permits blank-password administrative testing without security lockouts and maintains audit logging.
                </p>
                <div className="bg-white border border-slate-300 rounded divide-y divide-slate-200">
                  {gpoSettings.map((gpo) => (
                    <div key={gpo.id} className="p-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">{gpo.name}</div>
                        <div className="font-mono text-[11px] text-slate-500 truncate">{gpo.registryPath}</div>
                      </div>
                      <select
                        value={gpo.value}
                        onChange={(e) => onUpdateGpo(gpo.id, e.target.value)}
                        aria-label={gpo.name}
                        className="px-2.5 py-1.5 rounded border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 shrink-0 cursor-pointer"
                      >
                        {gpo.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {openWindows.includes(activeWindow) && activeWindow === 'cmd' && (
            <div className="w-full max-w-2xl bg-[#0C0F14] text-slate-100 rounded-md shadow-2xl border border-slate-600 overflow-hidden flex flex-col h-[370px]">
              <div className="bg-slate-800 text-white px-3 py-2 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-slate-300" />
                  <span className="font-mono">Administrator: X:\Windows\System32\cmd.exe</span>
                </div>
                <button
                  type="button"
                  onClick={() => closeApp('cmd')}
                  className="p-0.5 hover:bg-white/15 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-0.5 text-slate-200">
                {cmdHistory.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed">
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>
              <form onSubmit={handleCmdSubmit} className="border-t border-slate-800 px-3 py-2 flex items-center gap-2 font-mono text-xs">
                <span className="text-sky-400 shrink-0">X:\Windows\System32&gt;</span>
                <input
                  type="text"
                  value={cmdInput}
                  onChange={(e) => setCmdInput(e.target.value)}
                  placeholder="Type help, dir, reg query lsa, auditpol, wpeutil reboot..."
                  className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none"
                />
              </form>
            </div>
          )}

          {openWindows.includes(activeWindow) && activeWindow === 'logs' && (
            <div className="w-full max-w-2xl bg-[#F1F5F9] text-slate-900 rounded-md shadow-2xl border border-slate-400 overflow-hidden">
              <div className="bg-slate-800 text-white px-3 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="font-semibold">LabRecovery.log — Offline WinPE Audit Trail</span>
                </div>
                <button
                  type="button"
                  onClick={() => closeApp('logs')}
                  className="p-0.5 hover:bg-white/15 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3 bg-slate-950 text-slate-100 font-mono text-[11px] max-h-[340px] overflow-y-auto space-y-1.5">
                {logs.map((log) => (
                  <div key={log.id} className="border-b border-slate-800/80 pb-1.5">
                    <div className="text-slate-400 tabular-nums">
                      [{log.timestamp}] Event {log.eventId} · {log.source} · {log.account}
                    </div>
                    <div className="text-slate-100">{log.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start Menu Popover */}
      {startMenuOpen && (
        <div className="absolute left-2 bottom-11 z-30 w-64 bg-slate-900/95 border border-slate-600 rounded-md shadow-2xl p-2 space-y-1 text-xs">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
            Hiren&apos;s BootCD PE · Security Tools
          </div>
          <button
            type="button"
            onClick={() => openApp('ntpwedit')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-white/10 text-left cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-amber-300" />
            <span>NTPWEdit (Password Reset)</span>
          </button>
          <button
            type="button"
            onClick={() => openApp('policy')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-white/10 text-left cursor-pointer"
          >
            <Shield className="w-4 h-4 text-sky-300" />
            <span>Offline Policy Inspector</span>
          </button>
          <button
            type="button"
            onClick={() => openApp('cmd')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-white/10 text-left cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-slate-300" />
            <span>Command Prompt (Admin)</span>
          </button>
          <button
            type="button"
            onClick={() => openApp('logs')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-white/10 text-left cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-300" />
            <span>Recovery Log Viewer</span>
          </button>
          <div className="border-t border-slate-800 pt-1">
            <button
              type="button"
              onClick={onRebootToWindows}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-sky-600/30 text-sky-200 text-left cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reboot to Windows 11</span>
            </button>
          </div>
        </div>
      )}

      {/* WinPE Taskbar */}
      <div className="relative z-20 h-10 bg-slate-950/90 border-t border-slate-700/80 px-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStartMenuOpen((prev) => !prev)}
            className="px-3 py-1 rounded bg-sky-700 hover:bg-sky-600 text-white font-semibold cursor-pointer whitespace-nowrap"
          >
            HBCD PE
          </button>

          {openWindows.map((win) => (
            <button
              key={win}
              type="button"
              onClick={() => setActiveWindow(win)}
              className={`px-2.5 py-1 rounded border text-[11px] cursor-pointer whitespace-nowrap ${
                activeWindow === win
                  ? 'bg-slate-800 border-sky-500/60 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {win === 'ntpwedit' && 'NTPWEdit 0.7'}
              {win === 'policy' && 'Offline Policy'}
              {win === 'cmd' && 'cmd.exe'}
              {win === 'logs' && 'LabRecovery.log'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-300 font-mono tabular-nums px-2">
          <span>WinPE x64 (X:\)</span>
          <button
            type="button"
            onClick={onRebootToWindows}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-sans cursor-pointer"
          >
            Reboot
          </button>
        </div>
      </div>
    </div>
  );
};
