export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    console.log("Firestore check initiated - fetching all collections");

    // Define collections to fetch
    const collectionNames = [
      "bookings",
      "customers",
      "password_resets",
      "providers",
      "subscriptions",
      "users",
      "washers",
      "services"
    ];

    // Fetch all collections in parallel using Admin SDK
    const results: Record<string, any[]> = {};

    await Promise.all(
      collectionNames.map(async (collectionName) => {
        const snapshot = await adminDb.collection(collectionName).get();
        results[collectionName] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      })
    );

    // Map customerName and serviceName onto bookings if missing
    if (results.bookings && results.customers && results.services) {
      const customersMap = Object.fromEntries(results.customers.map(c => [c.id, c]));
      const servicesMap = Object.fromEntries(results.services.map(s => [s.id, s]));
      
      results.bookings = results.bookings.map(b => {
        // Find customer name
        const c = customersMap[b.customerId || b.userId];
        const computedCustomerName = c ? (c.name || c.displayName || c.firstName || c.email) : null;
        
        // Find service name
        const s = servicesMap[b.serviceId];
        const computedServiceName = s ? (s.name || s.title || s.type) : null;

        return {
          ...b,
          customerName: b.customerName || computedCustomerName || null,
          serviceName: b.serviceName || b.serviceType || computedServiceName || null,
        };
      });
    }

    return NextResponse.json({
      ok: true,
      data: results,
      counts: {
        bookings: results.bookings?.length ?? 0,
        customers: results.customers?.length ?? 0,
        password_resets: results.password_resets?.length ?? 0,
        providers: results.providers?.length ?? 0,
        subscriptions: results.subscriptions?.length ?? 0,
        users: results.users?.length ?? 0,
        washers: results.washers?.length ?? 0,
      },
    });
  } catch (err: any) {
    console.error("Firestore fetch error:", err);
    return NextResponse.json(
      { ok: false, error: err?.code ?? err?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
