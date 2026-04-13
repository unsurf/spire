"use client";

import { DAY_OF_WEEK_LABELS } from "@/lib/payday";
import { MONTHS, DAY_OF_MONTH } from "@/lib/constants/dates.constants";
import type { PayDayPickerProps } from "./pay-day-picker.types";

const inputClassName =
  "border border-edge-strong rounded-lg px-3 py-2 text-sm bg-input-bg text-input-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors";

export function PayDayPicker({
  cycle,
  payDay,
  payDay2,
  onPayDayChange,
  onPayDay2Change,
}: PayDayPickerProps) {
  if (cycle === "WEEKLY" || cycle === "FORTNIGHTLY") {
    return (
      <div>
        <label className="block text-xs font-medium text-muted mb-1">
          Paid on
        </label>
        <select
          value={payDay}
          onChange={(e) => onPayDayChange(e.target.value)}
          className={`w-full ${inputClassName}`}
        >
          <option value="">Select day</option>
          {DAY_OF_WEEK_LABELS.map((d) => (
            <option key={d} value={DAY_OF_WEEK_LABELS.indexOf(d)}>
              {d}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (cycle === "TWICE_MONTHLY") {
    return (
      <div>
        <label className="block text-xs font-medium text-muted mb-1">
          Paid on
        </label>
        <div className="flex items-center gap-2">
          <select
            value={payDay}
            onChange={(e) => onPayDayChange(e.target.value)}
            className={`flex-1 ${inputClassName}`}
          >
            <option value="">Day 1</option>
            {DAY_OF_MONTH.map((d) => (
              <option key={d} value={d}>
                {ordinal(d)} of month
              </option>
            ))}
          </select>
          <span className="text-sm text-muted">&amp;</span>
          <select
            value={payDay2}
            onChange={(e) => onPayDay2Change(e.target.value)}
            className={`flex-1 ${inputClassName}`}
          >
            <option value="">Day 2</option>
            {DAY_OF_MONTH.map((d) => (
              <option key={d} value={d}>
                {ordinal(d)} of month
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (cycle === "MONTHLY" || cycle === "QUARTERLY") {
    return (
      <div>
        <label className="block text-xs font-medium text-muted mb-1">
          Paid on the
        </label>
        <select
          value={payDay}
          onChange={(e) => onPayDayChange(e.target.value)}
          className={`w-full ${inputClassName}`}
        >
          <option value="">Select day</option>
          {DAY_OF_MONTH.map((d) => (
            <option key={d} value={d}>
              {ordinal(d)} of{" "}
              {cycle === "QUARTERLY" ? "the quarter" : "each month"}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (cycle === "ANNUALLY") {
    return (
      <div>
        <label className="block text-xs font-medium text-muted mb-1">
          Paid on
        </label>
        <div className="flex gap-2">
          <select
            value={payDay2}
            onChange={(e) => onPayDay2Change(e.target.value)}
            className={`flex-1 ${inputClassName}`}
          >
            <option value="">Month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={payDay}
            onChange={(e) => onPayDayChange(e.target.value)}
            className={`w-28 ${inputClassName}`}
          >
            <option value="">Day</option>
            {DAY_OF_MONTH.map((d) => (
              <option key={d} value={d}>
                {ordinal(d)}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return null;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
