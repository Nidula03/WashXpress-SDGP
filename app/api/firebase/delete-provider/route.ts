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

        // Delete the provider/washer document from Firestore
        await adminDb.collection("providers").doc(id).delete();

        return NextResponse.json({ ok: true, message: "Washer deleted successfully" });
    } catch (err: any) {
        console.error("Error deleting washer:", err);
        return NextResponse.json(
            { ok: false, error: err?.code ?? err?.message ?? "unknown" },
            { status: 500 }
        );
    }
}
