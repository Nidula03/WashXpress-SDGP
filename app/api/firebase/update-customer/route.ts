export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, displayName, email, phone, plan, status } = body;

        if (!id) {
            return NextResponse.json({ ok: false, error: "Missing customer id" }, { status: 400 });
        }

        // Update the document in Firestore
        await adminDb.collection("customers").doc(id).update({
            ...(name !== undefined && { name }),
            ...(displayName !== undefined && { displayName }),
            ...(email !== undefined && { email }),
            ...(phone !== undefined && { phone }),
            ...(plan !== undefined && { plan }),
            ...(status !== undefined && { status }),
            updatedAt: new Date()
        });

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("Error updating customer:", err);
        return NextResponse.json(
            { ok: false, error: err?.code ?? err?.message ?? "unknown error" },
            { status: 500 }
        );
    }
}
