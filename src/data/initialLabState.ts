import { AuditLogEntry, GpoSetting, SamAccount } from '../types/lab';

export const WIN11_WALLPAPER_URL = '/src/assets/images/win11_bloom_backdrop_1795063823549.jpg';
export const HIRENS_WALLPAPER_URL = '/src/assets/images/hirens_pe_backdrop_1795063824718.jpg';

export function formatLabTimestamp(date = new Date()): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

export const INITIAL_SAM_ACCOUNTS: SamAccount[] = [
  {
    rid: '0x01F4 (500)',
    username: 'Administrator',
    fullName: 'Built-in Administrator',
    groups: ['Administrators'],
    hasPassword: true,
    passwordIsBlank: false,
    isLocked: false,
    isDisabled: true,
    passwordNeverExpires: true,
    lastReset: null,
  },
  {
    rid: '0x03E9 (1001)',
    username: 'cnet54',
    fullName: 'CNET54 Lab Administrator',
    groups: ['Administrators', 'Users'],
    hasPassword: true,
    passwordIsBlank: false,
    isLocked: false,
    isDisabled: false,
    passwordNeverExpires: true,
    lastReset: null,
  },
  {
    rid: '0x01F5 (501)',
    username: 'Guest',
    fullName: 'Built-in Guest Account',
    groups: ['Guests'],
    hasPassword: false,
    passwordIsBlank: true,
    isLocked: false,
    isDisabled: true,
    passwordNeverExpires: false,
    lastReset: null,
  },
];

export const INITIAL_GPO_SETTINGS: GpoSetting[] = [
  {
    id: 'limit-blank-password',
    section: 'Security Options',
    name: 'Accounts: Limit local account use of blank passwords to console logon only',
    registryPath: 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\\LimitBlankPasswordUse',
    value: 'Disabled',
    recommendedLabValue: 'Disabled',
    description:
      'Disabled so blank-password lab accounts (cnet54) can run administrative recovery tests and remote/local management tools without security blocks.',
    options: ['Disabled', 'Enabled'],
  },
  {
    id: 'interactive-no-cad',
    section: 'Security Options',
    name: 'Interactive logon: Do not require CTRL+ALT+DEL',
    registryPath: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\DisableCAD',
    value: 'Enabled',
    recommendedLabValue: 'Enabled',
    description:
      'Permits direct console sign-in during administrative recovery testing without interrupting automated or lab console workflows.',
    options: ['Enabled', 'Disabled'],
  },
  {
    id: 'uac-admin-approval',
    section: 'Security Options',
    name: 'User Account Control: Behavior of the elevation prompt for administrators',
    registryPath: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\ConsentPromptBehaviorAdmin',
    value: 'Prompt for consent (non-credential)',
    recommendedLabValue: 'Prompt for consent (non-credential)',
    description:
      'Allows members of Administrators (cnet54) to elevate administrative consoles cleanly without failing on blank credentials.',
    options: [
      'Prompt for consent (non-credential)',
      'Elevate without prompting',
      'Prompt for credentials',
    ],
  },
  {
    id: 'lockout-threshold',
    section: 'Account Lockout Policy',
    name: 'Account lockout threshold',
    registryPath: 'SAM\\Domains\\Account\\LockoutThreshold',
    value: '0 invalid logon attempts',
    recommendedLabValue: '0 invalid logon attempts',
    description:
      'Prevents security lockout of cnet54 when testing invalid or blank credential recovery procedures.',
    options: ['0 invalid logon attempts', '5 invalid logon attempts', '10 invalid logon attempts'],
  },
  {
    id: 'audit-account-mgmt',
    section: 'Audit Policy',
    name: 'Audit account management',
    registryPath: 'SECURITY\\Policy\\PolAdtEv\\AccountManagement',
    value: 'Success, Failure',
    recommendedLabValue: 'Success, Failure',
    description:
      'Records password resets, SAM modifications, and account updates (Event IDs 4724, 4738) in the Windows Security log.',
    options: ['Success, Failure', 'Success', 'No auditing'],
  },
  {
    id: 'audit-logon-events',
    section: 'Audit Policy',
    name: 'Audit logon events',
    registryPath: 'SECURITY\\Policy\\PolAdtEv\\Logon',
    value: 'Success, Failure',
    recommendedLabValue: 'Success, Failure',
    description:
      'Records all successful and failed local sign-in attempts for cnet54 (Event IDs 4624, 4625).',
    options: ['Success, Failure', 'Success', 'No auditing'],
  },
  {
    id: 'audit-policy-change',
    section: 'Audit Policy',
    name: 'Audit policy change',
    registryPath: 'SECURITY\\Policy\\PolAdtEv\\PolicyChange',
    value: 'Success, Failure',
    recommendedLabValue: 'Success, Failure',
    description:
      'Records modifications to Local Group Policy and audit policies (Event ID 4719) for full compliance traceability.',
    options: ['Success, Failure', 'Success', 'No auditing'],
  },
];

export function createInitialLogs(): AuditLogEntry[] {
  const now = new Date();
  const t1 = new Date(now.getTime() - 18000);
  const t2 = new Date(now.getTime() - 9000);
  const t3 = new Date(now.getTime() - 3000);

  return [
    {
      id: 'log-init-1',
      timestamp: formatLabTimestamp(t1),
      source: 'System',
      eventId: 4608,
      level: 'Information',
      category: 'Security State Change',
      account: 'SYSTEM',
      summary: 'Windows 11 Pro (Build 26100) Local Security Authority initialized.',
      details:
        'LSASS started on WIN11-CNET54-LAB. Local Security Policy and Audit Policy logging subsystems active.',
    },
    {
      id: 'log-init-2',
      timestamp: formatLabTimestamp(t2),
      source: 'Policy-Engine',
      eventId: 4719,
      level: 'Audit Success',
      category: 'Audit Policy Change',
      account: 'SYSTEM',
      summary: 'Lab GPO baseline loaded: blank-password testing & full audit logging enabled.',
      details:
        'LimitBlankPasswordUse=0, LockoutThreshold=0, AuditAccountManagement=Success|Failure, AuditLogon=Success|Failure, AuditPolicyChange=Success|Failure.',
    },
    {
      id: 'log-init-3',
      timestamp: formatLabTimestamp(t3),
      source: 'Security',
      eventId: 4625,
      level: 'Audit Failure',
      category: 'Logon',
      account: 'cnet54',
      summary: 'Prior logon failed for cnet54: password unknown / credential mismatch.',
      details:
        'Sub Status: 0xC000006A (Incorrect password). Account cnet54 remains active (Lockout Threshold = 0). Ready for offline WinPE recovery.',
    },
  ];
}
