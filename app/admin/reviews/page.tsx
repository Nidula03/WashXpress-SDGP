// app/admin/reviews/page.tsx
"use client";

import { useEffect, useState } from "react";

interface Review {
  id: string;
  userId: string;
  providerId: string;
  review: string;
  stars: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/firebase/reviews");
        const json = await res.json();

        if (json.ok) {
          setReviews(json.reviews);
        } else {
          setError("Failed to fetch reviews");
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

  // Compute summary stats
  const totalReviews = reviews.length;
  const averageStars =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + (r.stars ?? 0), 0) / totalReviews).toFixed(1)
      : "—";

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.stars === s).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-slate-500">Loading reviews…</div>
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
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">User ID</th>
                  <th className="px-4 py-3 font-medium">Provider ID</th>
                  <th className="px-4 py-3 font-medium">Review</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No reviews found
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-700 font-mono text-xs">
                        {r.userId || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-mono text-xs">
                        {r.providerId || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                        {r.review || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Stars count={r.stars} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {r.createdAt ? formatDate(r.createdAt) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helper Components ---------- */

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= count ? "text-amber-400" : "text-slate-200"}>
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
      {hint ? <div className="mt-2 text-sm text-slate-400">{hint}</div> : null}
    </div>
  );
}

/* ---------- Helpers ---------- */

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