import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Monitor, Loader2 } from 'lucide-react';
import {
  AuditLogEntry,
  GpoSetting,
  LabMilestone,
  SamAccount,
  VmStage,
} from './types/lab';
import {
  createInitialLogs,
  formatLabTimestamp,
  INITIAL_GPO_SETTINGS,
  INITIAL_SAM_ACCOUNTS,
} from './data/initialLabState';
import { Win11LockScreen } from './components/Win11LockScreen';
import { UefiBootMenu } from './components/UefiBootMenu';
import { HirensDesktop } from './components/HirensDesktop';
import { Win11Desktop } from './components/Win11Desktop';
import { LabControlDeck } from './components/LabControlDeck';

export default function App() {
  const [vmStage, setVmStage] = useState<VmStage>('win11_lock');
  const [accounts, setAccounts] = useState<SamAccount[]>(INITIAL_SAM_ACCOUNTS);
  const [gpoSettings, setGpoSettings] = useState<GpoSetting[]>(INITIAL_GPO_SETTINGS);
  const [logs, setLogs] = useState<AuditLogEntry[]>(createInitialLogs);

  // Recovery progress tracking flags
  const [samHiveLoaded, setSamHiveLoaded] = useState(false);
  const [samPendingSave, setSamPendingSave] = useState(false);
  const [samSaved, setSamSaved] = useState(false);
  const [bootedHirens, setBootedHirens] = useState(false);
  const [signedInBlank, setSignedInBlank] = useState(false);
  const [verifiedEventViewer, setVerifiedEventViewer] = useState(false);

  const [activePanelTab, setActivePanelTab] = useState<'checklist' | 'policy' | 'logs'>('checklist');
  const vmStageRef = useRef<HTMLDivElement | null>(null);

  const appendLog = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: formatLabTimestamp(new Date()),
    };
    setLogs((prev) => [...prev, newEntry]);
  }, []);

  const cnetAccount = useMemo(
    () => accounts.find((a) => a.username === 'cnet54') || accounts[1],
    [accounts]
  );

  const auditingEnabled = useMemo(
    () =>
      gpoSettings
        .filter((g) => g.section === 'Audit Policy')
        .every((g) => g.value !== 'No auditing'),
    [gpoSettings]
  );

  const gpoBaselineReady = useMemo(
    () => gpoSettings.every((g) => g.value === g.recommendedLabValue),
    [gpoSettings]
  );

  const handleAttemptSignIn = useCallback(
    (passwordAttempt: string): { success: boolean; message: string } => {
      if (!cnetAccount.hasPassword && cnetAccount.passwordIsBlank) {
        if (passwordAttempt.length > 0) {
          if (auditingEnabled) {
            appendLog({
              source: 'Security',
              eventId: 4625,
              level: 'Audit Failure',
              category: 'Logon',
              account: 'cnet54',
              summary: 'Logon failed for cnet54: password field must be empty (blank password set).',
              details:
                'Sub Status: 0xC000006A. Clear the password input field and click Sign in.',
            });
          }
          return {
            success: false,
            message: 'Password is set to blank. Leave the password field empty and click Sign in.',
          };
        }

        setSignedInBlank(true);
        setVmStage('win11_desktop');
        if (auditingEnabled) {
          appendLog({
            source: 'Security',
            eventId: 4624,
            level: 'Audit Success',
            category: 'Logon',
            account: 'cnet54',
            summary: 'cnet54 signed into Windows 11 with blank password (administrative recovery verified).',
            details:
              'Logon Type: 2 (Interactive). Elevation: Full Administrator Token. Blank password permitted via LimitBlankPasswordUse=0.',
          });
        }
        return { success: true, message: 'Signed in successfully.' };
      }

      if (auditingEnabled) {
        appendLog({
          source: 'Security',
          eventId: 4625,
          level: 'Audit Failure',
          category: 'Logon',
          account: 'cnet54',
          summary: 'Interactive sign-in failed for cnet54: unknown password.',
          details:
            'Sub Status: 0xC000006A (Incorrect password). Account lockout threshold = 0 (No lockout triggered).',
        });
      }

      return {
        success: false,
        message: 'The password is incorrect. Try again or restart to UEFI Boot Menu.',
      };
    },
    [cnetAccount, auditingEnabled, appendLog]
  );

  const handleTriggerBootMenu = useCallback(() => {
    setVmStage('uefi_boot');
    appendLog({
      source: 'WinPE-Boot',
      eventId: 1001,
      level: 'Information',
      category: 'Firmware Boot',
      account: 'SYSTEM',
      summary: 'System restarted to UEFI Firmware Boot Manager (F12).',
      details: 'Waiting for operator selection between NVMe Windows Boot Manager and USB Recovery Media.',
    });
  }, [appendLog]);

  const handleSelectHirensUsb = useCallback(() => {
    setVmStage('hirens_loading');
    setBootedHirens(true);
    appendLog({
      source: 'WinPE-Boot',
      eventId: 1002,
      level: 'Information',
      category: 'USB Recovery Boot',
      account: 'SYSTEM',
      summary: "Booting UEFI USB: Hiren's BootCD PE x64 (WinPE 11).",
      details: 'Kingston DataTraveler 3.0 mounted at X:\\. Offline Windows volume mounted at C:\\.',
    });
    window.setTimeout(() => {
      setVmStage('hirens_desktop');
    }, 900);
  }, [appendLog]);

  const handleSelectWindowsBoot = useCallback(() => {
    setVmStage('win11_booting');
    appendLog({
      source: 'System',
      eventId: 1003,
      level: 'Information',
      category: 'OS Boot',
      account: 'SYSTEM',
      summary: 'Booting Windows Boot Manager (NVMe0n1 — Windows 11 Pro).',
      details: cnetAccount.passwordIsBlank
        ? 'SAM database reflects blank password for cnet54.'
        : 'SAM database unchanged; cnet54 password remains unknown.',
    });
    window.setTimeout(() => {
      setVmStage('win11_lock');
    }, 750);
  }, [appendLog, cnetAccount.passwordIsBlank]);

  const handleLoadSamHive = useCallback(() => {
    setSamHiveLoaded(true);
    appendLog({
      source: 'SAM-Tool',
      eventId: 4798,
      level: 'Audit Success',
      category: 'SAM Enumeration',
      account: 'SYSTEM (WinPE)',
      summary: 'NTPWEdit mounted offline SAM hive: C:\\Windows\\System32\\config\\SAM.',
      details: 'Enumerated local accounts: Administrator (RID 500), cnet54 (RID 1001), Guest (RID 501).',
    });
  }, [appendLog]);

  const handleClearPassword = useCallback(
    (username: string) => {
      const stamp = formatLabTimestamp(new Date());
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.username === username
            ? {
                ...acc,
                hasPassword: false,
                passwordIsBlank: true,
                lastReset: stamp,
              }
            : acc
        )
      );
      setSamPendingSave(true);
      appendLog({
        source: 'SAM-Tool',
        eventId: 4724,
        level: 'Audit Success',
        category: 'User Account Management',
        account: username,
        summary: `NTPWEdit staged blank password reset for local account ${username}.`,
        details: `Cleared NT/LM password hash in memory buffer for ${username}. Pending SAM hive commit.`,
      });
    },
    [appendLog]
  );

  const handleUnlockAccount = useCallback(
    (username: string) => {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.username === username ? { ...acc, isLocked: false, isDisabled: false } : acc
        )
      );
      setSamPendingSave(true);
      appendLog({
        source: 'SAM-Tool',
        eventId: 4767,
        level: 'Audit Success',
        category: 'User Account Management',
        account: username,
        summary: `Account ${username} unlocked / enabled in offline SAM buffer.`,
        details: 'Account control flags updated (UF_ACCOUNTDISABLE / UF_LOCKOUT cleared).',
      });
    },
    [appendLog]
  );

  const handleSaveSamChanges = useCallback(() => {
    setSamPendingSave(false);
    setSamSaved(true);
    appendLog({
      source: 'SAM-Tool',
      eventId: 4738,
      level: 'Audit Success',
      category: 'SAM Hive Commit',
      account: 'cnet54',
      summary: 'Saved modified SAM hive to C:\\Windows\\System32\\config\\SAM.',
      details: 'Committed blank-password credential state for cnet54. Ready to reboot into Windows 11.',
    });
  }, [appendLog]);

  const handleUpdateGpo = useCallback(
    (id: string, value: string) => {
      setGpoSettings((prev) =>
        prev.map((g) => (g.id === id ? { ...g, value } : g))
      );
      const target = gpoSettings.find((g) => g.id === id);
      appendLog({
        source: 'Policy-Engine',
        eventId: 4719,
        level: 'Audit Success',
        category: 'Policy Change',
        account: vmStage === 'win11_desktop' ? 'cnet54' : 'SYSTEM (WinPE)',
        summary: `Updated Local Group Policy "${target?.name || id}" -> ${value}.`,
        details: `Registry path ${target?.registryPath || ''} updated to "${value}".`,
      });
    },
    [gpoSettings, vmStage, appendLog]
  );

  const handleApplyBaselineGpo = useCallback(() => {
    setGpoSettings((prev) =>
      prev.map((g) => ({ ...g, value: g.recommendedLabValue }))
    );
    appendLog({
      source: 'Policy-Engine',
      eventId: 4719,
      level: 'Audit Success',
      category: 'Policy Change',
      account: 'cnet54',
      summary: 'Applied complete CNET54 Administrative Recovery Lab GPO baseline.',
      details:
        'LimitBlankPasswordUse=Disabled, AccountLockoutThreshold=0, Audit Account Management/Logon/PolicyChange=Success,Failure.',
    });
  }, [appendLog]);

  const handleExportLogs = useCallback(() => {
    const header = [
      'CNET54 WINDOWS 11 ADMINISTRATIVE RECOVERY LAB — AUDIT REPORT',
      `Generated: ${formatLabTimestamp(new Date())}`,
      `Account: ${cnetAccount.username} (Groups: ${cnetAccount.groups.join(', ')})`,
      `Password State: ${cnetAccount.passwordIsBlank ? 'Blank (Cleared for Lab Testing)' : 'Unknown / Set'}`,
      `Local Group Policy Lab Baseline: ${gpoBaselineReady ? 'Verified' : 'Custom'}`,
      '',
      '--- LOCAL GROUP POLICY CONFIGURATION ---',
      ...gpoSettings.map((g) => `[${g.section}] ${g.name}: ${g.value}`),
      '',
      '--- CHRONOLOGICAL SECURITY & RECOVERY AUDIT LOG ---',
      ...logs.map(
        (l) =>
          `[${l.timestamp}] Event ${l.eventId} | ${l.level} | ${l.source} | Account: ${l.account} | ${l.summary}\n    ${l.details}`
      ),
    ].join('\n');

    const blob = new Blob([header], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cnet54-recovery-audit-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [cnetAccount, gpoBaselineReady, gpoSettings, logs]);

  const handleResetLab = useCallback(() => {
    setVmStage('win11_lock');
    setAccounts(INITIAL_SAM_ACCOUNTS);
    setGpoSettings(INITIAL_GPO_SETTINGS);
    setLogs(createInitialLogs());
    setSamHiveLoaded(false);
    setSamPendingSave(false);
    setSamSaved(false);
    setBootedHirens(false);
    setSignedInBlank(false);
    setVerifiedEventViewer(false);
    setActivePanelTab('checklist');
  }, []);

  const milestones: LabMilestone[] = useMemo(
    () => [
      {
        id: 'step-1',
        stepNumber: '01',
        title: 'Boot to UEFI & Launch Hiren’s BootCD PE USB',
        description:
          'Restart from the locked Windows 11 screen (cnet54 password unknown) and select the Hiren’s BootCD PE USB device.',
        completed: bootedHirens,
        hint: 'Click Power > Restart to UEFI Boot Menu on the Windows 11 screen (or click F12 Boot Menu), then pick Hiren’s BootCD PE x64.',
      },
      {
        id: 'step-2',
        stepNumber: '02',
        title: 'Mount Offline SAM Hive in NTPWEdit',
        description:
          'Open NTPWEdit inside Hiren’s BootCD PE and load C:\\Windows\\System32\\config\\SAM.',
        completed: samHiveLoaded,
        hint: 'In NTPWEdit 0.7, click the "Open" button next to C:\\Windows\\System32\\config\\SAM.',
      },
      {
        id: 'step-3',
        stepNumber: '03',
        title: 'Clear cnet54 Password to Blank & Save SAM',
        description:
          'Select user cnet54, clear its password to blank for easy testing access, and save changes to the SAM file.',
        completed: samSaved && cnetAccount.passwordIsBlank,
        hint: 'Click cnet54 in the user table, click "Clear password (Set Blank)", then click "Save changes".',
      },
      {
        id: 'step-4',
        stepNumber: '04',
        title: 'Sign Into Windows 11 as cnet54 (Blank Password)',
        description:
          'Reboot back to Windows Boot Manager and sign into cnet54 using a blank password.',
        completed: signedInBlank,
        hint: 'Click "Reboot to Win11" in Hiren’s PE, choose Windows Boot Manager, then click "Sign in (Blank Password)".',
      },
      {
        id: 'step-5',
        stepNumber: '05',
        title: 'Verify Local Group Policy Allows Administrative Testing',
        description:
          'Confirm blank-password access, zero lockout threshold, and audit policies are configured without security lockdowns.',
        completed: gpoBaselineReady && auditingEnabled && signedInBlank,
        hint: 'Open gpedit.msc on the Windows 11 desktop (or check the Group Policy tab) to verify LimitBlankPasswordUse is Disabled and Audit Policies are Success, Failure.',
      },
      {
        id: 'step-6',
        stepNumber: '06',
        title: 'Inspect Security Event Logs',
        description:
          'Open Event Viewer (eventvwr.msc) on Windows 11 to verify Event IDs 4625, 4724, 4738, and 4624 are recorded.',
        completed: verifiedEventViewer && signedInBlank,
        hint: 'Click Event Viewer on the Windows 11 desktop or taskbar to inspect the full recovery audit trail.',
      },
    ],
    [
      bootedHirens,
      samHiveLoaded,
      samSaved,
      cnetAccount.passwordIsBlank,
      signedInBlank,
      gpoBaselineReady,
      auditingEnabled,
      verifiedEventViewer,
    ]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Three-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8 shrink-0">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            vmStageRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          CNET54 Recovery Lab
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => vmStageRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            VM Console
          </button>
          <button
            type="button"
            onClick={() => setActivePanelTab('checklist')}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activePanelTab === 'checklist' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            Recovery Checklist
          </button>
          <button
            type="button"
            onClick={() => setActivePanelTab('policy')}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activePanelTab === 'policy' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            Group Policy
          </button>
          <button
            type="button"
            onClick={() => setActivePanelTab('logs')}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activePanelTab === 'logs' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            Audit Logs
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleExportLogs}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Export Audit Report
          </button>
        </div>
      </header>

      {/* Main Two-Zone Simulation Workspace */}
      <main
        id="top"
        className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4"
      >
        {/* Concise Lab Context Strip */}
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 text-balance">
              Windows 11 Administrative Account Recovery &amp; Audit Sandbox
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Account <span className="font-mono font-medium text-slate-900">cnet54</span> · Boot{' '}
              <span className="font-medium text-slate-800">Hiren&apos;s BootCD PE USB</span> · Clear password to blank · Verify Group Policy &amp; Event Logs
            </p>
          </div>
        </div>

        {/* Two-Zone Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 min-h-[560px]">
          {/* Left Interactive VM Stage (8/12 = ~66%) */}
          <section
            ref={vmStageRef}
            aria-label="Virtual Machine Display"
            className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-300 shadow-sm overflow-hidden flex flex-col min-h-[520px] lg:h-[600px]"
          >
            {/* VM Monitor Bezel Top */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 shrink-0">
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-medium text-slate-100">WIN11-CNET54-LAB</span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {vmStage === 'hirens_desktop' || vmStage === 'hirens_loading'
                    ? "Hiren's BootCD PE x64 (USB)"
                    : vmStage === 'uefi_boot'
                    ? 'Aptio UEFI Boot Manager'
                    : 'Windows 11 Pro (x64)'}
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                1280 &times; 720 · Audit: {auditingEnabled ? 'ON' : 'OFF'}
              </div>
            </div>

            {/* Active VM Screen */}
            <div className="flex-1 relative min-h-0">
              {vmStage === 'win11_lock' && (
                <Win11LockScreen
                  cnetAccount={cnetAccount}
                  onAttemptSignIn={handleAttemptSignIn}
                  onRebootToUefi={handleTriggerBootMenu}
                />
              )}

              {vmStage === 'uefi_boot' && (
                <UefiBootMenu
                  onSelectWindows={handleSelectWindowsBoot}
                  onSelectHirensUsb={handleSelectHirensUsb}
                  samCleared={samSaved && cnetAccount.passwordIsBlank}
                />
              )}

              {(vmStage === 'hirens_loading' || vmStage === 'win11_booting') && (
                <div className="w-full h-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                  <div className="text-sm font-medium">
                    {vmStage === 'hirens_loading'
                      ? "Loading Hiren's BootCD PE x64 into RAMDisk (X:\\)..."
                      : 'Starting Windows 11 Pro (NVMe0n1)...'}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {vmStage === 'hirens_loading'
                      ? 'Mounting C:\\Windows\\System32\\config hives for offline maintenance'
                      : 'Initializing Local Security Authority & Group Policy Engine'}
                  </div>
                </div>
              )}

              {vmStage === 'hirens_desktop' && (
                <HirensDesktop
                  accounts={accounts}
                  gpoSettings={gpoSettings}
                  logs={logs}
                  samHiveLoaded={samHiveLoaded}
                  onLoadSamHive={handleLoadSamHive}
                  onClearPassword={handleClearPassword}
                  onUnlockAccount={handleUnlockAccount}
                  onSaveSamChanges={handleSaveSamChanges}
                  samPendingSave={samPendingSave}
                  onUpdateGpo={handleUpdateGpo}
                  onRebootToWindows={handleSelectWindowsBoot}
                />
              )}

              {vmStage === 'win11_desktop' && (
                <Win11Desktop
                  accounts={accounts}
                  gpoSettings={gpoSettings}
                  logs={logs}
                  onUpdateGpo={handleUpdateGpo}
                  onApplyBaselineGpo={handleApplyBaselineGpo}
                  onInspectEventViewer={() => setVerifiedEventViewer(true)}
                  onSignOut={() => setVmStage('win11_lock')}
                  onRebootToUefi={handleTriggerBootMenu}
                />
              )}
            </div>
          </section>

          {/* Right Control & Audit Deck (4/12 = ~33%) */}
          <div className="lg:col-span-4 lg:h-[600px]">
            <LabControlDeck
              vmStage={vmStage}
              milestones={milestones}
              cnetAccount={cnetAccount}
              gpoSettings={gpoSettings}
              logs={logs}
              activePanelTab={activePanelTab}
              onChangePanelTab={setActivePanelTab}
              onTriggerBootMenu={handleTriggerBootMenu}
              onExportLogs={handleExportLogs}
              onResetLab={handleResetLab}
              onUpdateGpo={handleUpdateGpo}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
