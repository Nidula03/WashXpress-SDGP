import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { ok: false, error: "Provider ID is required" },
                { status: 400 }
            );
        }

        // Update the provider document in Firestore
        await adminDb.collection("providers").doc(id).update({
            verified: true,
            active: true,
            status: "approved",
            isActive: true,
            isVerified: true,
            certificationStatus: "certified",
            washerStatus: "available",
            "certificationReview.status": "approved",
            "certificationReview.reviewedAt": new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ ok: true, message: "Provider approved successfully" });
    } catch (err: any) {
        console.error("Error approving provider:", err);
        return NextResponse.json(
            { ok: false, error: err?.code ?? err?.message ?? "unknown" },
            { status: 500 }
        );
    }
}
