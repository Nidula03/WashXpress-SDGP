import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const { bookingId, traineeId, traineeName, adminNotes } =
      await request.json();

    if (!bookingId || !traineeId) {
      return NextResponse.json(
        { ok: false, error: "bookingId and traineeId are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 1. Write trainee assignment onto the booking document
    await adminDb.collection("bookings").doc(bookingId).update({
      traineeAssignment: {
        traineeId,
        traineeName: traineeName || "Unknown",
        status: "shadowing",
        assignedAt: now,
        adminNotes: adminNotes || null,
      },
      updatedAt: now,
    });

    // 2. Increment the trainee's completedEvaluations in providers collection
    //    and record the booking reference for traceability
    await adminDb
      .collection("providers")
      .doc(traineeId)
      .update({
        "fieldCertification.completedEvaluations": FieldValue.increment(1),
        "fieldCertification.shadowJobs": FieldValue.arrayUnion(bookingId),
        certificationStatus: "in_training",
        updatedAt: now,
      });

    return NextResponse.json({
      ok: true,
      message: "Trainee assigned to job successfully",
    });
  } catch (err: any) {
    console.error("Error assigning trainee:", err);
    return NextResponse.json(
      { ok: false, error: err?.code ?? err?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
