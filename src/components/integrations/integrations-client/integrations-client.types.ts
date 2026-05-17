export type SpireAccountOption = {
  id: string;
  name: string;
  category: string;
};

export type BankAccountLinkData = {
  id: string;
  basiqAccountId: string;
  basiqAccountName: string;
  spireAccountId: string | null;
  lastSyncedAt: string | null;
  spireAccount: SpireAccountOption | null;
};

export type BankConnectionData = {
  id: string;
  basiqConnectionId: string;
  institution: string | null;
  status: string;
  createdAt: string;
  accountLinks: BankAccountLinkData[];
};

export type IntegrationsClientProps = {
  connections: BankConnectionData[];
  spireAccounts: SpireAccountOption[];
  initialError: string | null;
  initialConnected: boolean;
};
