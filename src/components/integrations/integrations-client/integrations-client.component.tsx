"use client";

import { useState, useCallback } from "react";
import { Plug, RefreshCw, Trash2, Link, Unlink } from "lucide-react";
import type {
  BankAccountLinkData,
  BankConnectionData,
  IntegrationsClientProps,
  SpireAccountOption,
} from "./integrations-client.types";

const inputClass =
  "w-full border border-edge-strong rounded-lg px-3 py-2 bg-input-bg text-input-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-sm";

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}

function AccountLinkRow({
  link,
  spireAccounts,
  onLinkChange,
}: {
  link: BankAccountLinkData;
  spireAccounts: SpireAccountOption[];
  onLinkChange: (linkId: string, spireAccountId: string | null) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(link.spireAccountId ?? "");

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setSelectedId(value);
    setSaving(true);
    await onLinkChange(link.id, value || null);
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b border-edge last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-on-surface text-sm font-medium truncate">{link.basiqAccountName}</p>
        <p className="text-subtle text-xs mt-0.5">Last synced: {formatDate(link.lastSyncedAt)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {saving ? (
          <RefreshCw size={14} className="text-muted animate-spin" />
        ) : selectedId ? (
          <Link size={14} className="text-positive" />
        ) : (
          <Unlink size={14} className="text-subtle" />
        )}
        <select
          value={selectedId}
          onChange={handleChange}
          disabled={saving}
          className="border border-edge-strong rounded-lg px-3 py-1.5 bg-input-bg text-input-text focus:outline-none focus:border-accent text-sm disabled:opacity-50 min-w-[180px]"
        >
          <option value="">— unlinked —</option>
          {spireAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ConnectionCard({
  connection,
  spireAccounts,
  onDelete,
  onLinkChange,
}: {
  connection: BankConnectionData;
  spireAccounts: SpireAccountOption[];
  onDelete: (id: string) => Promise<void>;
  onLinkChange: (linkId: string, spireAccountId: string | null) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Disconnect this bank? All account links will be removed.")) return;
    setDeleting(true);
    await onDelete(connection.id);
  }

  return (
    <div className="bg-surface-raised border border-edge rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-on-surface font-semibold text-sm">
            {connection.institution ?? "Bank"}
          </h3>
          <p className="text-subtle text-xs mt-0.5 capitalize">{connection.status}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-error hover:text-error-strong disabled:opacity-50 transition-colors p-1"
          title="Disconnect"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {connection.accountLinks.length === 0 ? (
        <p className="text-subtle text-xs">No accounts found for this connection.</p>
      ) : (
        <div>
          <p className="text-muted text-xs uppercase tracking-wide mb-2">
            Link to Spire accounts
          </p>
          {connection.accountLinks.map((link) => (
            <AccountLinkRow
              key={link.id}
              link={link}
              spireAccounts={spireAccounts}
              onLinkChange={onLinkChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function IntegrationsClient({
  connections: initialConnections,
  spireAccounts,
  initialError,
  initialConnected,
}: IntegrationsClientProps) {
  const [connections, setConnections] = useState(initialConnections);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [syncResult, setSyncResult] = useState<string | null>(
    initialConnected ? "Bank connected successfully. Link your accounts below." : null
  );

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/basiq/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start connection");
        return;
      }
      window.location.href = data.consentUrl;
    } catch {
      setError("Failed to start connection");
    } finally {
      setConnecting(false);
    }
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await fetch("/api/integrations/basiq/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sync failed");
        return;
      }
      setSyncResult(`Synced ${data.synced} account${data.synced === 1 ? "" : "s"} successfully.`);
    } catch {
      setError("Sync failed");
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch("/api/integrations/basiq/connections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setConnections((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  const handleLinkChange = useCallback(
    async (linkId: string, spireAccountId: string | null) => {
      await fetch("/api/integrations/basiq/link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankAccountLinkId: linkId, spireAccountId }),
      });

      setConnections((prev) =>
        prev.map((c) => ({
          ...c,
          accountLinks: c.accountLinks.map((l) =>
            l.id === linkId
              ? {
                  ...l,
                  spireAccountId,
                  spireAccount: spireAccounts.find((a) => a.id === spireAccountId) ?? null,
                }
              : l
          ),
        }))
      );
    },
    [spireAccounts]
  );

  const linkedCount = connections.flatMap((c) => c.accountLinks).filter((l) => l.spireAccountId).length;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Integrations</h1>
        <p className="text-muted mt-0.5">Connect your bank accounts to sync balances automatically</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg border bg-error-soft border-error-border text-error text-sm">
          {error}
        </div>
      )}

      {syncResult && (
        <div className="mb-6 px-4 py-3 rounded-lg border bg-accent-soft border-accent text-accent text-sm">
          {syncResult}
        </div>
      )}

      <div className="bg-surface-raised border border-edge rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-on-surface">Basiq</h2>
            <p className="text-subtle text-xs mt-0.5">
              Australian open banking — connect Westpac, CBA, ANZ, NAB and more
            </p>
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="bg-accent hover:bg-accent-strong disabled:opacity-50 text-on-accent rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plug size={14} />
            {connecting ? "Redirecting…" : "Connect bank"}
          </button>
        </div>
      </div>

      {connections.length > 0 && (
        <div className="space-y-4 mb-6">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              spireAccounts={spireAccounts}
              onDelete={handleDelete}
              onLinkChange={handleLinkChange}
            />
          ))}
        </div>
      )}

      {connections.length === 0 && (
        <div className="bg-surface-raised border border-edge rounded-xl p-8 text-center">
          <Plug size={24} className="text-subtle mx-auto mb-3" />
          <p className="text-muted text-sm">No banks connected yet</p>
          <p className="text-subtle text-xs mt-1">Click "Connect bank" to get started</p>
        </div>
      )}

      {linkedCount > 0 && (
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-surface-raised hover:bg-edge border border-edge rounded-lg px-4 py-2.5 text-sm text-on-surface font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing…" : `Sync all (${linkedCount} account${linkedCount === 1 ? "" : "s"})`}
        </button>
      )}
    </div>
  );
}
