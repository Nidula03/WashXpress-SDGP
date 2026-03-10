import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
    try {
        const [customerSnap, washerSnap] = await Promise.all([
            adminDb.collection("customer_complaints").get(),
            adminDb.collection("washer_complaints").get(),
        ]);

        const mapDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() ?? null,
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() ?? null,
        });

        const customerComplaints = customerSnap.docs.map(mapDoc);
        const washerComplaints = washerSnap.docs.map(mapDoc);

        return NextResponse.json({
            ok: true,
            customerComplaints,
            washerComplaints,
        });
    } catch (err: any) {
        console.error("Error fetching complaints:", err);
        return NextResponse.json(
            { ok: false, error: err?.code ?? err?.message ?? "unknown" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, collection, status } = body;

        if (!id || !collection || !status) {
            return NextResponse.json(
                { ok: false, error: "Missing id, collection, or status" },
                { status: 400 }
            );
        }

        const validCollections = ["customer_complaints", "washer_complaints"];
        if (!validCollections.includes(collection)) {
            return NextResponse.json(
                { ok: false, error: "Invalid collection" },
                { status: 400 }
            );
        }

        await adminDb.collection(collection).doc(id).update({
            status,
            updatedAt: new Date(),
        });

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("Error updating complaint:", err);
        return NextResponse.json(
            { ok: false, error: err?.code ?? err?.message ?? "unknown" },
            { status: 500 }
        );
    }
}
