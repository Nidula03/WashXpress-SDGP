export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { app } from "@/lib/firebase";
import { getApps, type FirebaseOptions } from "firebase/app";

export async function GET() {
  const initialized = getApps().length > 0;
  const options = app.options as FirebaseOptions;
  return NextResponse.json({
    initialized,
    appName: app.name,
    projectId: options.projectId ?? null,
  });
}
