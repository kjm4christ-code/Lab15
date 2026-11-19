export type VmStage =
  | 'win11_lock'
  | 'uefi_boot'
  | 'hirens_loading'
  | 'hirens_desktop'
  | 'win11_booting'
  | 'win11_desktop';

export type HirensWindowId = 'ntpwedit' | 'policy' | 'cmd' | 'logs';
export type Win11WindowId = 'gpedit' | 'eventvwr' | 'lusrmgr' | 'terminal';

export interface SamAccount {
  rid: string;
  username: string;
  fullName: string;
  groups: string[];
  hasPassword: boolean;
  passwordIsBlank: boolean;
  isLocked: boolean;
  isDisabled: boolean;
  passwordNeverExpires: boolean;
  lastReset: string | null;
}

export interface GpoSetting {
  id: string;
  section: 'Security Options' | 'Account Lockout Policy' | 'Audit Policy';
  name: string;
  registryPath: string;
  value: string;
  recommendedLabValue: string;
  description: string;
  options: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  source: 'Security' | 'WinPE-Boot' | 'SAM-Tool' | 'Policy-Engine' | 'System';
  eventId: number;
  level: 'Information' | 'Audit Success' | 'Audit Failure' | 'Warning';
  category: string;
  account: string;
  summary: string;
  details: string;
}

export interface LabMilestone {
  id: string;
  stepNumber: string;
  title: string;
  description: string;
  completed: boolean;
  hint: string;
}
