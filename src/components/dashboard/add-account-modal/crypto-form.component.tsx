"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { ArrowLeft, X, Search, Loader2 } from "lucide-react";
import { isAccountCategory } from "@/lib/utils";
import { formatCurrency } from "@/lib/currencies";
import { searchCoins, getCoinPrice } from "./crypto-form.utils";
import type { CoinSearchResult, CryptoFormProps } from "./add-account-modal.types";

type Phase = "search" | "quantity";

const createdAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  annualGrowthRate: z.number().nullable(),
  coinId: z.string().nullable(),
  coinQuantity: z.union([z.string(), z.number()]).nullable(),
});

const tradeResponseSchema = z.object({
  id: z.string(),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.string(),
  price: z.string(),
  tradedAt: z.string(),
  note: z.string().nullable(),
  coinQuantity: z.string(),
});

const balanceEntrySchema = z.object({
  id: z.string(),
  balance: z.union([z.string(), z.number()]),
  recordedAt: z.string(),
  note: z.string().nullable(),
});

export function CryptoForm({ onBack, onClose, onAdded, currency }: CryptoFormProps) {
  const [phase, setPhase] = useState<Phase>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CoinSearchResult | null>(null);
  const [coinPrice, setCoinPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const coins = await searchCoins(trimmed);
      setResults(coins);
      setSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function handleCoinSelect(coin: CoinSearchResult) {
    setFetchingPrice(true);
    setSelectedCoin(coin);
    setPhase("quantity");
    const price = await getCoinPrice(coin.id, currency);
    setCoinPrice(price);
    setFetchingPrice(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCoin || coinPrice === null) return;

    setError("");
    setLoading(true);

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than 0");
      setLoading(false);
      return;
    }

    const balance = Math.round(qty * coinPrice * 100) / 100;
    const note = `${qty} ${selectedCoin.symbol.toUpperCase()} @ ${formatCurrency(coinPrice, currency)}`;

    const accountRes = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: selectedCoin.name,
        category: "CRYPTO",
        coinId: selectedCoin.id,
        coinSymbol: selectedCoin.symbol.toUpperCase(),
      }),
    });

    let accountData: unknown;
    try {
      accountData = await accountRes.json();
    } catch {
      setError("Server error: invalid response");
      setLoading(false);
      return;
    }

    if (!accountRes.ok) {
      const errSchema = z.object({ error: z.string() });
      const errResult = errSchema.safeParse(accountData);
      setError(errResult.success ? errResult.data.error : "Failed to create account");
      setLoading(false);
      return;
    }

    const accountResult = createdAccountSchema.safeParse(accountData);
    if (!accountResult.success) {
      setError("Unexpected response from server");
      setLoading(false);
      return;
    }

    const {
      id: accountId,
      name,
      category: rawCategory,
      annualGrowthRate,
      coinId,
    } = accountResult.data;
    const coinSymbol = selectedCoin.symbol.toUpperCase();
    if (!isAccountCategory(rawCategory)) {
      setError("Unexpected response from server");
      setLoading(false);
      return;
    }

    const tradeRes = await fetch(`/api/accounts/${accountId}/trades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "BUY",
        quantity: qty,
        price: coinPrice,
        tradedAt: new Date().toISOString(),
        note,
      }),
    });

    let tradeData: unknown;
    try {
      tradeData = await tradeRes.json();
    } catch {
      setError("Account created but failed to record trade");
      setLoading(false);
      return;
    }

    if (!tradeRes.ok) {
      setError("Account created but failed to record trade");
      setLoading(false);
      return;
    }

    const tradeResult = tradeResponseSchema.safeParse(tradeData);
    if (!tradeResult.success) {
      setError("Account created but trade response was invalid");
      setLoading(false);
      return;
    }

    const trade = tradeResult.data;

    const entryRes = await fetch(`/api/accounts/${accountId}/balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance, note }),
    });

    let entryData: unknown;
    try {
      entryData = await entryRes.json();
    } catch {
      setError("Account created but failed to record balance");
      setLoading(false);
      return;
    }

    if (!entryRes.ok) {
      setError("Account created but failed to record balance");
      setLoading(false);
      return;
    }

    const entryResult = balanceEntrySchema.safeParse(entryData);
    if (!entryResult.success) {
      setError("Account created but balance entry was invalid");
      setLoading(false);
      return;
    }

    const entry = entryResult.data;

    onAdded({
      id: accountId,
      name,
      category: rawCategory,
      oracleEnabled: false,
      annualGrowthRate,
      coinId: coinId ?? null,
      coinSymbol,
      coinQuantity: trade.coinQuantity,
      balanceEntries: [
        {
          id: entry.id,
          balance: String(entry.balance),
          recordedAt: entry.recordedAt,
          note: entry.note,
        },
      ],
      splits: [],
      trades: [
        {
          id: trade.id,
          type: trade.type,
          quantity: trade.quantity,
          price: trade.price,
          tradedAt: trade.tradedAt,
          note: trade.note,
        },
      ],
    });
  }

  const qty = parseFloat(quantity);
  const computedValue =
    coinPrice !== null && !isNaN(qty) && qty > 0 ? Math.round(qty * coinPrice * 100) / 100 : null;

  return (
    <div className="bg-surface-raised border-edge w-full max-w-md rounded-2xl border p-6 shadow-xl">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={
              phase === "quantity"
                ? () => {
                    setPhase("search");
                    setSelectedCoin(null);
                    setCoinPrice(null);
                    setQuantity("");
                    setError("");
                  }
                : onBack
            }
            className="text-subtle hover:text-on-surface -ml-1 rounded-md p-1 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-on-surface text-lg font-semibold">
            {phase === "search" ? "Add Crypto" : (selectedCoin?.name ?? "Add Crypto")}
          </h2>
        </div>
        <button onClick={onClose} className="text-subtle hover:text-on-surface transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Phase: search */}
      {phase === "search" && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="text-subtle absolute top-1/2 left-3.5 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="border-edge-strong bg-input-bg text-input-text placeholder-subtle focus:border-accent focus:ring-accent w-full rounded-lg border py-2.5 pr-3.5 pl-9 transition-colors focus:ring-1 focus:outline-none"
              placeholder="Search Bitcoin, Ethereum..."
            />
            {searching && (
              <Loader2
                size={15}
                className="text-subtle absolute top-1/2 right-3.5 -translate-y-1/2 animate-spin"
              />
            )}
          </div>

          {results.length > 0 && (
            <div className="border-edge overflow-hidden rounded-xl border">
              {results.map((coin, i) => (
                <button
                  key={coin.id}
                  onClick={() => handleCoinSelect(coin)}
                  className={`hover:bg-surface flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    i < results.length - 1 ? "border-edge border-b" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coin.thumb}
                    alt={coin.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="text-on-surface text-sm font-medium">{coin.name}</span>
                  <span className="text-subtle ml-auto text-xs">{coin.symbol}</span>
                </button>
              ))}
            </div>
          )}

          {query.trim() && !searching && results.length === 0 && (
            <p className="text-subtle py-4 text-center text-sm">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Phase: quantity */}
      {phase === "quantity" && selectedCoin && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected coin card */}
          <div className="bg-surface border-edge flex items-center gap-3 rounded-xl border px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedCoin.thumb}
              alt={selectedCoin.name}
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="flex-1">
              <p className="text-on-surface text-sm font-medium">{selectedCoin.name}</p>
              <p className="text-subtle text-xs">{selectedCoin.symbol}</p>
            </div>
            <div className="text-right">
              {fetchingPrice ? (
                <Loader2 size={14} className="text-subtle animate-spin" />
              ) : coinPrice !== null ? (
                <p className="text-on-surface text-sm font-semibold">
                  {formatCurrency(coinPrice, currency)}
                </p>
              ) : (
                <p className="text-error text-xs">Price unavailable</p>
              )}
              <p className="text-subtle text-xs">per {selectedCoin.symbol}</p>
            </div>
          </div>

          <div>
            <label className="text-muted mb-1.5 block text-sm font-medium">
              How many {selectedCoin.symbol} do you own?
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min={0}
              step="any"
              autoFocus
              className="border-edge-strong bg-input-bg text-input-text placeholder-subtle focus:border-accent focus:ring-accent w-full rounded-lg border px-3.5 py-2.5 transition-colors focus:ring-1 focus:outline-none"
              placeholder="e.g. 0.5"
            />
          </div>

          {computedValue !== null && coinPrice !== null && (
            <div className="bg-accent-soft border-edge rounded-xl border px-4 py-3">
              <p className="text-muted text-xs">Estimated value</p>
              <p className="text-on-surface text-lg font-bold">
                {formatCurrency(computedValue, currency)}
              </p>
              <p className="text-subtle text-xs">
                {quantity} {selectedCoin.symbol} × {formatCurrency(coinPrice, currency)}
              </p>
            </div>
          )}

          {error && (
            <p className="text-error bg-error-soft border-error-border rounded-lg border px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="border-edge-strong text-muted hover:bg-surface flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || fetchingPrice || coinPrice === null}
              className="bg-accent hover:bg-accent-strong text-on-accent flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Add account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
