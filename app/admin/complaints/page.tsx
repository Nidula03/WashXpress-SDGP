"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Complaint {
  id: string;
  type: "customer" | "washer";
  status: "open" | "under_review" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "critical";
  category?: string;
  subject: string;
  description: string;
  reportedBy: string;
  reportedByName?: string;
  reportedAgainst?: string;
  reportedAgainstName?: string;
  bookingId?: string;
  evidencePhotos?: string[];
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: any;
  updatedAt: any;
}

interface BookingEvidence {
  damageReportPhotos?: string[];
  damageReportUploadedAt?: any;
  damageReportNote?: string;
  service?: { name: string };
  vehicle?: { make: string; model: string; licensePlate: string };
  scheduledDate?: string;
  assignedStaffName?: string;
}

interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  rating: number;
  comment?: string;
  tags?: string[];
  createdAt: any;
  customerName?: string;
  providerName?: string;
  serviceName?: string;
}

type Tab = "complaints" | "reviews" | "compliance";
type StatusFilter = "all" | "open" | "under_review" | "resolved" | "dismissed";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(val: any): string {
  if (!val) return "—";
  try {
    const d = val._seconds ? new Date(val._seconds * 1000) : new Date(val);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
}

function priorityColor(p: string) {
  if (p === "critical") return "bg-red-100 text-red-700 border-red-200";
  if (p === "high") return "bg-orange-100 text-orange-700 border-orange-200";
  if (p === "medium") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function statusColor(s: string) {
  if (s === "open") return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "under_review") return "bg-purple-100 text-purple-700 border-purple-200";
  if (s === "resolved") return "bg-green-100 text-green-700 border-green-200";
  if (s === "dismissed") return "bg-slate-100 text-slate-500 border-slate-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`w-4 h-4 ${s <= rating ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ─── Photo lightbox ───────────────────────────────────────────────────────────
function PhotoLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white hover:text-slate-300" onClick={onClose}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img src={url} alt="Evidence" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
    </div>
  );
}

// ─── Photo grid ───────────────────────────────────────────────────────────────
function PhotoGrid({ photos, label, accent }: { photos: string[]; label: string; accent: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!photos || photos.length === 0) return (
    <div className={`border-2 border-dashed ${accent === 'amber' ? 'border-amber-200' : 'border-red-200'} rounded-xl p-6 text-center`}>
      <p className={`text-sm ${accent === 'amber' ? 'text-amber-400' : 'text-red-400'}`}>No {label.toLowerCase()} uploaded</p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <button key={i} onClick={() => setLightbox(url)} className="relative aspect-square rounded-xl overflow-hidden hover:ring-2 hover:ring-[#0ca6e8] transition group">
            <img src={url} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">{i + 1}</span>
          </button>
        ))}
      </div>
      {lightbox && <PhotoLightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ComplaintsPage() {
  const [tab, setTab] = useState<Tab>("complaints");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "customer" | "washer">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [bookingEvidence, setBookingEvidence] = useState<BookingEvidence | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState(0);

  useEffect(() => { fetchComplaints(); }, []);
  useEffect(() => { if (tab === "reviews") fetchReviews(); }, [tab]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/firebase/complaints");
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (e) {
      console.error("Failed to fetch complaints", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch("/api/firebase/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error("Failed to fetch reviews", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchBookingEvidence = async (bookingId: string) => {
    setLoadingEvidence(true);
    setBookingEvidence(null);
    try {
      const res = await fetch(`/api/firebase/bookings/${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        setBookingEvidence(data.booking || null);
      }
    } catch (e) {
      console.error("Failed to fetch booking evidence", e);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const handleOpenDetail = (c: Complaint) => {
    setSelected(c);
    setAdminNotes(c.adminNotes || "");
    setBookingEvidence(null);
    if (c.bookingId) fetchBookingEvidence(c.bookingId);
  };

  const handleUpdateStatus = async (newStatus: Complaint["status"]) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/firebase/complaints/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });
      if (res.ok) {
        setComplaints(prev => prev.map(c =>
          c.id === selected.id ? { ...c, status: newStatus, adminNotes } : c
        ));
        setSelected(prev => prev ? { ...prev, status: newStatus, adminNotes } : null);
        setSuccessMsg(`Marked as ${newStatus.replace("_", " ")}`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Stats
  const openCount = complaints.filter(c => c.status === "open").length;
  const reviewCount = complaints.filter(c => c.status === "under_review").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;
  const criticalCount = complaints.filter(c => c.priority === "critical" && c.status === "open").length;

  const filteredComplaints = complaints.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.subject.toLowerCase().includes(q) ||
        (c.reportedByName?.toLowerCase().includes(q) ?? false) ||
        (c.reportedAgainstName?.toLowerCase().includes(q) ?? false) ||
        (c.bookingId?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const filteredReviews = reviews.filter(r => ratingFilter === 0 || r.rating === ratingFilter);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";
  const lowRatingReviews = reviews.filter(r => r.rating <= 2).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Complaints & Compliance</h1>
          <p className="text-sm text-slate-500 mt-1">Manage complaints, review evidence, and ensure platform compliance</p>
        </div>
        {successMsg && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            {successMsg}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Open", value: openCount, color: "text-blue-600", bg: "bg-blue-50", iconColor: "text-blue-500", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>) },
          { label: "Under Review", value: reviewCount, color: "text-purple-600", bg: "bg-purple-50", iconColor: "text-purple-500", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>) },
          { label: "Resolved", value: resolvedCount, color: "text-green-600", bg: "bg-green-50", iconColor: "text-green-500", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
          { label: "Critical Open", value: criticalCount, color: "text-red-600", bg: "bg-red-50", iconColor: "text-red-500", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>) },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
            <div className="flex justify-between items-center mb-1">
              <span className={stat.iconColor}>{stat.icon}</span>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(["complaints", "reviews", "compliance"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition -mb-px",
              tab === t ? "border-[#0ca6e8] text-[#0ca6e8]" : "border-transparent text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {t === "complaints" ? `Complaints (${complaints.length})` : t === "reviews" ? "Reviews" : "Compliance"}
          </button>
        ))}
      </div>

      {/* ── COMPLAINTS TAB ── */}
      {tab === "complaints" && (
        <div className={`flex gap-5 ${selected ? "items-start" : ""}`}>
          {/* List */}
          <div className={`${selected ? "w-2/5 shrink-0" : "w-full"} space-y-3`}>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-[#0ca6e8]"
              />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ca6e8]">
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ca6e8]">
                <option value="all">All Types</option>
                <option value="customer">By Customer</option>
                <option value="washer">By Washer</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ca6e8]" />
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <p className="text-slate-400">No complaints found</p>
              </div>
            ) : filteredComplaints.map(c => (
              <button
                key={c.id}
                onClick={() => handleOpenDetail(c)}
                className={[
                  "w-full text-left bg-white rounded-xl border p-4 hover:shadow-md transition",
                  selected?.id === c.id ? "border-[#0ca6e8] shadow-md ring-1 ring-[#0ca6e8]" : "border-slate-200",
                  c.priority === "critical" ? "border-l-4 border-l-red-500" : "",
                ].join(" ")}
              >
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityColor(c.priority)}`}>{c.priority.toUpperCase()}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor(c.status)}`}>{c.status.replace("_", " ")}</span>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    {c.type === "customer" ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                    )}
                    {c.type}
                  </span>
                  {c.evidencePhotos && c.evidencePhotos.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {c.evidencePhotos.length} photo{c.evidencePhotos.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-slate-400">{formatDate(c.createdAt)}</span>
                </div>
                <p className="font-semibold text-slate-800 text-sm mb-1">{c.subject}</p>
                <p className="text-slate-500 text-xs line-clamp-2">{c.description}</p>
                <div className="flex gap-4 mt-1.5 text-xs text-slate-400">
                  <span>From: <span className="text-slate-600 font-medium">{c.reportedByName || "—"}</span></span>
                  {c.reportedAgainstName && <span>Against: <span className="text-slate-600 font-medium">{c.reportedAgainstName}</span></span>}
                </div>
              </button>
            ))}
          </div>

          {/* ── Detail Panel ── */}
          {selected && (
            <div className="flex-1 min-w-0 space-y-4 sticky top-24">
              {/* Header */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selected.subject}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Filed {formatDate(selected.createdAt)}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 ml-2 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap mb-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${priorityColor(selected.priority)}`}>{selected.priority.toUpperCase()}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor(selected.status)}`}>{selected.status.replace("_", " ")}</span>
                  {selected.category && <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 capitalize">{selected.category.replace("_", " ")}</span>}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Reported By</p>
                    <p className="text-sm font-semibold text-slate-800">{selected.reportedByName || selected.reportedBy}</p>
                  </div>
                  {selected.reportedAgainstName && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Against</p>
                      <p className="text-sm font-semibold text-slate-800">{selected.reportedAgainstName}</p>
                    </div>
                  )}
                  {selected.bookingId && (
                    <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Booking</p>
                      <p className="text-sm font-mono text-slate-700">{selected.bookingId}</p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3">{selected.description}</p>
                </div>
              </div>

              {/* ── PHOTO EVIDENCE COMPARISON ── */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Evidence Comparison
                  <span className="text-xs font-normal text-slate-400 ml-1">Use this to give an unbiased verdict</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Customer evidence */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Customer Evidence ({selected.evidencePhotos?.length || 0} photos)
                      </p>
                    </div>
                    <PhotoGrid photos={selected.evidencePhotos || []} label="Customer Evidence" accent="red" />
                  </div>

                  {/* Washer pre-job damage */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Pre-Job Damage Report ({bookingEvidence?.damageReportPhotos?.length || 0} photos)
                      </p>
                    </div>
                    {loadingEvidence ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400" />
                      </div>
                    ) : (
                      <>
                        <PhotoGrid photos={bookingEvidence?.damageReportPhotos || []} label="Pre-Job Damage" accent="amber" />
                        {bookingEvidence?.damageReportUploadedAt && (
                          <p className="text-xs text-slate-400 mt-2">Uploaded: {formatDate(bookingEvidence.damageReportUploadedAt)}</p>
                        )}
                        {!bookingEvidence?.damageReportPhotos?.length && !loadingEvidence && (
                          <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
                            <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              No pre-job damage report
                            </p>
                            <p className="text-xs text-amber-500 mt-0.5">Washer did not document pre-existing damage</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Booking context */}
                {bookingEvidence && (
                  <div className="mt-4 bg-slate-50 rounded-lg p-3 text-xs text-slate-500 grid grid-cols-3 gap-3">
                    {bookingEvidence.service?.name && <span>Service: <span className="font-semibold text-slate-700">{bookingEvidence.service.name}</span></span>}
                    {bookingEvidence.vehicle && <span>Vehicle: <span className="font-semibold text-slate-700">{bookingEvidence.vehicle.make} {bookingEvidence.vehicle.model} · {bookingEvidence.vehicle.licensePlate}</span></span>}
                    {bookingEvidence.assignedStaffName && <span>Washer: <span className="font-semibold text-slate-700">{bookingEvidence.assignedStaffName}</span></span>}
                  </div>
                )}
              </div>

              {/* Admin actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Admin Actions</h3>

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">Internal Notes</p>
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={3}
                    placeholder="Add verdict, action taken, or internal notes..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0ca6e8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(["open", "under_review", "resolved", "dismissed"] as Complaint["status"][]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(s)}
                      disabled={actionLoading || selected.status === s}
                      className={[
                        "px-3 py-2 rounded-lg text-xs font-semibold border transition",
                        selected.status === s
                          ? "bg-[#0ca6e8] text-white border-[#0ca6e8] cursor-default"
                          : "bg-white text-slate-600 border-slate-200 hover:border-[#0ca6e8] hover:text-[#0ca6e8]",
                        actionLoading ? "opacity-50 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      {s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REVIEWS TAB ── */}
      {tab === "reviews" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-500">Filter by rating:</span>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setRatingFilter(r)}
                  className={["px-3 py-1.5 rounded-full text-xs font-semibold border transition",
                    ratingFilter === r ? "bg-[#0ca6e8] text-white border-[#0ca6e8]" : "bg-white text-slate-600 border-slate-200 hover:border-[#0ca6e8]"].join(" ")}>
                  {r === 0 ? "All" : `${r}★`}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-400">{filteredReviews.length} reviews</span>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ca6e8]" /></div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <svg className="w-10 h-10 text-amber-300 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <p className="text-slate-400">No reviews yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReviews.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-slate-700 leading-relaxed">{r.comment}</p>}
                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.tags.map(tag => <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">{tag}</span>)}
                    </div>
                  )}
                  <div className="border-t border-slate-100 pt-3 text-xs text-slate-400 space-y-1">
                    {r.customerName && <p>Customer: <span className="text-slate-600 font-medium">{r.customerName}</span></p>}
                    {r.providerName && <p>Washer: <span className="text-slate-600 font-medium">{r.providerName}</span></p>}
                  </div>
                  {r.rating <= 2 && (
                    <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Low rating — may need follow-up
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COMPLIANCE TAB ── */}
      {tab === "compliance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Avg Review Rating", value: avgRating, iconColor: "text-amber-500", color: "text-amber-600", bg: "bg-amber-50", icon: (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>) },
              { label: "Low Rating Reviews", value: lowRatingReviews, iconColor: "text-red-500", color: "text-red-600", bg: "bg-red-50", icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>) },
              { label: "Total Complaints", value: complaints.length, iconColor: "text-blue-500", color: "text-blue-600", bg: "bg-blue-50", icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>) },
              { label: "Resolution Rate", value: complaints.length > 0 ? `${Math.round((resolvedCount / complaints.length) * 100)}%` : "—", iconColor: "text-green-500", color: "text-green-600", bg: "bg-green-50", icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
            ].map(m => (
              <div key={m.label} className={`${m.bg} rounded-xl p-5`}>
                <div className={`mb-2 ${m.iconColor}`}>{m.icon}</div>
                <div className={`text-3xl font-bold ${m.color} mb-1`}>{m.value}</div>
                <p className="text-sm font-medium text-slate-600">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Platform Policy Compliance</h2>
            <div className="space-y-3">
              {[
                "All washers must be verified before accepting bookings",
                "Customers can cancel up to 48 hours before booking",
                "Subscription washes refunded on cancellation",
                "Race mode — first washer to accept wins the job",
                "Vehicle type surcharge applied at booking time",
                "All payments processed through PayHere gateway",
                "Washer field certification requires 6 evaluations",
                "Customer data stored securely in Firestore",
                "Reviews can only be submitted for completed bookings",
                "Pre-job damage reports protect washers from false claims",
                "Complaint evidence photos stored in Firebase Storage",
              ].map((rule, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </span>
                  <p className="text-sm text-slate-700 flex-1">{rule}</p>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Enforced</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}