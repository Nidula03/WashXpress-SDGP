import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { id, adminNotes } = await request.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Provider ID is required" },
        { status: 400 }
      );
    }

    await adminDb.collection("providers").doc(id).update({
      certificationStatus: "rejected",
      washerStatus: "rejected",
      isActive: false,
      "certificationReview.status": "rejected",
      "certificationReview.adminNotes": adminNotes || null,
      "certificationReview.reviewedAt": new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, message: "Provider rejected successfully" });
  } catch (err: any) {
    console.error("Error rejecting provider:", err);
    return NextResponse.json(
      { ok: false, error: err?.code ?? err?.message ?? "unknown" },
      { status: 500 }
    );
  }
}