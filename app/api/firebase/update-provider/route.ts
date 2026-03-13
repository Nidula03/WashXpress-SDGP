export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, email, phone, active, verified } = body;

        if (!id) {
            return NextResponse.json({ ok: false, error: "Missing washer id" }, { status: 400 });
        }

        // Update the document in Firestore (using the 'providers' collection)
        await adminDb.collection("providers").doc(id).update({
            ...(name !== undefined && { name }),
            ...(email !== undefined && { email }),
            ...(phone !== undefined && { phone }),
            ...(active !== undefined && { active }),
            ...(verified !== undefined && { verified }),
            updatedAt: new Date()
        });

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("Error updating washer:", err);
        return NextResponse.json(
            { ok: false, error: err?.code ?? err?.message ?? "unknown error" },
            { status: 500 }
        );
    }
}
