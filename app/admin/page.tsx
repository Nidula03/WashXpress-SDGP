"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Provider {
  id: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  washerStatus?: string;
  certificationStatus?: string;
  certificationPath?: "field_certification" | "training_center" | null;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  professionalExperience?: {
    hasExperience: boolean;
    currentWorkplace?: string;
    yearsOfExperience?: number;
  };
  fieldCertification?: {
    requiredEvaluations: number;
    completedEvaluations: number;
    status: string;
    assignedMentors: string[];
  };
  trainingCenter?: {
    centerId: string | null;
    centerName: string | null;
    status: string;
    expectedCompletionDate: string | null;
  };
  certificationReview?: {
    reviewedBy: string | null;
    reviewedAt: string | null;
    status: string;
    adminNotes: string | null;
  };
}

type TabType = "pending" | "field" | "training" | "certified" | "all";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CertificationPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Provider | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [assignInput, setAssignInput] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    setLoading(true);
    try {
      const res = await fetch("/api/firebase/firestore-check");
      const json = await res.json();
      if (json.ok) {
        setProviders(json.data.providers || []);
      } else {
        setError("Failed to fetch providers");
      }
    } catch {
      setError("Error connecting to database");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/firebase/approve-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminNotes }),
      });
      const json = await res.json();
      if (json.ok) {
        showSuccess("Washer approved and certified ✓");
        setProviders((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  certificationStatus: "certified",
                  washerStatus: "available",
                  isActive: true,
                  isVerified: true,
                }
              : p
          )
        );
        setSelected(null);
      } else {
        alert("Failed: " + (json.error || "Unknown error"));
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/firebase/reject-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminNotes }),
      });
      const json = await res.json();
      if (json.ok) {
        showSuccess("Application rejected");
        setProviders((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, certificationStatus: "rejected" } : p
          )
        );
        setSelected(null);
      } else {
        alert("Failed: " + (json.error || "Unknown error"));
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssignTrainingCenter(id: string) {
    if (!assignInput.trim()) return alert("Enter a training center name");
    setActionLoading(true);
    try {
      const res = await fetch("/api/firebase/assign-training-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, centerName: assignInput.trim(), adminNotes }),
      });
      const json = await res.json();
      if (json.ok) {
        showSuccess("Training center assigned ✓");
        setProviders((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  certificationStatus: "in_training",
                  trainingCenter: {
                    ...p.trainingCenter!,
                    centerName: assignInput.trim(),
                    status: "assigned",
                  },
                }
              : p
          )
        );
        setSelected(null);
        setAssignInput("");
      } else {
        alert("Failed: " + (json.error || "Unknown error"));
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssignMentor(id: string) {
    if (!assignInput.trim()) return alert("Enter a mentor UID or name");
    setActionLoading(true);
    try {
      const res = await fetch("/api/firebase/assign-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, mentorId: assignInput.trim(), adminNotes }),
      });
      const json = await res.json();
      if (json.ok) {
        showSuccess("Mentor assigned ✓");
        setProviders((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  certificationStatus: "in_training",
                  fieldCertification: {
                    ...p.fieldCertification!,
                    assignedMentors: [
                      ...(p.fieldCertification?.assignedMentors || []),
                      assignInput.trim(),
                    ],
                    status: "mentor_assigned",
                  },
                }
              : p
          )
        );
        setSelected(null);
        setAssignInput("");
      } else {
        alert("Failed: " + (json.error || "Unknown error"));
      }
    } finally {
      setActionLoading(false);
    }
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  // ─── Filtering ──────────────────────────────────────────────────────────────

  const filtered = providers.filter((p) => {
    const matchTab =
      activeTab === "all" ||
      (activeTab === "pending" && p.certificationStatus === "pending_certification") ||
      (activeTab === "field" && p.certificationPath === "field_certification") ||
      (activeTab === "training" && p.certificationPath === "training_center") ||
      (activeTab === "certified" && p.certificationStatus === "certified");

    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (p.displayName || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    pending: providers.filter((p) => p.certificationStatus === "pending_certification").length,
    field: providers.filter((p) => p.certificationPath === "field_certification").length,
    training: providers.filter((p) => p.certificationPath === "training_center").length,
    certified: providers.filter((p) => p.certificationStatus === "certified").length,
    rejected: providers.filter((p) => p.certificationStatus === "rejected").length,
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#0ca6e8] border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading certification data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">

        {/* Success toast */}
        {successMsg && (
          <div className="fixed top-6 right-6 z-50 rounded-xl bg-green-600 text-white px-5 py-3 shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {successMsg}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Washer Certification</h1>
          <p className="text-slate-500 mt-1">Review applications, assign mentors and training centers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard label="Pending Review" value={stats.pending} color="amber" />
          <StatCard label="Field Certification" value={stats.field} color="blue" />
          <StatCard label="Training Center" value={stats.training} color="purple" />
          <StatCard label="Certified" value={stats.certified} color="green" />
          <StatCard label="Rejected" value={stats.rejected} color="red" />
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {([
              { key: "pending", label: "Pending" },
              { key: "field", label: "Field Cert." },
              { key: "training", label: "Training" },
              { key: "certified", label: "Certified" },
              { key: "all", label: "All" },
            ] as { key: TabType; label: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={[
                  "rounded-full px-4 py-2 text-sm border transition",
                  activeTab === t.key
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                ].join(" ")}
              >
                {t.label}
                {t.key === "pending" && stats.pending > 0 && (
                  <span className="ml-2 rounded-full bg-amber-500 text-white text-xs px-1.5 py-0.5">
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-slate-500">
                  <th className="px-6 py-4 font-medium">Washer</th>
                  <th className="px-6 py-4 font-medium">Path</th>
                  <th className="px-6 py-4 font-medium">Cert. Status</th>
                  <th className="px-6 py-4 font-medium">Progress</th>
                  <th className="px-6 py-4 font-medium">Applied</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      No washers found in this category
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{p.displayName || "—"}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{p.email || "—"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <PathBadge path={p.certificationPath} />
                      </td>
                      <td className="px-6 py-4">
                        <CertStatusBadge status={p.certificationStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <ProgressCell provider={p} />
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => { setSelected(p); setAdminNotes(""); setAssignInput(""); }}
                          className="rounded-lg bg-[#0ca6e8] text-white px-3 py-1.5 text-xs font-medium hover:bg-[#0990cc] transition"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-400">
          Showing {filtered.length} of {providers.length} providers
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <ReviewModal
          provider={selected}
          adminNotes={adminNotes}
          setAdminNotes={setAdminNotes}
          assignInput={assignInput}
          setAssignInput={setAssignInput}
          actionLoading={actionLoading}
          onClose={() => setSelected(null)}
          onApprove={() => handleApprove(selected.id)}
          onReject={() => handleReject(selected.id)}
          onAssignTrainingCenter={() => handleAssignTrainingCenter(selected.id)}
          onAssignMentor={() => handleAssignMentor(selected.id)}
        />
      )}
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  provider,
  adminNotes,
  setAdminNotes,
  assignInput,
  setAssignInput,
  actionLoading,
  onClose,
  onApprove,
  onReject,
  onAssignTrainingCenter,
  onAssignMentor,
}: {
  provider: Provider;
  adminNotes: string;
  setAdminNotes: (v: string) => void;
  assignInput: string;
  setAssignInput: (v: string) => void;
  actionLoading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onAssignTrainingCenter: () => void;
  onAssignMentor: () => void;
}) {
  const isField = provider.certificationPath === "field_certification";
  const isTraining = provider.certificationPath === "training_center";
  const isPending = provider.certificationStatus === "pending_certification";
  const isInTraining = provider.certificationStatus === "in_training";
  const isCertified = provider.certificationStatus === "certified";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100" style={{ backgroundColor: "#0d1629" }}>
          <div>
            <h2 className="text-lg font-semibold text-white">{provider.displayName || "Washer"}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{provider.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-xl font-light"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Status Row */}
          <div className="flex flex-wrap gap-3">
            <InfoChip label="Path" value={provider.certificationPath === "field_certification" ? "Field Certification" : provider.certificationPath === "training_center" ? "Training Center" : "Direct (Has Experience)"} />
            <InfoChip label="Status" value={provider.certificationStatus || "—"} />
            <InfoChip label="Washer Status" value={provider.washerStatus || "—"} />
          </div>

          {/* Experience */}
          {provider.professionalExperience?.hasExperience && (
            <Section title="Professional Experience">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Workplace" value={provider.professionalExperience.currentWorkplace || "—"} />
                <Detail label="Years" value={String(provider.professionalExperience.yearsOfExperience ?? "—")} />
              </div>
            </Section>
          )}

          {/* Field Certification Progress */}
          {isField && provider.fieldCertification && (
            <Section title="Field Certification Progress">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Evaluations completed</span>
                  <span className="font-medium">{provider.fieldCertification.completedEvaluations} / {provider.fieldCertification.requiredEvaluations}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-[#0ca6e8] h-2 rounded-full transition-all"
                    style={{ width: `${(provider.fieldCertification.completedEvaluations / provider.fieldCertification.requiredEvaluations) * 100}%` }}
                  />
                </div>
                <Detail label="Field Status" value={provider.fieldCertification.status} />
                {provider.fieldCertification.assignedMentors.length > 0 && (
                  <Detail label="Assigned Mentors" value={provider.fieldCertification.assignedMentors.join(", ")} />
                )}
              </div>
            </Section>
          )}

          {/* Training Center Info */}
          {isTraining && provider.trainingCenter && (
            <Section title="Training Center">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Center" value={provider.trainingCenter.centerName || "Not assigned yet"} />
                <Detail label="Status" value={provider.trainingCenter.status} />
                <Detail label="Expected Completion" value={provider.trainingCenter.expectedCompletionDate || "—"} />
              </div>
            </Section>
          )}

          {/* Admin Notes */}
          <Section title="Admin Notes">
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this application..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6e8]/30 resize-none"
            />
          </Section>

          {/* Assign Training Center */}
          {isTraining && !isCertified && (
            <Section title="Assign Training Center">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assignInput}
                  onChange={(e) => setAssignInput(e.target.value)}
                  placeholder="Training center name..."
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ca6e8]/30"
                />
                <button
                  onClick={onAssignTrainingCenter}
                  disabled={actionLoading}
                  className="rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {actionLoading ? "Assigning..." : "Assign"}
                </button>
              </div>
            </Section>
          )}

          {/* Assign Mentor */}
          {isField && !isCertified && (
            <Section title="Assign Mentor">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assignInput}
                  onChange={(e) => setAssignInput(e.target.value)}
                  placeholder="Mentor UID or name..."
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ca6e8]/30"
                />
                <button
                  onClick={onAssignMentor}
                  disabled={actionLoading}
                  className="rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {actionLoading ? "Assigning..." : "Assign"}
                </button>
              </div>
            </Section>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!isCertified && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <button
              onClick={onReject}
              disabled={actionLoading}
              className="rounded-xl border border-red-200 bg-red-50 text-red-600 px-5 py-2.5 text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition"
            >
              {actionLoading ? "Processing..." : "✕ Reject Application"}
            </button>
            <button
              onClick={onApprove}
              disabled={actionLoading}
              className="rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              {actionLoading ? "Processing..." : "✓ Approve & Certify"}
            </button>
          </div>
        )}

        {isCertified && (
          <div className="px-6 py-4 border-t border-slate-100 bg-green-50 text-center text-green-700 text-sm font-medium">
            ✓ This washer is certified and active
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-slate-400">{label}</span>
      <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-100 px-3 py-2">
      <span className="text-xs text-slate-400 block">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    amber: "text-amber-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    red: "text-red-500",
  };
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
      <div className="text-sm text-slate-500 font-medium">{label}</div>
      <div className={`mt-1 text-3xl font-semibold tracking-tight ${color ? colors[color] : ""}`}>
        {value}
      </div>
    </div>
  );
}

function PathBadge({ path }: { path?: string | null }) {
  if (!path) return <span className="text-slate-400 text-xs">Direct Review</span>;
  if (path === "field_certification")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium">
        🔧 Field
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 px-2.5 py-1 text-xs font-medium">
      🏫 Training
    </span>
  );
}

function CertStatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending_certification: { label: "Pending Review", cls: "bg-amber-50 text-amber-700" },
    in_training: { label: "In Training", cls: "bg-blue-50 text-blue-700" },
    certified: { label: "Certified", cls: "bg-green-50 text-green-700" },
    rejected: { label: "Rejected", cls: "bg-red-50 text-red-600" },
    uncertified: { label: "Uncertified", cls: "bg-slate-100 text-slate-600" },
  };
  const s = map[status || ""] || { label: status || "—", cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

function ProgressCell({ provider }: { provider: Provider }) {
  if (provider.certificationPath === "field_certification" && provider.fieldCertification) {
    const pct = Math.round(
      (provider.fieldCertification.completedEvaluations / provider.fieldCertification.requiredEvaluations) * 100
    );
    return (
      <div className="w-28">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{provider.fieldCertification.completedEvaluations}/{provider.fieldCertification.requiredEvaluations} evals</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div className="bg-[#0ca6e8] h-1.5 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  if (provider.certificationPath === "training_center" && provider.trainingCenter) {
    return (
      <span className="text-xs text-slate-500">
        {provider.trainingCenter.centerName || "Awaiting assignment"}
      </span>
    );
  }
  return <span className="text-xs text-slate-400">—</span>;
}