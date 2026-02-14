import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    console.log("Firestore check initiated - fetching all collections");

    // Define collections to fetch
    const collectionNames = ["bookings", "customers", "password_resets", "users", "washers"];
    
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

    return NextResponse.json({
      ok: true,
      data: results,
      counts: {
        bookings: results.bookings?.length ?? 0,
        customers: results.customers?.length ?? 0,
        password_resets: results.password_resets?.length ?? 0,
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
