import {
  BASIQ_BASE_URL,
  BASIQ_CONSENT_URL,
  BASIQ_JOB_POLL_INTERVAL_MS,
  BASIQ_JOB_POLL_MAX_ATTEMPTS,
  BASIQ_JOB_STATUS,
  BASIQ_JOB_STEPS,
  BASIQ_VERSION,
} from "./basiq.constants";
import {
  basiqAccountsResponseSchema,
  basiqConnectionsResponseSchema,
  basiqJobSchema,
  basiqTokenResponseSchema,
  basiqUserResponseSchema,
  type BasiqAccount,
  type BasiqConnection,
  type BasiqJob,
} from "./basiq.types";

function getApiKey(): string {
  const key = process.env.BASIQ_API_KEY;
  if (!key) throw new Error("BASIQ_API_KEY environment variable is not set");
  return key;
}

async function fetchToken(params: URLSearchParams): Promise<string> {
  const apiKey = getApiKey();
  const res = await fetch(`${BASIQ_BASE_URL}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "basiq-version": BASIQ_VERSION,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Basiq token error ${res.status}: ${text}`);
  }

  const data = basiqTokenResponseSchema.parse(await res.json());
  return data.access_token;
}

export async function getServerToken(): Promise<string> {
  const params = new URLSearchParams({ scope: "SERVER_ACCESS" });
  return fetchToken(params);
}

export async function getClientToken(basiqUserId: string): Promise<string> {
  const params = new URLSearchParams({ scope: "CLIENT_ACCESS", userId: basiqUserId });
  return fetchToken(params);
}

export async function createBasiqUser(email: string): Promise<string> {
  const token = await getServerToken();
  const res = await fetch(`${BASIQ_BASE_URL}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "basiq-version": BASIQ_VERSION,
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Basiq create user error ${res.status}: ${text}`);
  }

  const data = basiqUserResponseSchema.parse(await res.json());
  return data.id;
}

export function buildConsentUrl(clientToken: string, callbackUrl: string): string {
  const params = new URLSearchParams({ token: clientToken, redirect: callbackUrl });
  return `${BASIQ_CONSENT_URL}?${params.toString()}`;
}

export async function getJob(jobId: string): Promise<BasiqJob> {
  const token = await getServerToken();
  const res = await fetch(`${BASIQ_BASE_URL}/jobs/${jobId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "basiq-version": BASIQ_VERSION,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Basiq get job error ${res.status}: ${text}`);
  }

  return basiqJobSchema.parse(await res.json());
}

export async function pollJobUntilComplete(jobId: string): Promise<BasiqJob> {
  for (let attempt = 0; attempt < BASIQ_JOB_POLL_MAX_ATTEMPTS; attempt++) {
    const job = await getJob(jobId);
    const accountsStep = job.steps.find(
      (s) => s.title === BASIQ_JOB_STEPS.RETRIEVE_ACCOUNTS
    );
    const credentialsStep = job.steps.find(
      (s) => s.title === BASIQ_JOB_STEPS.VERIFY_CREDENTIALS
    );

    if (credentialsStep?.status === BASIQ_JOB_STATUS.FAILED) {
      throw new Error("Basiq: credential verification failed");
    }

    if (accountsStep?.status === BASIQ_JOB_STATUS.SUCCESS) {
      return job;
    }

    if (attempt < BASIQ_JOB_POLL_MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, BASIQ_JOB_POLL_INTERVAL_MS));
    }
  }

  throw new Error("Basiq: job did not complete in time");
}

export async function getUserAccounts(basiqUserId: string): Promise<BasiqAccount[]> {
  const token = await getServerToken();
  const res = await fetch(`${BASIQ_BASE_URL}/users/${basiqUserId}/accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "basiq-version": BASIQ_VERSION,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Basiq get accounts error ${res.status}: ${text}`);
  }

  const data = basiqAccountsResponseSchema.parse(await res.json());
  return data.data;
}

export async function getUserConnections(basiqUserId: string): Promise<BasiqConnection[]> {
  const token = await getServerToken();
  const res = await fetch(`${BASIQ_BASE_URL}/users/${basiqUserId}/connections`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "basiq-version": BASIQ_VERSION,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Basiq get connections error ${res.status}: ${text}`);
  }

  const data = basiqConnectionsResponseSchema.parse(await res.json());
  return data.data;
}
