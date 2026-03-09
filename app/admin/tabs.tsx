// app/admin/tabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/certification", label: "Washer Certification" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/pricing", label: "Pricing" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={[
              "shrink-0 rounded-full px-4 py-2 text-sm border transition",
              active
                ? "text-white border-[#0ca6e8] bg-[#0ca6e8]"
                : "bg-transparent text-slate-300 border-slate-600 hover:bg-[#0ca6e8] hover:text-white hover:border-[#0ca6e8]",
            ].join(" ")}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
