"use client";

import { CheckCircle, XCircle } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  onApproveAll: () => void;
  onDeclineAll: () => void;
  isLoading?: boolean;
}

export function BulkActions({
  selectedCount,
  onApproveAll,
  onDeclineAll,
  isLoading,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-2">
      <span className="text-sm font-medium text-blue-700">
        {selectedCount} suggestion(s) pending
      </span>
      <div className="flex gap-2">
        <button
          onClick={onApproveAll}
          disabled={isLoading}
          className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Approve All
        </button>
        <button
          onClick={onDeclineAll}
          disabled={isLoading}
          className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          Decline All
        </button>
      </div>
    </div>
  );
}
