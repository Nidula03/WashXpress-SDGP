import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("customers").get();
    const customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ ok: true, customers });
  } catch (err: any) {
    console.error("Error fetching customers:", err);
    return NextResponse.json(
      { ok: false, error: err?.code ?? err?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
