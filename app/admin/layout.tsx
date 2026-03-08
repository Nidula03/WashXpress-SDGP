// app/admin/layout.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import AdminTabs from "./tabs";
import { UserButton } from "@clerk/nextjs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        {/* Main */}
        <main className="flex-1">
          {/* Top nav bar */}
          <header className="sticky top-0 z-10 border-b border-[#1a2540]" style={{ backgroundColor: "#0d1629" }}>
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <Link href="/admin" className="flex items-center gap-3 whitespace-nowrap">
                  <Image
                    src="/WashXpress_logo.svg"
                    alt="WashXpress Logo"
                    width={160}
                    height={40}
                    priority
                  />
                </Link>
                <div className="flex-1 flex justify-center min-w-0">
                  <AdminTabs />
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-300 font-medium whitespace-nowrap">
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