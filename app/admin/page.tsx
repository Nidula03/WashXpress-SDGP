// app/admin/page.tsx
export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI cards (larger) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Customers" value="—" hint="All registered customers" />
        <MetricCard title="Total Washers" value="—" hint="All washer accounts" />
        <MetricCard title="Active Subscriptions" value="—" hint="Currently active plans" />
        <MetricCard title="Pending Washers" value="—" hint="Awaiting verification" />
      </div>

      {/* Main content grid (larger panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Customers"
          subtitle="Recent customers and basic info"
          actions={
            <div className="flex gap-2">
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                View all
              </button>
              <button className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:bg-black">
                Add
              </button>
            </div>
          }
        >
          <MiniTable
            columns={["Name", "Email", "Plan", "Status"]}
            rows={[
              ["—", "—", "—", "—"],
              ["—", "—", "—", "—"],
              ["—", "—", "—", "—"],
            ]}
          />
        </Panel>

        <Panel
          title="Washers"
          subtitle="Recent washers and verification status"
          actions={
            <div className="flex gap-2">
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                View all
              </button>
              <button className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:bg-black">
                Add
              </button>
            </div>
          }
        >
          <MiniTable
            columns={["Name", "Phone", "Active", "Verification"]}
            rows={[
              ["—", "—", "—", "—"],
              ["—", "—", "—", "—"],
              ["—", "—", "—", "—"],
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function MetricCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 min-h-32 flex flex-col justify-center">
      <div className="text-base text-slate-600 font-medium">{title}</div>
      <div className="mt-2 text-4xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-2 text-sm text-slate-400">{hint}</div> : null}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm min-h-72">
      <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
        <div>
          <div className="text-xl font-semibold">{title}</div>
          {subtitle ? <div className="text-base text-slate-500 mt-1">{subtitle}</div> : null}
        </div>
        {actions}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function MiniTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-slate-500">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
