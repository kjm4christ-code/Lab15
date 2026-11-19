import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Download,
  HelpCircle,
  RotateCcw,
  Usb,
} from 'lucide-react';
import { AuditLogEntry, GpoSetting, LabMilestone, SamAccount, VmStage } from '../types/lab';

interface LabControlDeckProps {
  vmStage: VmStage;
  milestones: LabMilestone[];
  cnetAccount: SamAccount;
  gpoSettings: GpoSetting[];
  logs: AuditLogEntry[];
  activePanelTab: 'checklist' | 'policy' | 'logs';
  onChangePanelTab: (tab: 'checklist' | 'policy' | 'logs') => void;
  onTriggerBootMenu: () => void;
  onExportLogs: () => void;
  onResetLab: () => void;
  onUpdateGpo: (id: string, value: string) => void;
}

export const LabControlDeck: React.FC<LabControlDeckProps> = ({
  vmStage,
  milestones,
  cnetAccount,
  gpoSettings,
  logs,
  activePanelTab,
  onChangePanelTab,
  onTriggerBootMenu,
  onExportLogs,
  onResetLab,
  onUpdateGpo,
}) => {
  const [logFilter, setLogFilter] = useState<'All' | 'Security' | 'Boot & SAM' | 'Policy'>('All');
  const [expandedHint, setExpandedHint] = useState<string | null>(null);

  const completedCount = milestones.filter((m) => m.completed).length;
  const gpoBaselineReady = gpoSettings.every((g) => g.value === g.recommendedLabValue);
  const auditingEnabled = gpoSettings
    .filter((g) => g.section === 'Audit Policy')
    .every((g) => g.value !== 'No auditing');

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'All') return true;
    if (logFilter === 'Security') return log.source === 'Security';
    if (logFilter === 'Boot & SAM') return log.source === 'WinPE-Boot' || log.source === 'SAM-Tool';
    if (logFilter === 'Policy') return log.source === 'Policy-Engine';
    return true;
  });

  const stageLabel =
    vmStage === 'win11_lock'
      ? 'Windows 11 Sign-In Screen'
      : vmStage === 'uefi_boot'
      ? 'UEFI Boot Manager'
      : vmStage === 'hirens_loading'
      ? "Booting Hiren's BootCD PE"
      : vmStage === 'hirens_desktop'
      ? "Hiren's BootCD PE Desktop"
      : vmStage === 'win11_booting'
      ? 'Booting Windows 11'
      : 'Windows 11 Desktop (cnet54)';

  return (
    <aside className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden h-full">
      {/* Summary Header */}
      <div className="p-4 border-b border-slate-200 space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Recovery Lab Control Deck</h2>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            {completedCount}/{milestones.length} Complete
          </span>
        </div>

        {/* Clean Unboxed Metadata Line */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
          <span>Host: {stageLabel}</span>
          <span aria-hidden="true">·</span>
          <span>
            cnet54:{' '}
            <strong className={cnetAccount.passwordIsBlank ? 'text-emerald-700' : 'text-amber-700'}>
              {cnetAccount.passwordIsBlank ? 'Blank Password' : 'Password Unknown'}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Logs:{' '}
            <strong className={auditingEnabled ? 'text-emerald-700' : 'text-red-700'}>
              {auditingEnabled ? 'Enabled' : 'Disabled'}
            </strong>
          </span>
        </div>

        {/* VM Hardware Action Row */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onTriggerBootMenu}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <Usb className="w-3.5 h-3.5" />
            <span>F12 Boot Menu</span>
          </button>
          <button
            type="button"
            onClick={onExportLogs}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log</span>
          </button>
          <button
            type="button"
            onClick={onResetLab}
            title="Reset simulation back to initial locked state"
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => onChangePanelTab('checklist')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activePanelTab === 'checklist'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Checklist
          </button>
          <button
            type="button"
            onClick={() => onChangePanelTab('policy')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activePanelTab === 'policy'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Group Policy
          </button>
          <button
            type="button"
            onClick={() => onChangePanelTab('logs')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activePanelTab === 'logs'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Logs ({logs.length})
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {activePanelTab === 'checklist' && (
          <div className="space-y-3">
            {milestones.map((step) => {
              const isHintOpen = expandedHint === step.id;
              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    step.completed
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-900">
                          {step.stepNumber}. {step.title}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedHint(isHintOpen ? null : step.id)}
                      title="Toggle step guidance"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer shrink-0"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isHintOpen && (
                    <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-700 leading-relaxed">
                      Guidance: {step.hint}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activePanelTab === 'policy' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-600 leading-relaxed">
              Local Group Policy is configured for administrative recovery testing without security lockouts.{' '}
              <span className="font-semibold text-slate-900">
                {gpoBaselineReady ? 'All 7 lab policies verified.' : 'Custom modifications active.'}
              </span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
              {gpoSettings.map((gpo) => (
                <div key={gpo.id} className="p-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-900">{gpo.name}</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">{gpo.section}</span>
                    <select
                      value={gpo.value}
                      onChange={(e) => onUpdateGpo(gpo.id, e.target.value)}
                      aria-label={gpo.name}
                      className="px-2 py-1 rounded border border-slate-300 bg-slate-50 text-[11px] font-medium text-slate-800 cursor-pointer"
                    >
                      {gpo.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePanelTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1 flex-wrap">
              {(['All', 'Security', 'Boot & SAM', 'Policy'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setLogFilter(cat)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    logFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {[...filteredLogs].reverse().map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      Event {log.eventId} · {log.source}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">{log.timestamp.slice(11)}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-900">{log.summary}</div>
                  <div className="text-[11px] text-slate-600 font-mono leading-relaxed">{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
