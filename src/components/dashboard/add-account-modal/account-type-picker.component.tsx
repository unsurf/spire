"use client";

import { X } from "lucide-react";
import { ACCOUNT_TYPE_TILES } from "./add-account-modal.constants";
import type { AccountTypePickerProps, ModalStep } from "./add-account-modal.types";

export function AccountTypePicker({ onSelect, onClose }: AccountTypePickerProps) {
  return (
    <div className="bg-surface-raised border-edge w-full max-w-md rounded-2xl border p-6 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-on-surface text-lg font-semibold">What would you like to add?</h2>
        <button onClick={onClose} className="text-subtle hover:text-on-surface transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ACCOUNT_TYPE_TILES.map((tile) => {
          const Icon = tile.icon;
          const available = tile.step !== null;
          return (
            <button
              key={tile.id}
              onClick={() => available && onSelect(tile.step as ModalStep)}
              disabled={!available}
              className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-colors ${
                available
                  ? "border-edge hover:bg-surface hover:border-edge-strong text-on-surface cursor-pointer"
                  : "border-edge text-subtle cursor-not-allowed opacity-40"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium leading-tight">{tile.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
