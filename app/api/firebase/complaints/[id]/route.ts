// app/api/firebase/complaints/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, adminNotes } = body;

    const updates: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (status === "resolved") updates.resolvedAt = FieldValue.serverTimestamp();

    await adminDb.collection("complaints").doc(id).update(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Complaint update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}