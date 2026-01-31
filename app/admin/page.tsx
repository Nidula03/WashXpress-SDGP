// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";

interface FirestoreData {
  bookings: any[];
  customers: any[];
  password_resets: any[];
  users: any[];
  washers: any[];
}

interface ApiResponse {
  ok: boolean;
  data: FirestoreData;
  counts: {
    bookings: number;
    customers: number;
    password_resets: number;
    users: number;
    washers: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<FirestoreData | null>(null);
  const [counts, setCounts] = useState({
    bookings: 0,
    customers: 0,
    password_resets: 0,
    users: 0,
    washers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/firebase/firestore-check");
        const json: ApiResponse = await res.json();
        
        if (json.ok) {
          setData(json.data);
          setCounts(json.counts);
        } else {
          setError("Failed to fetch data");
        }
      } catch (err) {
        setError("Error connecting to database");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get pending washers count (assuming there's a status or verified field)
  const pendingWashers = data?.washers?.filter(
    (w) => w.status === "pending" || w.verified === false
  ).length ?? 0;

  // Get active subscriptions (you may need to adjust based on your data structure)
  const activeSubscriptions = data?.customers?.filter(
    (c) => c.subscription?.status === "active" || c.subscriptionStatus === "active"
  ).length ?? 0;

  // Format customer rows for table
  const customerRows = data?.customers?.slice(0, 3).map((c) => [
    c.name || c.displayName || "—",
    c.email || "—",
    c.plan || c.subscription?.plan || "—",
    c.status || "Active",
  ]) || [["—", "—", "—", "—"], ["—", "—", "—", "—"], ["—", "—", "—", "—"]];

  // Format washer rows for table
  const washerRows = data?.washers?.slice(0, 3).map((w) => [
    w.name || w.displayName || "—",
    w.phone || w.phoneNumber || "—",
    w.active ? "Yes" : "No",
    w.verified ? "Verified" : "Pending",
  ]) || [["—", "—", "—", "—"], ["—", "—", "—", "—"], ["—", "—", "—", "—"]];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-slate-500">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards (larger) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Customers" value={counts.customers} hint="All registered customers" />
        <MetricCard title="Total Washers" value={counts.washers} hint="All washer accounts" />
        <MetricCard title="Active Subscriptions" value={activeSubscriptions} hint="Currently active plans" />
        <MetricCard title="Pending Washers" value={pendingWashers} hint="Awaiting verification" />
      </div>

      {/* Main content grid (larger panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Customers"
          subtitle={`Recent customers (${counts.customers} total)`}
          actions={
            <div className="flex gap-2">
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                View all
              </button>
              <button className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:bg-black">
                Add
              </button>
            </div>
          }
        >
          <MiniTable
            columns={["Name", "Email", "Plan", "Status"]}
            rows={customerRows}
          />
        </Panel>

        <Panel
          title="Washers"
          subtitle={`Recent washers (${counts.washers} total)`}
          actions={
            <div className="flex gap-2">
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                View all
              </button>
              <button className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:bg-black">
                Add
              </button>
            </div>
          }
        >
          <MiniTable
            columns={["Name", "Phone", "Active", "Verification"]}
            rows={washerRows}
          />
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function MetricCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 min-h-32 flex flex-col justify-center">
      <div className="text-base text-slate-600 font-medium">{title}</div>
      <div className="mt-2 text-4xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-2 text-sm text-slate-400">{hint}</div> : null}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm min-h-72">
      <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
        <div>
          <div className="text-xl font-semibold">{title}</div>
          {subtitle ? <div className="text-base text-slate-500 mt-1">{subtitle}</div> : null}
        </div>
        {actions}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function MiniTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-slate-500">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
