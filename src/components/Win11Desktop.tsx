import React, { useState } from 'react';
import {
  ShieldCheck,
  FileSearch,
  Users,
  Terminal,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import { AuditLogEntry, GpoSetting, SamAccount, Win11WindowId } from '../types/lab';
import { WIN11_WALLPAPER_URL } from '../data/initialLabState';

interface Win11DesktopProps {
  accounts: SamAccount[];
  gpoSettings: GpoSetting[];
  logs: AuditLogEntry[];
  onUpdateGpo: (id: string, value: string) => void;
  onApplyBaselineGpo: () => void;
  onInspectEventViewer: () => void;
  onSignOut: () => void;
  onRebootToUefi: () => void;
}

export const Win11Desktop: React.FC<Win11DesktopProps> = ({
  accounts,
  gpoSettings,
  logs,
  onUpdateGpo,
  onApplyBaselineGpo,
  onInspectEventViewer,
  onSignOut,
  onRebootToUefi,
}) => {
  const [openWindows, setOpenWindows] = useState<Win11WindowId[]>(['gpedit']);
  const [activeWindow, setActiveWindow] = useState<Win11WindowId>('gpedit');
  const [gpoSection, setGpoSection] = useState<GpoSetting['section'] | 'All'>('All');
  const [selectedEventId, setSelectedEventId] = useState<string>(logs[logs.length - 1]?.id || '');
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Terminal state
  const [termInput, setTermInput] = useState('');
  const [termOutput, setTermOutput] = useState<string[]>([
    'Windows PowerShell — Administrative Recovery Console',
    'Signed in as: WIN11-CNET54-LAB\\cnet54 (Blank Password · Administrators)',
    'Type "help" to inspect net user, auditpol, gpresult, or security events.',
    '',
  ]);

  const openApp = (id: Win11WindowId) => {
    if (!openWindows.includes(id)) {
      setOpenWindows((prev) => [...prev, id]);
    }
    setActiveWindow(id);
    setStartMenuOpen(false);
    if (id === 'eventvwr') {
      onInspectEventViewer();
      if (logs.length > 0) {
        setSelectedEventId(logs[logs.length - 1].id);
      }
    }
  };

  const closeApp = (id: Win11WindowId) => {
    const next = openWindows.filter((w) => w !== id);
    setOpenWindows(next);
    if (activeWindow === id && next.length > 0) {
      setActiveWindow(next[next.length - 1]);
    }
  };

  const cnet = accounts.find((a) => a.username === 'cnet54')!;
  const allPoliciesConfigured = gpoSettings.every((g) => g.value === g.recommendedLabValue);
  const filteredGpos =
    gpoSection === 'All' ? gpoSettings : gpoSettings.filter((g) => g.section === gpoSection);

  const selectedLog = logs.find((l) => l.id === selectedEventId) || logs[logs.length - 1];

  const handleTermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = termInput.trim();
    if (!raw) return;
    const cmd = raw.toLowerCase();
    const out: string[] = [`PS C:\\Users\\cnet54> ${raw}`];

    if (cmd === 'help') {
      out.push(
        'Available administrative commands:',
        '  whoami                   Show current authenticated user & privileges',
        '  net user cnet54          Inspect local account cnet54 SAM properties',
        '  auditpol /get            Verify Audit Policy logging settings',
        '  gpresult /r              Display applied Local Group Policy summary',
        '  wevtutil qe Security     List latest Security Event Log entries',
        '  gpedit.msc               Open Local Group Policy Editor',
        '  eventvwr.msc             Open Event Viewer (Security Log)',
        '  cls                      Clear console'
      );
    } else if (cmd === 'cls' || cmd === 'clear') {
      setTermOutput([]);
      setTermInput('');
      return;
    } else if (cmd === 'whoami') {
      out.push('win11-cnet54-lab\\cnet54 (BUILTIN\\Administrators — High Mandatory Level)');
    } else if (cmd.startsWith('net user')) {
      out.push(
        `User name                    ${cnet.username}`,
        `Full Name                    ${cnet.fullName}`,
        `Account active               ${cnet.isDisabled ? 'No' : 'Yes'}`,
        `Password required            ${cnet.passwordIsBlank ? 'No (Blank for Lab Testing)' : 'Yes'}`,
        `Local Group Memberships      ${cnet.groups.map((g) => `*${g}`).join('  ')}`,
        `Last password reset          ${cnet.lastReset || 'Never'}`
      );
    } else if (cmd.startsWith('auditpol')) {
      out.push(
        'System audit policy:',
        ...gpoSettings
          .filter((g) => g.section === 'Audit Policy')
          .map((g) => `  ${g.name.padEnd(32)} ${g.value}`)
      );
    } else if (cmd.startsWith('gpresult')) {
      out.push(
        'RSOP data for WIN11-CNET54-LAB\\cnet54 on Local Computer:',
        ...gpoSettings.map((g) => `  [GPO] ${g.name} => ${g.value}`)
      );
    } else if (cmd.startsWith('wevtutil')) {
      const recent = logs.slice(-5);
      out.push(
        ...recent.map(
          (l) => `  [${l.timestamp}] Event ${l.eventId} (${l.level}) - ${l.summary}`
        )
      );
    } else if (cmd === 'gpedit.msc') {
      openApp('gpedit');
      out.push('Opened Local Group Policy Editor (gpedit.msc).');
    } else if (cmd === 'eventvwr.msc') {
      openApp('eventvwr');
      out.push('Opened Event Viewer (eventvwr.msc).');
    } else if (cmd === 'lusrmgr.msc') {
      openApp('lusrmgr');
      out.push('Opened Local Users and Groups (lusrmgr.msc).');
    } else {
      out.push(`Command '${raw}' not recognized in lab shell. Type "help".`);
    }

    setTermOutput((prev) => [...prev, ...out, '']);
    setTermInput('');
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950 text-slate-900 flex flex-col">
      {!imgError ? (
        <img
          src={WIN11_WALLPAPER_URL}
          alt="Windows 11 Desktop"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950" />
      )}

      {/* Desktop Canvas */}
      <div className="relative z-10 flex-1 p-4 flex min-h-0">
        {/* Desktop Shortcuts */}
        <div className="flex flex-col gap-3 w-28 shrink-0 text-white">
          <button
            type="button"
            onClick={() => openApp('gpedit')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-md hover:bg-white/15 transition-colors text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-500/25 border border-sky-300/40 flex items-center justify-center backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-sky-200" />
            </div>
            <span className="text-[11px] font-medium drop-shadow">gpedit.msc</span>
          </button>

          <button
            type="button"
            onClick={() => openApp('eventvwr')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-md hover:bg-white/15 transition-colors text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/25 border border-emerald-300/40 flex items-center justify-center backdrop-blur-sm">
              <FileSearch className="w-5 h-5 text-emerald-200" />
            </div>
            <span className="text-[11px] font-medium drop-shadow">Event Viewer</span>
          </button>

          <button
            type="button"
            onClick={() => openApp('lusrmgr')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-md hover:bg-white/15 transition-colors text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500/25 border border-indigo-300/40 flex items-center justify-center backdrop-blur-sm">
              <Users className="w-5 h-5 text-indigo-200" />
            </div>
            <span className="text-[11px] font-medium drop-shadow">Local Users</span>
          </button>

          <button
            type="button"
            onClick={() => openApp('terminal')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-md hover:bg-white/15 transition-colors text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-900/70 border border-slate-400/40 flex items-center justify-center backdrop-blur-sm">
              <Terminal className="w-5 h-5 text-slate-200" />
            </div>
            <span className="text-[11px] font-medium drop-shadow">PowerShell</span>
          </button>
        </div>

        {/* Active Window Container */}
        <div className="flex-1 flex items-center justify-center px-3 pb-2 min-w-0 min-h-0">
          {openWindows.includes(activeWindow) && activeWindow === 'gpedit' && (
            <div className="w-full max-w-3xl h-full max-h-[430px] bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-200 px-3.5 py-2 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-sky-700" />
                  <span>Local Group Policy Editor (gpedit.msc) — Local Computer Policy</span>
                </div>
                <button
                  type="button"
                  onClick={() => closeApp('gpedit')}
                  className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* GPO Toolbar */}
              <div className="px-3.5 py-2 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
                <div className="flex items-center gap-1">
                  {(['All', 'Security Options', 'Account Lockout Policy', 'Audit Policy'] as const).map(
                    (sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setGpoSection(sec)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          gpoSection === sec
                            ? 'bg-sky-700 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {sec}
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {allPoliciesConfigured ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Lab Baseline Active</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={onApplyBaselineGpo}
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-medium cursor-pointer whitespace-nowrap"
                    >
                      Restore Lab Baseline
                    </button>
                  )}
                </div>
              </div>

              {/* GPO Table */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
                {filteredGpos.map((gpo) => {
                  const matchesLab = gpo.value === gpo.recommendedLabValue;
                  return (
                    <div key={gpo.id} className="p-3.5 flex items-start justify-between gap-4 hover:bg-slate-50">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                          <span>{gpo.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 leading-relaxed">{gpo.description}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate">
                          {gpo.section} · {gpo.registryPath}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <select
                          value={gpo.value}
                          onChange={(e) => onUpdateGpo(gpo.id, e.target.value)}
                          aria-label={gpo.name}
                          className="px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-medium text-slate-800 cursor-pointer"
                        >
                          {gpo.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <span
                          className={`text-[10px] font-medium flex items-center gap-1 ${
                            matchesLab ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {matchesLab ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Permits Lab Recovery</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Recommended: {gpo.recommendedLabValue}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {openWindows.includes(activeWindow) && activeWindow === 'eventvwr' && (
            <div className="w-full max-w-3xl h-full max-h-[430px] bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-200 px-3.5 py-2 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <FileSearch className="w-4 h-4 text-emerald-700" />
                  <span>Event Viewer (eventvwr.msc) — Windows Logs &gt; Security</span>
                </div>
                <button
                  type="button"
                  onClick={() => closeApp('eventvwr')}
                  className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto border-b border-slate-200">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-3 py-1.5 font-semibold">Level</th>
                      <th className="px-3 py-1.5 font-semibold">Timestamp</th>
                      <th className="px-3 py-1.5 font-semibold">Event ID</th>
                      <th className="px-3 py-1.5 font-semibold">Account</th>
                      <th className="px-3 py-1.5 font-semibold">Task Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...logs].reverse().map((log) => {
                      const isSel = selectedLog?.id === log.id;
                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedEventId(log.id)}
                          className={`cursor-pointer ${isSel ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-3 py-1.5 font-medium whitespace-nowrap">
                            <span
                              className={
                                log.level === 'Audit Failure'
                                  ? 'text-red-700'
                                  : log.level === 'Audit Success'
                                  ? 'text-emerald-700'
                                  : 'text-slate-700'
                              }
                            >
                              {log.level}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="px-3 py-1.5 font-mono tabular-nums font-semibold text-slate-800">
                            {log.eventId}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-slate-700">{log.account}</td>
                          <td className="px-3 py-1.5 text-slate-800 truncate max-w-[260px]">{log.summary}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedLog && (
                <div className="p-3 bg-slate-50 text-xs space-y-1 shrink-0">
                  <div className="font-semibold text-slate-900">
                    Event {selectedLog.eventId} · {selectedLog.category} · Source: {selectedLog.source}
                  </div>
                  <div className="font-mono text-[11px] text-slate-700 leading-relaxed">
                    {selectedLog.details}
                  </div>
                </div>
              )}
            </div>
          )}

          {openWindows.includes(activeWindow) && activeWindow === 'lusrmgr' && (
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-slate-300 overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-200 px-3.5 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Users className="w-4 h-4 text-indigo-700" />
                  <span>Local Users and Groups (lusrmgr.msc) — Users</span>
                </div>
                <button
                  type="button"
                  onClick={() => closeApp('lusrmgr')}
                  className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <table className="w-full text-left border border-slate-200 rounded">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Full Name</th>
                      <th className="px-3 py-2 font-semibold">Member Of</th>
                      <th className="px-3 py-2 font-semibold">Password Policy State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {accounts.map((acc) => (
                      <tr key={acc.username} className={acc.username === 'cnet54' ? 'bg-sky-50/70' : ''}>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-900">{acc.username}</td>
                        <td className="px-3 py-2 text-slate-700">{acc.fullName}</td>
                        <td className="px-3 py-2 text-slate-600">{acc.groups.join(', ')}</td>
                        <td className="px-3 py-2">
                          {acc.username === 'cnet54' && acc.passwordIsBlank
                            ? 'Blank (Lab Testing Enabled)'
                            : acc.isDisabled
                            ? 'Account Disabled'
                            : 'Password Set'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-[11px] text-slate-600">
                  Account <span className="font-mono font-semibold text-slate-900">cnet54</span> is an active member of{' '}
                  <span className="font-semibold">Administrators</span> with blank-password logon permitted by Local Group Policy.
                </div>
              </div>
            </div>
          )}

          {openWindows.includes(activeWindow) && activeWindow === 'terminal' && (
            <div className="w-full max-w-2xl h-full max-h-[410px] bg-[#0F172A] text-slate-100 rounded-lg shadow-2xl border border-slate-600 flex flex-col overflow-hidden">
              <div className="bg-slate-800 px-3.5 py-2 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-sky-300" />
                  <span>Administrator: Windows PowerShell (cnet54)</span>
                </div>
                <button
                  type="button"
                  onClick={() => closeApp('terminal')}
                  className="p-1 hover:bg-white/15 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-0.5 text-slate-200">
                {termOutput.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>
              <form onSubmit={handleTermSubmit} className="border-t border-slate-800 px-3 py-2 flex items-center gap-2 font-mono text-xs">
                <span className="text-sky-400 shrink-0">PS C:\Users\cnet54&gt;</span>
                <input
                  type="text"
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  placeholder="Type whoami, net user cnet54, auditpol /get, gpresult /r..."
                  className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none"
                />
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Start Menu Popover */}
      {startMenuOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-12 z-30 w-80 bg-slate-900/95 border border-white/15 text-white rounded-xl shadow-2xl p-3 backdrop-blur-xl space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <div className="font-semibold">cnet54</div>
              <div className="text-[11px] text-slate-300">Administrators · Blank Password Lab</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setStartMenuOpen(false);
                  onSignOut();
                }}
                title="Lock / Sign out"
                className="p-1.5 rounded hover:bg-white/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartMenuOpen(false);
                  onRebootToUefi();
                }}
                title="Restart to UEFI Boot Menu"
                className="p-1.5 rounded hover:bg-white/10 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => openApp('gpedit')}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-white/10 text-left cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-sky-300 shrink-0" />
              <span>Group Policy</span>
            </button>
            <button
              type="button"
              onClick={() => openApp('eventvwr')}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-white/10 text-left cursor-pointer"
            >
              <FileSearch className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Event Viewer</span>
            </button>
            <button
              type="button"
              onClick={() => openApp('lusrmgr')}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-white/10 text-left cursor-pointer"
            >
              <Users className="w-4 h-4 text-indigo-300 shrink-0" />
              <span>Local Users</span>
            </button>
            <button
              type="button"
              onClick={() => openApp('terminal')}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-white/10 text-left cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-slate-300 shrink-0" />
              <span>PowerShell</span>
            </button>
          </div>
        </div>
      )}

      {/* Windows 11 Taskbar */}
      <div className="relative z-20 h-11 bg-slate-950/85 border-t border-white/15 backdrop-blur-md px-4 flex items-center justify-between text-xs text-white">
        <div className="text-[11px] text-slate-300 hidden sm:block">
          Signed in: <span className="font-mono text-white">cnet54</span>
        </div>

        <div className="flex items-center gap-1.5 mx-auto">
          <button
            type="button"
            onClick={() => setStartMenuOpen((prev) => !prev)}
            className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 font-semibold text-[11px] cursor-pointer whitespace-nowrap"
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => openApp('gpedit')}
            className={`px-2.5 py-1.5 rounded text-[11px] cursor-pointer whitespace-nowrap ${
              activeWindow === 'gpedit' && openWindows.includes('gpedit')
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-slate-200'
            }`}
          >
            gpedit.msc
          </button>
          <button
            type="button"
            onClick={() => openApp('eventvwr')}
            className={`px-2.5 py-1.5 rounded text-[11px] cursor-pointer whitespace-nowrap ${
              activeWindow === 'eventvwr' && openWindows.includes('eventvwr')
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-slate-200'
            }`}
          >
            Event Viewer
          </button>
          <button
            type="button"
            onClick={() => openApp('lusrmgr')}
            className={`px-2.5 py-1.5 rounded text-[11px] cursor-pointer whitespace-nowrap ${
              activeWindow === 'lusrmgr' && openWindows.includes('lusrmgr')
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-slate-200'
            }`}
          >
            Local Users
          </button>
          <button
            type="button"
            onClick={() => openApp('terminal')}
            className={`px-2.5 py-1.5 rounded text-[11px] cursor-pointer whitespace-nowrap ${
              activeWindow === 'terminal' && openWindows.includes('terminal')
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-slate-200'
            }`}
          >
            PowerShell
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-[11px] text-slate-200 cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Lock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
