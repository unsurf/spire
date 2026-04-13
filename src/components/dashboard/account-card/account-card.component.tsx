"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ACCOUNT_CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/utils";
import MaskedValue from "@/components/ui/masked-value";
import type { AccountCardProps } from "./account-card.types";
import {
  getCurrentAndPrevious,
  getProjectedBalance,
} from "./account-card.utils";

export default function AccountCardComponent({
  account,
  currency,
  oracleOn,
  horizon,
}: AccountCardProps) {
  const { current, previous } = getCurrentAndPrevious(account.balanceEntries);
  const delta = previous !== null ? current - previous : null;
  const deltaSign = delta === null ? 0 : delta > 0 ? 1 : delta < 0 ? -1 : 0;
  const projectedBalance = getProjectedBalance(account, current, horizon, oracleOn);

  return (
    <div className="bg-surface-raised border border-edge rounded-xl p-5 hover:border-edge-strong hover:shadow-sm transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-on-surface group-hover:text-accent transition-colors">
            {account.name}
          </p>
          <span
            className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[account.category]}`}
          >
            {ACCOUNT_CATEGORY_LABELS[account.category]}
          </span>
        </div>

        {deltaSign !== 0 && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              deltaSign > 0 ? "text-positive" : "text-error"
            }`}
          >
            {deltaSign > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {delta !== null && (
              <MaskedValue amount={Math.abs(delta)} currency={currency} />
            )}
          </div>
        )}
        {deltaSign === 0 && delta !== null && (
          <Minus size={13} className="text-subtle" />
        )}
      </div>

      <p className="text-2xl font-bold text-on-surface">
        <MaskedValue amount={current} currency={currency} />
      </p>

      {oracleOn && account.oracleEnabled && projectedBalance !== null && (
        <div className="mt-3 pt-3 border-t border-dashed border-edge">
          <p className="text-xs text-muted font-medium">
            Oracle {horizon} projection
          </p>
          <p className="text-sm font-semibold text-on-surface mt-0.5">
            <MaskedValue amount={projectedBalance} currency={currency} />
          </p>
        </div>
      )}

      {oracleOn && !account.oracleEnabled && (
        <div className="mt-3 pt-3 border-t border-dashed border-edge">
          <p className="text-xs text-subtle">Not included in Oracle</p>
        </div>
      )}
    </div>
  );
}
