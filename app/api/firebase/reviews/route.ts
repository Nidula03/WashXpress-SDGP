export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
    try {
        const snapshot = await adminDb.collection("review").get();
        const reviews = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore Timestamps to ISO strings for the client
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() ?? null,
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() ?? null,
        }));

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
