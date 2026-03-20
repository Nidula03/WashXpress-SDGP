export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
    try {
        const complaintsSnap = await adminDb.collection("complaints").get();

        const mapDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() ?? null,
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() ?? null,
        });

        const complaintsList = complaintsSnap.docs.map(mapDoc);

        return NextResponse.json({
            ok: true,
            complaints: complaintsList,
        });
    } catch (err: any) {
        console.error("Error fetching complaints:", err);
        return NextResponse.json(
            { ok: false, error: err?.code ?? err?.message ?? "unknown" },
            { status: 500 }
        );
    }
}
