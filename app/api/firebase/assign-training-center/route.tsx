import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { id, centerName, adminNotes } = await request.json();

    if (!id || !centerName) {
      return NextResponse.json(
        { ok: false, error: "Provider ID and center name are required" },
        { status: 400 }
      );
    }

    await adminDb.collection("providers").doc(id).update({
      certificationStatus: "in_training",
      "trainingCenter.centerName": centerName,
      "trainingCenter.status": "assigned",
      "trainingCenter.assignedAt": new Date().toISOString(),
      "certificationReview.adminNotes": adminNotes || null,
      "certificationReview.reviewedAt": new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, message: "Training center assigned successfully" });
  } catch (err: any) {
    console.error("Error assigning training center:", err);
    return NextResponse.json(
      { ok: false, error: err?.code ?? err?.message ?? "unknown" },
      { status: 500 }
    );
  }
}