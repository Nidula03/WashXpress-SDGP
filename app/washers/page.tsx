// app/washers/page.tsx
"use client";

import { useEffect, useState } from "react";

interface Washer {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  active?: boolean;
  verified?: boolean;
  status?: string;
  rating?: number;
  completedWashes?: number;
  joinedDate?: string;
  createdAt?: any;
}

export default function WashersPage() {
  const [washers, setWashers] = useState<Washer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "pending">("all");
  const [search, setSearch] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function approveWasher(id: string) {
    setApprovingId(id);
    try {
      const res = await fetch("/api/firebase/approve-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.ok) {
        setWashers((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, verified: true, active: true, status: "approved" } : w
          )
        );
      } else {
        alert("Failed to approve washer: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error approving washer");
    } finally {
      setApprovingId(null);
    }
  }

  useEffect(() => {
    async function fetchWashers() {
      try {
        const res = await fetch("/api/firebase/firestore-check");
        const json = await res.json();

        if (json.ok) {
          setWashers(json.data.providers || []);
        } else {
          setError("Failed to fetch washer data");
        }
      } catch (err) {
        setError("Error connecting to database");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchWashers();
  }, []);

  // Filter washers
  const filteredWashers = washers.filter((w) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && w.active === true) ||
      (filter === "pending" && (w.status === "pending" || w.verified === false));

    const name = w.name || w.displayName || "";
    const phone = w.phone || w.phoneNumber || "";
    const email = w.email || "";
    const matchesSearch =
      search === "" ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      phone.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Stats
  const totalWashers = washers.length;
  const activeWashers = washers.filter((w) => w.active === true).length;
  const pendingWashers = washers.filter(
    (w) => w.status === "pending" || w.verified === false
  ).length;
  const verifiedWashers = washers.filter((w) => w.verified === true).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-lg">Loading washer data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Washers</h1>
            <p className="text-slate-500 mt-1">
              Manage and monitor all registered washers
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard label="Total Washers" value={totalWashers} />
          <StatCard label="Active" value={activeWashers} color="green" />
          <StatCard label="Verified" value={verifiedWashers} color="blue" />
          <StatCard label="Pending" value={pendingWashers} color="amber" />
        </div>

        {/* Filter & Search bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            {(["all", "active", "pending"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  "rounded-full px-4 py-2 text-sm border transition capitalize",
                  filter === f
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                ].join(" ")}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Verification</th>
                  <th className="px-6 py-4 font-medium">Rating</th>
                  <th className="px-6 py-4 font-medium">Washes</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWashers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No washers found
                    </td>
                  </tr>
                ) : (
                  filteredWashers.map((w) => (
                    <tr
                      key={w.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50 transition"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {w.name || w.displayName || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {w.email || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {w.phone || w.phoneNumber || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge active={w.active ?? false} />
                      </td>
                      <td className="px-6 py-4">
                        <VerificationBadge verified={w.verified ?? false} />
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {w.rating != null ? `${w.rating.toFixed(1)} ★` : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {w.completedWashes ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        {!w.verified ? (
                          <button
                            onClick={() => approveWasher(w.id)}
                            disabled={approvingId === w.id}
                            className="rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {approvingId === w.id ? "Approving..." : "✓ Approve"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer count */}
        <div className="mt-4 text-sm text-slate-400">
          Showing {filteredWashers.length} of {totalWashers} washers
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "green" | "blue" | "amber";
}) {
  const accent = {
    green: "text-green-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col justify-center">
      <div className="text-sm text-slate-500 font-medium">{label}</div>
      <div
        className={`mt-1 text-3xl font-semibold tracking-tight ${color ? accent[color] : ""
          }`}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        active
          ? "bg-green-50 text-green-700"
          : "bg-slate-100 text-slate-600",
      ].join(" ")}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-500" : "bg-slate-400"
          }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        verified
          ? "bg-blue-50 text-blue-700"
          : "bg-amber-50 text-amber-700",
      ].join(" ")}
    >
      {verified ? "✓ Verified" : "Pending"}
    </span>
  );
}
