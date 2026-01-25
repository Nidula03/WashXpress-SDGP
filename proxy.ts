import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "washXpress@gmail.com").toLowerCase().trim();

// Only guard admin area; keep other pages public
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Only apply checks for admin routes
  if (!isAdminRoute(req)) return;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Get Clerk client and load user
  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // Retrieve primary email robustly from the emailAddresses list
  type EmailAddr = typeof user.emailAddresses[number];
  const primary = user.emailAddresses.find(
    (e: EmailAddr) => e.id === user.primaryEmailAddressId
  );
  const email = primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  if (!email || email.toLowerCase().trim() !== ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }
});

export const config = {
  matcher: ["/admin(.*)"]
};
