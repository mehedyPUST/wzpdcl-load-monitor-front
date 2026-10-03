export function Skeleton({ className = '' }) {
    return (
        <div
            className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
            aria-hidden="true"
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-3 w-16" />
        </div>
    );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-100 px-4 py-3 flex gap-3">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-3 flex-1" />
                ))}
            </div>
            <div className="divide-y divide-slate-100">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="px-4 py-3 flex gap-3">
                        {Array.from({ length: cols }).map((_, c) => (
                            <Skeleton key={c} className="h-4 flex-1" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
