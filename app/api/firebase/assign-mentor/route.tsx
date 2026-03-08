import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const { id, mentorId, adminNotes } = await request.json();

    if (!id || !mentorId) {
      return NextResponse.json(
        { ok: false, error: "Provider ID and mentor ID are required" },
        { status: 400 }
      );
    }

    await adminDb.collection("providers").doc(id).update({
      certificationStatus: "in_training",
      "fieldCertification.assignedMentors": FieldValue.arrayUnion(mentorId),
      "fieldCertification.status": "mentor_assigned",
      "certificationReview.adminNotes": adminNotes || null,
      "certificationReview.reviewedAt": new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, message: "Mentor assigned successfully" });
  } catch (err: any) {
    console.error("Error assigning mentor:", err);
    return NextResponse.json(
      { ok: false, error: err?.code ?? err?.message ?? "unknown" },
      { status: 500 }
    );
  }
}