export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// ── GET all plans ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const snap = await adminDb.collection("subscription_plans").get();
    const plans = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    plans.sort((a: any, b: any) => a.price - b.price);
    return NextResponse.json({ plans });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST create new plan ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!data.name || !data.price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    // Use the plan name as document ID (slugified) if no ID provided
    const docId = id || data.name.toLowerCase().replace(/\s+/g, "-");

    await adminDb.collection("subscription_plans").doc(docId).set({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ── PUT update existing plan ──────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    await adminDb.collection("subscription_plans").doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ── DELETE plan ───────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    await adminDb.collection("subscription_plans").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}