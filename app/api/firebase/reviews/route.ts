export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    // Fetch reviews
    const snapshot = await adminDb
      .collection("reviews") // ← was "review" (wrong)
      .orderBy("createdAt", "desc")
      .get();

    const reviews = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Resolve customer display name
        let customerName: string | null = null;
        if (data.customerId) {
          try {
            const custDoc = await adminDb.collection("customers").doc(data.customerId).get();
            if (custDoc.exists) customerName = custDoc.data()?.displayName ?? null;
          } catch { /* non-fatal */ }
        }

        // Resolve provider display name
        let providerName: string | null = null;
        if (data.providerId) {
          try {
            const provDoc = await adminDb.collection("providers").doc(data.providerId).get();
            if (provDoc.exists) providerName = provDoc.data()?.displayName ?? null;
          } catch { /* non-fatal */ }
        }

        return {
          id: doc.id,
          // IDs
          userId: data.customerId ?? data.userId ?? null,
          providerId: data.providerId ?? null,
          bookingId: data.bookingId ?? null,
          // Content — map both field name conventions
          review: data.comment ?? data.review ?? null,
          stars: data.rating ?? data.stars ?? 0,
          tags: data.tags ?? [],
          // Enriched names
          customerName,
          providerName,
          // Timestamps
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      reviews,
      count: reviews.length,
    });
  } catch (err: any) {
    console.error("Error fetching reviews:", err);
    return NextResponse.json(
      { ok: false, error: err?.code ?? err?.message ?? "unknown" },
      { status: 500 }
    );
  }
}