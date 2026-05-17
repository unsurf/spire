export const BASIQ_BASE_URL = "https://au-api.basiq.io";
export const BASIQ_CONSENT_URL = "https://consent.basiq.io/home";
export const BASIQ_VERSION = "3.0";

export const BASIQ_JOB_STEPS = {
  VERIFY_CREDENTIALS: "verify-credentials",
  RETRIEVE_ACCOUNTS: "retrieve-accounts",
  RETRIEVE_TRANSACTIONS: "retrieve-transactions",
} as const;

export const BASIQ_JOB_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
  IN_PROGRESS: "in-progress",
  PENDING: "pending",
} as const;

export const BASIQ_JOB_POLL_INTERVAL_MS = 2000;
export const BASIQ_JOB_POLL_MAX_ATTEMPTS = 30;
