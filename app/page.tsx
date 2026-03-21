// app/page.tsx
"use client";
import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { isSignedIn } = useUser();
  return (
    <div className="min-h-screen bg-[#0f1729] grid place-items-center p-6">
      <div className="max-w-lg w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-10">
        <div className="text-3xl text-[#0ea3e8] font-semibold text-center">WashXpress Admin Portal</div>
        <p className="mt-3 text-base text-slate-600 text-center flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          Restricted Access • Authorized admins only
        </p>

        {isSignedIn ? (
          <Link
            href="/admin"
            className="mt-8 inline-flex w-full justify-center rounded-xl bg-slate-900 text-white px-6 py-3 text-base font-medium hover:bg-black"
          >
            Go to Admin Dashboard
          </Link>
        ) : (
          <SignInButton mode="modal" forceRedirectUrl="/admin" fallbackRedirectUrl="/admin">
            <button className="mt-8 inline-flex w-full justify-center rounded-xl bg-slate-900 text-white px-6 py-3 text-base font-medium hover:bg-black">
             Admin Login
            </button>
          </SignInButton>
        )}
      </div>
    </div>
  );
}
