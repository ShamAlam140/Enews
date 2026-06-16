'use client';

import { useEffect, useMemo, useState } from "react";
import { http } from "@/lib/services/http";

type TypeCounts = Record<"image" | "video" | "audio" | "pdf" | "other", number>;

type TopCity = {
  city: string;
  count: number;
};

type AdminInfo = {
  total: number;
  active: number;
  me: {
    id: string | null;
    lastLogin: string | null;
  };
};

type OverviewResponse = {
  totalFiles: number;
  filesToday: number;
  filesThisWeek: number;
  totalStorageBytes: number;
  lastUploadAt: string | null;
  typeCounts: TypeCounts;
  topCities: TopCity[];
  admins: AdminInfo;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await http.get<OverviewResponse>('/stats/overview');
        if (!mounted) return;
        setStats(res.data);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.response?.data?.error || "Failed to load dashboard stats");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  const storageText = useMemo(
    () => formatBytes(stats?.totalStorageBytes ?? 0),
    [stats?.totalStorageBytes]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-gray-900">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/60 backdrop-blur pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Quick overview of uploads and activity
            </p>
          </div>

          {/* Last login */}
          {stats?.admins?.me?.id && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <ClockIcon className="h-4 w-4" />
              Last login: {formatDateTime(stats.admins.me.lastLogin)}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4">
            {error}
          </div>
        )}

        {/* Top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Total Files"
            value={loading ? <SkeletonLine /> : stats?.totalFiles ?? 0}
            gradient="from-indigo-500 to-violet-500"
            icon={<StackIcon className="h-5 w-5" />}
          />
          <StatCard
            title="Today's Uploads"
            value={loading ? <SkeletonLine /> : stats?.filesToday ?? 0}
            gradient="from-emerald-500 to-teal-500"
            icon={<UploadIcon className="h-5 w-5" />}
          />
          <StatCard
            title="This Week Uploads"
            value={loading ? <SkeletonLine /> : stats?.filesThisWeek ?? 0}
            gradient="from-sky-500 to-cyan-500"
            icon={<CalendarIcon className="h-5 w-5" />}
          />
          <StatCard
            title="Storage Used"
            value={loading ? <SkeletonLine /> : storageText}
            gradient="from-amber-500 to-orange-500"
            icon={<DatabaseIcon className="h-5 w-5" />}
          />
        </div>

        {/* Middle grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Type Breakdown */}
          <SectionCard title="File Type Breakdown" className="lg:col-span-2">
            <div className="flex flex-wrap gap-3">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <BadgeSkeleton key={i} />
                  ))
                : (Object.entries(stats?.typeCounts ?? {
                    image: 0,
                    video: 0,
                    audio: 0,
                    pdf: 0,
                    other: 0,
                  }) as Array<[keyof TypeCounts, number]>).map(
                    ([type, count]) => (
                      <Badge key={type} label={String(type).toUpperCase()} value={count} />
                    )
                  )}
            </div>
          </SectionCard>

          {/* Admin quick info */}
          <SectionCard title="Admin Summary">
            <div className="grid grid-cols-2 gap-4">
              <MiniStat
                label="Admins (Total)"
                value={loading ? <SkeletonLine sm /> : stats?.admins?.total ?? 0}
              />
              <MiniStat
                label="Admins (Active)"
                value={loading ? <SkeletonLine sm /> : stats?.admins?.active ?? 0}
              />
              <MiniStat
                label="Last Upload"
                value={
                  loading ? (
                    <SkeletonLine sm />
                  ) : (
                    formatDateTime(stats?.lastUploadAt) || "—"
                  )
                }
              />
              <MiniStat
                label="You"
                value={
                  loading ? (
                    <SkeletonLine sm />
                  ) : stats?.admins?.me?.id ? (
                    "Signed in"
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </SectionCard>
        </div>

        {/* Top Cities */}
        <SectionCard title="Top Cities">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : stats?.topCities?.length ? (
            <ul className="divide-y divide-slate-200">
              {stats.topCities.map((c) => (
                <li
                  key={c.city}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
                      {c.city.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-medium text-slate-800">
                      {c.city.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-slate-600">{c.count} files</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-slate-500 text-sm">No city data</div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/* ---------- UI Pieces ---------- */
function StatCard({
  title,
  value,
  gradient,
  icon,
}: {
  title: string;
  value: number | string | React.ReactNode;
  gradient: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl`}
      />
      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <div className="text-slate-600 text-sm">{title}</div>
          <div className="text-slate-500">{icon}</div>
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Badge({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-slate-900 shadow-sm">
        {value}
      </span>
    </span>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number | string | React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

/* ---------- Skeletons ---------- */
function SkeletonLine({ sm = false }: { sm?: boolean }) {
  return (
    <span
      className={`block animate-pulse rounded ${sm ? "h-4 w-24" : "h-7 w-28"} bg-slate-200`}
    />
  );
}

function BadgeSkeleton() {
  return <span className="h-8 w-28 animate-pulse rounded-full bg-slate-200" />;
}

function RowSkeleton() {
  return <div className="h-10 w-full animate-pulse rounded bg-slate-200" />;
}

/* ---------- Inline Icons (no dependency) ---------- */
function StackIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="1.5" d="M12 3l8.5 4.5L12 12 3.5 7.5 12 3Z" />
      <path strokeWidth="1.5" d="M3.5 12L12 16.5 20.5 12" />
      <path strokeWidth="1.5" d="M3.5 16.5L12 21l8.5-4.5" />
    </svg>
  );
}
function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="1.5" d="M12 16V4" />
      <path strokeWidth="1.5" d="M8 8l4-4 4 4" />
      <path strokeWidth="1.5" d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5" />
      <path strokeWidth="1.5" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <ellipse cx="12" cy="5" rx="8" ry="3" strokeWidth="1.5" />
      <path strokeWidth="1.5" d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path strokeWidth="1.5" d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  );
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
      <path strokeWidth="1.5" d="M12 7v5l3 3" />
    </svg>
  );
}

/* ---------- Utils ---------- */
function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const num = bytes / Math.pow(1024, i);
  const fixed =
    num >= 100 ? num.toFixed(0) : num >= 10 ? num.toFixed(1) : num.toFixed(2);
  return `${fixed} ${units[i]}`;
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}
