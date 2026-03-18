export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7");

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceIso = since.toISOString().split("T")[0]; // YYYY-MM-DD

    // ── Fetch bookings in date range ──────────────────────────────────────────
    const bookingsSnap = await adminDb
      .collection("bookings")
      .where("scheduledDate", ">=", sinceIso)
      .get();

    const bookings = bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() as any }));

    // ── Booking status counts ────────────────────────────────────────────────
    const completedBookings = bookings.filter((b) => b.status === "completed").length;
    const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
    const pendingBookings = bookings.filter((b) =>
      ["pending", "confirmed", "in_progress"].includes(b.status)
    ).length;
    const paidBookings = bookings.filter((b) => b.paymentStatus === "paid").length;

    // ── Revenue ──────────────────────────────────────────────────────────────
    const totalRevenue = bookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum: number, b: any) => sum + (b.paymentAmount || b.totalPrice || 0), 0);

    // ── Revenue by day ────────────────────────────────────────────────────────
    const revenueByDayMap: Record<string, { revenue: number; bookings: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split("T")[0];
      revenueByDayMap[key] = { revenue: 0, bookings: 0 };
    }

    for (const b of bookings) {
      const date = b.scheduledDate;
      if (revenueByDayMap[date]) {
        revenueByDayMap[date].bookings += 1;
        if (b.paymentStatus === "paid") {
          revenueByDayMap[date].revenue += b.paymentAmount || b.totalPrice || 0;
        }
      }
    }

    const revenueByDay = Object.entries(revenueByDayMap).map(([date, val]) => ({
      date,
      ...val,
    }));

    // ── Top services ──────────────────────────────────────────────────────────
    const serviceMap: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const b of bookings) {
      const name = b.service?.name || b.serviceId || "Unknown";
      if (!serviceMap[name]) serviceMap[name] = { name, count: 0, revenue: 0 };
      serviceMap[name].count += 1;
      if (b.paymentStatus === "paid") {
        serviceMap[name].revenue += b.paymentAmount || b.totalPrice || 0;
      }
    }
    const topServices = Object.values(serviceMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── Customer & washer counts ──────────────────────────────────────────────
    const [customersSnap, washersSnap, subscriptionsSnap] = await Promise.all([
      adminDb.collection("customers").get(), // getting all to filter locally as count() API has limitations
      adminDb.collection("providers").where("isActive", "==", true).count().get(),
      adminDb.collection("subscriptions").get(),
    ]);

    const customers = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const subscriptions = subscriptionsSnap.docs.map(doc => doc.data() as any);
    
    // Build a lookup map: customerId → subscription document
    const subscriptionMap: Record<string, any> = {};
    subscriptions.forEach((sub: any) => {
      const key = sub.customerId || sub.userId || sub.uid;
      if (key) subscriptionMap[key] = sub;
    });

    // Valid customers are those with a subscription, matching logic on AdminDashboard
    const validCustomersCount = customers.filter((c: any) => !!subscriptionMap[c.id]).length;

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue),
      totalBookings: bookings.length,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      paidBookings,
      totalCustomers: validCustomersCount,
      totalWashers: washersSnap.data().count,
      revenueByDay,
      topServices,
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}