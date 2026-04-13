"use client";

import { useState } from "react";
import { CURRENCIES } from "@/lib/currencies";
import { COUNTRIES } from "@/lib/countries";
import type {
  SettingsClientProps,
  SettingsMessage,
} from "./settings-client.types";

export default function SettingsClientComponent({ user }: SettingsClientProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [country, setCountry] = useState(user.country ?? "");
  const [currency, setCurrency] = useState(user.currency ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<SettingsMessage | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const body: Record<string, unknown> = {
      name,
      email,
      country,
      currency,
    };

    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage({
        type: "error",
        text: data.error || "Failed to save settings",
      });
      return;
    }

    setMessage({ type: "success", text: "Settings saved successfully" });
    setCurrentPassword("");
    setNewPassword("");
  }

  const inputClassName =
    "w-full border border-edge-strong rounded-lg px-3.5 py-2.5 bg-input-bg text-input-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-sm";

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Settings</h1>
        <p className="text-muted mt-0.5">Manage your profile and preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-surface-raised border border-edge rounded-xl p-6">
          <h2 className="text-sm font-semibold text-muted mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-raised border border-edge rounded-xl p-6">
          <h2 className="text-sm font-semibold text-muted mb-1">
            Region & Currency
          </h2>
          <p className="text-xs text-subtle mb-4">
            Changing currency affects how balances are displayed - existing values
            are not converted
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  const selectedCountry = COUNTRIES.find(
                    (countryItem) => countryItem.code === e.target.value
                  );
                  if (selectedCountry) setCurrency(selectedCountry.currency);
                }}
                className={inputClassName}
              >
                <option value="">Select country</option>
                {COUNTRIES.map((countryItem) => (
                  <option key={countryItem.code} value={countryItem.code}>
                    {countryItem.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputClassName}
              >
                <option value="">Select currency</option>
                {CURRENCIES.map((currencyItem) => (
                  <option key={currencyItem.code} value={currencyItem.code}>
                    {currencyItem.code} - {currencyItem.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-surface-raised border border-edge rounded-xl p-6">
          <h2 className="text-sm font-semibold text-muted mb-4">
            Change Password
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className={inputClassName}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                className={inputClassName}
                placeholder="At least 8 characters"
              />
            </div>
          </div>
        </div>

        {message && (
          <p
            className={`text-sm px-4 py-3 rounded-lg border ${
              message.type === "success"
                ? "bg-accent-soft border-accent text-accent"
                : "bg-error-soft border-error-border text-error"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-accent hover:bg-accent-strong disabled:opacity-50 text-on-accent rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
