// app/page.tsx
"use client";
import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { isSignedIn } = useUser();
  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center p-6">
      <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="text-xl text-black font-semibold text-center">WashXpress Admin</div>
        <p className="mt-2 text-sm text-slate-600 text-center">
          Authorized admins only
        </p>

        {isSignedIn ? (
          <Link
            href="/admin"
            className="mt-5 inline-flex w-full justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-black"
          >
            Go to Admin Dashboard
          </Link>
        ) : (
          <SignInButton mode="modal" forceRedirectUrl="/admin" fallbackRedirectUrl="/admin">
            <button className="mt-5 inline-flex w-full justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-black">
             Admin Login
            </button>
          </SignInButton>
        )}
      </div>
    </div>
  );
}
