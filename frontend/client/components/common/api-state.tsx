import { AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ApiErrorStateProps {
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ApiErrorState({
  message,
  onRetry,
  isRetrying = false,
}: ApiErrorStateProps) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive font-medium truncate">
          {message}
        </p>
      </div>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors text-xs font-semibold disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
        Thử lại
      </button>
    </div>
  );
}

export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  const gridClass = count === 4 ? "md:grid-cols-4" : "md:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 ${gridClass} gap-4`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 rounded-lg border border-border bg-card/50 space-y-3"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="grid grid-cols-6 gap-3">
          <Skeleton className="h-4 col-span-2" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      ))}
    </div>
  );
}
