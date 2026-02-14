// app/admin/layout.tsx
"use client";
import Link from "next/link";
import AdminTabs from "./tabs";
import { UserButton } from "@clerk/nextjs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        {/* Main */}
        <main className="flex-1">
          {/* Top nav bar */}
          <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <Link href="/admin" className="flex items-center gap-3 whitespace-nowrap">
                  <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center font-bold">
                    WX
                  </div>
                  <div className="text-base font-semibold leading-tight">WashXpress</div>
                </Link>
                <div className="flex-1 flex justify-center min-w-0">
                  <AdminTabs />
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-600 font-medium whitespace-nowrap">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Signed in
                  </span>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>

            </div>
          </header>

          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
