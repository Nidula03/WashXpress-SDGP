"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  totalCustomers: number;
  totalWashers: number;
  paidBookings: number;
  revenueByDay: { date: string; revenue: number; bookings: number }[];
  topServices: { name: string; count: number; revenue: number }[];
}

function StatCard({
  title,
  value,
  sub,
  color,
  icon,
}: {
  title: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`text-2xl p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SimpleBarChart({
  data,
}: {
  data: { date: string; revenue: number; bookings: number }[];
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-1 h-32 w-full">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-1 group relative"
        >
          <div
            className="w-full rounded-t-sm transition-all"
            style={{
              height: `${(d.revenue / max) * 100}%`,
              backgroundColor: "#0ca6e8",
              minHeight: d.revenue > 0 ? "4px" : "0px",
            }}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
            <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
              LKR {d.revenue.toLocaleString()}
              <br />
              {d.bookings} bookings
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/firebase/analytics?days=${range}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const completionRate =
    data && data.totalBookings > 0
      ? Math.round((data.completedBookings / data.totalBookings) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Platform performance overview
          </p>
        </div>
        <div className="flex gap-2">
          {([7, 14, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                range === d
                  ? "text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              style={range === d ? { backgroundColor: "#0ca6e8" } : {}}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div
            className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#0ca6e8", borderTopColor: "transparent" }}
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error} —{" "}
          <button onClick={fetchAnalytics} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value={`LKR ${data.totalRevenue.toLocaleString()}`}
              sub={`From ${data.paidBookings} paid bookings`}
              color="bg-blue-50 text-blue-600"
              icon="💰"
            />
            <StatCard
              title="Total Bookings"
              value={data.totalBookings}
              sub={`Last ${range} days`}
              color="bg-purple-50 text-purple-600"
              icon="📋"
            />
            <StatCard
              title="Active Customers"
              value={data.totalCustomers}
              sub="Registered accounts"
              color="bg-green-50 text-green-600"
              icon="👥"
            />
            <StatCard
              title="Active Washers"
              value={data.totalWashers}
              sub="Certified providers"
              color="bg-orange-50 text-orange-600"
              icon="🚗"
            />
          </div>

          {/* Revenue Chart + Booking Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800">
                  Revenue (Last {range} days)
                </h2>
                <span className="text-xs text-slate-400">Hover bars for details</span>
              </div>
              {data.revenueByDay.length > 0 ? (
                <>
                  <SimpleBarChart data={data.revenueByDay} />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-slate-400">
                      {data.revenueByDay[0]?.date}
                    </span>
                    <span className="text-xs text-slate-400">
                      {data.revenueByDay[data.revenueByDay.length - 1]?.date}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                  No revenue data yet
                </div>
              )}
            </div>

            {/* Booking Status Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-4">
                Booking Status
              </h2>
              <div className="space-y-3">
                {[
                  {
                    label: "Completed",
                    count: data.completedBookings,
                    color: "#22c55e",
                  },
                  {
                    label: "Pending",
                    count: data.pendingBookings,
                    color: "#f59e0b",
                  },
                  {
                    label: "Cancelled",
                    count: data.cancelledBookings,
                    color: "#ef4444",
                  },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{s.label}</span>
                      <span className="font-medium text-slate-800">
                        {s.count}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width:
                            data.totalBookings > 0
                              ? `${(s.count / data.totalBookings) * 100}%`
                              : "0%",
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <p className="text-sm text-slate-500">
                    Completion rate:{" "}
                    <span className="font-semibold text-slate-800">
                      {completionRate}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Services */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Top Services</h2>
            {data.topServices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 text-slate-500 font-medium">
                        Service
                      </th>
                      <th className="text-right py-2 text-slate-500 font-medium">
                        Bookings
                      </th>
                      <th className="text-right py-2 text-slate-500 font-medium">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topServices.map((s, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-2.5 text-slate-800 font-medium">
                          {s.name}
                        </td>
                        <td className="py-2.5 text-right text-slate-600">
                          {s.count}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-800">
                          LKR {s.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No service data yet</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}