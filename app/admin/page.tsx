// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";

interface FirestoreData {
  bookings: any[];
  customers: any[];
  password_resets: any[];
  providers: any[];
  subscriptions: any[];
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
    subscriptions: number;
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

  // Edit State
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [editingWasher, setEditingWasher] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

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

  async function updateCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCustomer) return;
    setSavingEdit(true);

    try {
      const res = await fetch("/api/firebase/update-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCustomer),
      });
      const json = await res.json();
      if (json.ok && data) {
        const updated = data.customers.map((c: any) =>
          c.id === editingCustomer.id ? { ...c, ...editingCustomer } : c
        );
        setData({ ...data, customers: updated });
        setEditingCustomer(null);
      } else {
        alert("Failed to update: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error updating customer");
    } finally {
      setSavingEdit(false);
    }
  }

  async function updateWasher(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingWasher) return;
    setSavingEdit(true);

    try {
      const res = await fetch("/api/firebase/update-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingWasher),
      });
      const json = await res.json();
      if (json.ok && data) {
        const updated = data.providers.map((w: any) =>
          w.id === editingWasher.id ? { ...w, ...editingWasher } : w
        );
        setData({ ...data, providers: updated });
        setEditingWasher(null);
      } else {
        alert("Failed to update: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error updating washer");
    } finally {
      setSavingEdit(false);
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

  // Build a lookup map: customerId → subscription document
  // Subscriptions stored in the `subscriptions` collection with a `customerId` field
  // matching the customer's UID (document ID in the `customers` collection).
  const subscriptionMap: Record<string, any> = {};
  (data?.subscriptions || []).forEach((sub: any) => {
    const key = sub.customerId || sub.userId || sub.uid;
    if (key) subscriptionMap[key] = sub;
  });

  // Active subscriptions: count from subscriptions collection where status === "active"
  const activeSubscriptions = (data?.subscriptions || []).filter(
    (s: any) => s.status === "active" || s.isActive === true
  ).length;

  const validCustomersCount = data?.customers?.filter((c: any) => !!subscriptionMap[c.id]).length ?? 0;

  // Format customer rows for table (kept for MiniTable compatibility, not used in inline render)
  const customerRows = data?.customers?.map((c: any) => {
    const sub = subscriptionMap[c.id];
    return [
      c.displayName || c.name || "—",
      c.email || "—",
      c.phoneNumber || c.phone || "—",
      sub?.planName || sub?.planId || sub?.plan || c.plan || c.subscription?.plan || "—",
      c.status || "Active",
    ];
  }) || [["—", "—", "—", "—", "—"]];

  // Format washer rows for table (from providers collection)
  const washerRows = data?.providers?.map((w) => [
    w.displayName || w.name || "—",
    w.phoneNumber || w.phone || "—",
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
        <MetricCard title="Total Customers" value={validCustomersCount} hint="With subscriptions" />
        <MetricCard title="Total Washers" value={counts.providers} hint="All washer accounts" />
        <MetricCard title="Active Subscriptions" value={activeSubscriptions} hint="Currently active plans" />
        <MetricCard title="Pending Washers" value={pendingWashers} hint="Awaiting verification" />
      </div>

      {/* Main content grid (larger panels) */}
      <div className="grid grid-cols-1 gap-6">
        <Panel
          title="Customers"
          subtitle={`Recent customers (${validCustomersCount} total)`}
        >
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(181,154,93,0.2)" }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "#F0F4F8" }}>
                <tr className="text-left" style={{ color: "#64748B" }}>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.customers
                  ?.slice()
                  .sort((a: any, b: any) => {
                    const dateA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt || 0).getTime();
                    const dateB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                  })
                  .filter((c: any) => !!subscriptionMap[c.id])
                  .map((c: any) => {
                    // Match subscription by customer UID (doc id)
                    const sub = subscriptionMap[c.id];
                    const planLabel = sub?.planName || sub?.planId || sub?.plan ||
                      c.plan || c.subscription?.plan || null;
                    const subStatus = sub?.status ?? null;
                    return (
                  <tr key={c.id} style={{ borderTop: "1px solid #F0F4F8" }}>
                    <td className="px-4 py-3" style={{ color: "#1E293B" }}>{c.displayName || c.name || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "#1E293B" }}>{c.email || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "#1E293B" }}>{c.phoneNumber || c.phone || "—"}</td>
                    <td className="px-4 py-3">
                      {planLabel ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-800 font-medium text-sm">{planLabel}</span>
                          {subStatus && subStatus !== "active" && subStatus !== "pending" && (
                            <span className={[
                              "inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium",
                              subStatus === "cancelled" ? "bg-red-50 text-red-600" :
                              subStatus === "paused"    ? "bg-amber-50 text-amber-700" :
                              subStatus === "expired"   ? "bg-slate-100 text-slate-500" :
                              "bg-slate-100 text-slate-600",
                            ].join(" ")}>
                              {subStatus}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">No plan</span>
                      )}
                    </td>
                     <td className="px-4 py-3">
                       <span className={[
                         "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                         (planLabel || c.isActive === true) ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500",
                       ].join(" ")}>
                         {(planLabel || c.isActive === true) ? "Active" : "Inactive"}
                       </span>
                     </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingCustomer(c)}
                          className="rounded-lg bg-blue-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCustomer(c.id)}
                          disabled={deletingId === c.id}
                          className="rounded-lg bg-red-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {deletingId === c.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                  })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Washers"
          subtitle={`Recent washers (${counts.providers} total)`}
        >
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(181,154,93,0.2)" }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "#F0F4F8" }}>
                <tr className="text-left" style={{ color: "#64748B" }}>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.providers
                  ?.slice()
                  .sort((a: any, b: any) => {
                    const dateA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt || 0).getTime();
                    const dateB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                  })
                  .map((w: any) => (
                  <tr key={w.id} style={{ borderTop: "1px solid #F0F4F8" }}>
                    <td className="px-4 py-3" style={{ color: "#1E293B" }}>{w.displayName || w.name || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "#1E293B" }}>{w.email || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "#1E293B" }}>{w.phoneNumber || w.phone || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "#1E293B" }}>{(w.active || w.verified) ? "Yes" : "No"}</td>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingWasher(w)}
                          className="rounded-lg bg-blue-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteWasher(w.id)}
                          disabled={deletingId === w.id}
                          className="rounded-lg bg-red-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {deletingId === w.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* --- Edit Customer Modal --- */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Edit Customer</h2>
            <form onSubmit={updateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingCustomer.displayName || editingCustomer.name || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, displayName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingCustomer.email || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingCustomer.phoneNumber || editingCustomer.phone || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phoneNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                <input
                  type="text"
                  value={editingCustomer.plan || editingCustomer.subscription?.plan || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, plan: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editingCustomer.status || "Active"}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Edit Washer Modal --- */}
      {editingWasher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Edit Washer</h2>
            <form onSubmit={updateWasher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingWasher.displayName || editingWasher.name || ""}
                  onChange={(e) => setEditingWasher({ ...editingWasher, displayName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingWasher.email || ""}
                  onChange={(e) => setEditingWasher({ ...editingWasher, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingWasher.phoneNumber || editingWasher.phone || ""}
                  onChange={(e) => setEditingWasher({ ...editingWasher, phoneNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-medium text-slate-700">Active Status</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingWasher.active || false}
                      onChange={(e) => setEditingWasher({ ...editingWasher, active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
              </div>
              <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-medium text-slate-700">Verified</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingWasher.verified || false}
                      onChange={(e) => setEditingWasher({ ...editingWasher, verified: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingWasher(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    <div className="rounded-2xl bg-white shadow-sm p-6 min-h-32 flex flex-col justify-center" style={{ border: "1px solid rgba(181,154,93,0.3)", borderLeft: "4px solid #B59A5D" }}>
      <div className="text-sm font-medium" style={{ color: "#64748B" }}>{title}</div>
      <div className="mt-2 text-4xl font-semibold tracking-tight" style={{ color: "#0F172A" }}>{value}</div>
      {hint ? <div className="mt-2 text-xs" style={{ color: "#64748B" }}>{hint}</div> : null}
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
    <div className="rounded-2xl bg-white shadow-sm min-h-72" style={{ border: "1px solid rgba(181,154,93,0.3)" }}>
      <div className="flex items-start justify-between gap-4 p-6" style={{ borderBottom: "1px solid rgba(181,154,93,0.2)" }}>
        <div>
          <div className="text-xl font-semibold" style={{ color: "#0F172A" }}>{title}</div>
          {subtitle ? <div className="text-sm mt-1" style={{ color: "#64748B" }}>{subtitle}</div> : null}
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
    <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(181,154,93,0.2)" }}>
      <table className="w-full text-sm">
        <thead style={{ backgroundColor: "#F0F4F8" }}>
          <tr className="text-left" style={{ color: "#64748B" }}>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: "1px solid #F0F4F8" }}>
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3" style={{ color: "#1E293B" }}>
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
