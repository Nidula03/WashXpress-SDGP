// app/api/firebase/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingDoc = await adminDb.collection("bookings").doc(id).get();

    if (!bookingDoc.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      booking: { id: bookingDoc.id, ...bookingDoc.data() },
    });
  } catch (error: any) {
    console.error("Booking fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}