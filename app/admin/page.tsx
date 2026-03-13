// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";

interface FirestoreData {
  bookings: any[];
  customers: any[];
  password_resets: any[];
  providers: any[];
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
    providers: number;
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
    providers: 0,
    users: 0,
    washers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingWasherId, setDeletingWasherId] = useState<string | null>(null);

  async function deleteCustomer(id: string) {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/firebase/delete-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.ok && data) {
        const updated = data.customers.filter((c: any) => c.id !== id);
        setData({ ...data, customers: updated });
        setCounts((prev) => ({ ...prev, customers: prev.customers - 1 }));
      } else {
        alert("Failed to delete: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting customer");
    } finally {
      setDeletingId(null);
    }
  }

  async function approveWasher(id: string) {
    setApprovingId(id);
    try {
      const res = await fetch("/api/firebase/approve-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.ok && data) {
        const updated = data.providers.map((w: any) =>
          w.id === id ? { ...w, verified: true, active: true, status: "approved" } : w
        );
        setData({ ...data, providers: updated });
      } else {
        alert("Failed to approve: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error approving washer");
    } finally {
      setApprovingId(null);
    }
  }

  async function deleteWasher(id: string) {
    if (!confirm("Are you sure you want to delete this washer?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/firebase/delete-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.ok && data) {
        const updated = data.providers.filter((w: any) => w.id !== id);
        setData({ ...data, providers: updated });
        setCounts((prev) => ({ ...prev, providers: prev.providers - 1 }));
      } else {
        alert("Failed to delete washer: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting washer");
    } finally {
      setDeletingId(null);
    }
  }

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

  // Get pending washers count (from providers collection)
  const pendingWashers = data?.providers?.filter(
    (w) => w.status === "pending" || w.verified !== true
  ).length ?? 0;

  // Get active subscriptions (you may need to adjust based on your data structure)
  const activeSubscriptions = data?.customers?.filter(
    (c) => c.subscription?.status === "active" || c.subscriptionStatus === "active"
  ).length ?? 0;

  // Format customer rows for table
  const customerRows = data?.customers?.map((c) => [
    c.name || c.displayName || "—",
    c.email || "—",
    c.phone || c.phoneNumber || "—",
    c.plan || c.subscription?.plan || "—",
    c.status || "Active",
  ]) || [["—", "—", "—", "—", "—"]];

  // Format washer rows for table (from providers collection)
  const washerRows = data?.providers?.map((w) => [
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
        <MetricCard title="Total Washers" value={counts.providers} hint="All washer accounts" />
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
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.customers?.map((c: any) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">{c.name || c.displayName || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{c.email || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{c.phone || c.phoneNumber || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{c.plan || c.subscription?.plan || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{c.status || "Active"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteCustomer(c.id)}
                        disabled={deletingId === c.id}
                        className="rounded-lg bg-red-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {deletingId === c.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Washers"
          subtitle={`Recent washers (${counts.providers} total)`}
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
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.providers?.map((w: any) => (
                  <tr key={w.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">{w.name || w.displayName || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{w.email || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{w.phone || w.phoneNumber || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{(w.active || w.verified) ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      {w.verified ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium">✓ Verified</span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-xs font-medium">Pending</span>
                          <button
                            onClick={() => approveWasher(w.id)}
                            disabled={approvingId === w.id}
                            className="rounded-lg bg-green-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {approvingId === w.id ? "..." : "Approve"}
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteWasher(w.id)}
                        disabled={deletingId === w.id}
                        className="rounded-lg bg-red-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {deletingId === w.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
