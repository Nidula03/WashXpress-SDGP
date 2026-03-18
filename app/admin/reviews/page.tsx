"use client";

import { useEffect, useState } from "react";

interface Review {
  id: string;
  userId: string;
  providerId: string;
  bookingId?: string;
  review: string;
  stars: number;
  tags?: string[];
  customerName?: string | null;
  providerName?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/firebase/reviews");
        const json = await res.json();
        if (json.ok) {
          setReviews(json.reviews);
        } else {
          setError(json.error || "Failed to fetch reviews");
        }
      } catch (err) {
        setError("Error connecting to database");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalReviews = reviews.length;
  const averageStars =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + (r.stars ?? 0), 0) / totalReviews).toFixed(1)
      : "—";

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.stars === s).length,
  }));

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = reviews.filter((r) => {
    if (ratingFilter > 0 && r.stars !== ratingFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.customerName?.toLowerCase().includes(q) ?? false) ||
        (r.providerName?.toLowerCase().includes(q) ?? false) ||
        (r.review?.toLowerCase().includes(q) ?? false) ||
        (r.bookingId?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ca6e8]" />
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
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Reviews" value={totalReviews} hint="All customer reviews" />
        <MetricCard title="Average Rating" value={`${averageStars} ★`} hint="Mean star rating" />
        <MetricCard
          title="5-Star Reviews"
          value={starCounts.find((s) => s.star === 5)?.count ?? 0}
          hint="Highest rated"
        />
        <MetricCard
          title="Below 3 Stars"
          value={reviews.filter((r) => r.stars < 3).length}
          hint="Needs attention"
        />
      </div>

      {/* Star distribution */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="text-xl font-semibold mb-4">Rating Distribution</div>
        <div className="space-y-2">
          {starCounts.map(({ star, count }) => {
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-12 text-slate-600 font-medium">{star} ★</span>
                <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-slate-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by customer, washer, or comment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#0ca6e8]"
        />
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={[
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
                ratingFilter === r
                  ? "bg-[#0ca6e8] text-white border-[#0ca6e8]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#0ca6e8]",
              ].join(" ")}
            >
              {r === 0 ? "All" : `${r}★`}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Reviews table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
          <div>
            <div className="text-xl font-semibold">All Reviews</div>
            <div className="text-base text-slate-500 mt-1">
              {totalReviews} review{totalReviews !== 1 ? "s" : ""} total
            </div>
          </div>
        </div>

        <div className="p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">⭐</p>
              <p className="text-slate-400">No reviews found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className={[
                    "rounded-xl border p-5 transition",
                    r.stars <= 2
                      ? "border-red-100 bg-red-50"
                      : "border-slate-100 bg-white hover:border-slate-200",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <Stars count={r.stars} />
                      <span className="text-sm font-bold text-slate-700">{r.stars}.0</span>
                      {r.stars <= 2 && (
                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                          ⚠ Low rating
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {r.createdAt ? formatDate(r.createdAt) : "—"}
                    </span>
                  </div>

                  {/* Comment */}
                  {r.review && (
                    <p className="text-sm text-slate-700 leading-relaxed mb-3">{r.review}</p>
                  )}

                  {/* Tags */}
                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {r.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400 border-t border-slate-100 pt-3">
                    <span>
                      Customer:{" "}
                      <span className="font-semibold text-slate-600">
                        {r.customerName || r.userId || "—"}
                      </span>
                    </span>
                    <span>
                      Washer:{" "}
                      <span className="font-semibold text-slate-600">
                        {r.providerName || r.providerId || "—"}
                      </span>
                    </span>
                    {r.bookingId && (
                      <span>
                        Booking:{" "}
                        <span className="font-mono text-slate-500">{r.bookingId}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helper Components ─────────────────────────────────────────────────────── */

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= count ? "text-amber-400 text-base" : "text-slate-200 text-base"}>
          ★
        </span>
      ))}
    </span>
  );
}

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
      {hint && <div className="mt-2 text-sm text-slate-400">{hint}</div>}
    </div>
  );
}

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