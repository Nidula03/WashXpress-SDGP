import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { ok: false, error: "Customer ID is required" },
                { status: 400 }
            );
        }

        // Delete the customer document from Firestore
        await adminDb.collection("customers").doc(id).delete();

        return NextResponse.json({ ok: true, message: "Customer deleted successfully" });
    } catch (err: any) {
        console.error("Error deleting customer:", err);
        return NextResponse.json(
            { ok: false, error: err?.code ?? err?.message ?? "unknown" },
            { status: 500 }
        );
    }
}
