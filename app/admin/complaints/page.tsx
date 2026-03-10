// app/admin/complaints/page.tsx
"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Complaint {
  id: string;
  userId?: string;
  providerId?: string;
  customerName?: string;
  washerName?: string;
  subject?: string;
  message?: string;
  status?: string;
  category?: string;
  createdAt: string | null;
  updatedAt: string | null;
}

type Tab = "customer" | "washer";

const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved", "Dismissed"];

const statusColor: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
  Dismissed: "bg-slate-100 text-slate-500",
};

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function ComplaintsPage() {
  const [customerComplaints, setCustomerComplaints] = useState<Complaint[]>([]);
  const [washerComplaints, setWasherComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("customer");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [modalStatus, setModalStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchComplaints() {
    try {
      setLoading(true);
      const res = await fetch("/api/firebase/complaints");
      const json = await res.json();
      if (json.ok) {
        setCustomerComplaints(json.customerComplaints ?? []);
        setWasherComplaints(json.washerComplaints ?? []);
      } else {
        setError("Failed to fetch complaints");
      }
    } catch {
      setError("Error connecting to database");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus() {
    if (!selected || !modalStatus) return;
    setSaving(true);
    try {
      const collection =
        tab === "customer" ? "customer_complaints" : "washer_complaints";
      const res = await fetch("/api/firebase/complaints", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          collection,
          status: modalStatus,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      showToast("✅ Status updated");
      setSelected(null);
      fetchComplaints();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  const complaints = tab === "customer" ? customerComplaints : washerComplaints;

  /* ---------- Metrics ---------- */
  const total = complaints.length;
  const pending = complaints.filter(
    (c) => (c.status ?? "Pending") === "Pending"
  ).length;
  const inProgress = complaints.filter(
    (c) => c.status === "In Progress"
  ).length;
  const resolved = complaints.filter(
    (c) => c.status === "Resolved"
  ).length;

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div
          className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#0ca6e8", borderTopColor: "transparent" }}
        />
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
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Complaints</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View and manage customer &amp; washer complaints
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: "customer" as Tab, label: "Customer Complaints", count: customerComplaints.length },
          { key: "washer" as Tab, label: "Washer Complaints", count: washerComplaints.length },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "px-5 py-2.5 rounded-xl text-sm font-semibold transition border",
              tab === t.key
                ? "bg-[#0ca6e8] text-white border-[#0ca6e8] shadow"
                : "bg-white text-slate-600 border-slate-200 hover:border-[#0ca6e8] hover:text-[#0ca6e8]",
            ].join(" ")}
          >
            {t.label}
            <span
              className={[
                "ml-2 text-xs px-2 py-0.5 rounded-full",
                tab === t.key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total" value={total} color="#0ca6e8" icon="📋" />
        <MetricCard label="Pending" value={pending} color="#d97706" icon="⏳" />
        <MetricCard label="In Progress" value={inProgress} color="#2563eb" icon="🔧" />
        <MetricCard label="Resolved" value={resolved} color="#059669" icon="✅" />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">
            {tab === "customer" ? "Customer" : "Washer"} Complaints
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} complaint{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">
                    {tab === "customer" ? "Customer" : "Washer"}
                  </th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      No complaints found
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelected(c);
                        setModalStatus(c.status ?? "Pending");
                      }}
                      className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {(tab === "customer"
                          ? c.customerName || c.userId
                          : c.washerName || c.providerId) || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {c.subject || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {c.message || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status ?? "Pending"} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {c.createdAt ? formatDate(c.createdAt) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <h2 className="text-xl font-bold text-slate-800">
                  Complaint Details
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <DetailRow
                  label={tab === "customer" ? "Customer" : "Washer"}
                  value={
                    (tab === "customer"
                      ? selected.customerName || selected.userId
                      : selected.washerName || selected.providerId) || "—"
                  }
                />
                <DetailRow label="Subject" value={selected.subject || "—"} />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Message
                  </p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                    {selected.message || "No message provided"}
                  </p>
                </div>
                {selected.category && (
                  <DetailRow label="Category" value={selected.category} />
                )}
                <DetailRow
                  label="Date"
                  value={
                    selected.createdAt
                      ? formatDate(selected.createdAt)
                      : "—"
                  }
                />

                {/* Status update */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Update Status
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setModalStatus(s)}
                        className={[
                          "px-4 py-2 rounded-lg text-sm font-semibold border transition",
                          modalStatus === s
                            ? "bg-[#0ca6e8] text-white border-[#0ca6e8]"
                            : "bg-white text-slate-600 border-slate-200 hover:border-[#0ca6e8]",
                        ].join(" ")}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={updateStatus}
                  disabled={saving || modalStatus === (selected.status ?? "Pending")}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: "#0ca6e8" }}
                >
                  {saving ? "Saving…" : "Update Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper Components                                                 */
/* ------------------------------------------------------------------ */

function MetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
        style={{ backgroundColor: color + "15" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = statusColor[status] ?? "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
