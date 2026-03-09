"use client";

import { useEffect, useState } from "react";

interface Allowances {
  washes: number;
  interiorCleans: number;
  tireCleans: number;
  fullDetails: number;
}

interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  currency: string;
  color: string;
  isActive: boolean;
  isPopular: boolean;
  allowances: Allowances;
  features: string[];
}

const COLORS = ["#0ca6e8", "#7c3aed", "#d97706", "#059669", "#dc2626", "#0d1629"];

const emptyPlan = (): Omit<Plan, "id"> => ({
  name: "",
  tagline: "",
  price: 0,
  currency: "LKR",
  color: "#0ca6e8",
  isActive: true,
  isPopular: false,
  allowances: { washes: 0, interiorCleans: 0, tireCleans: 0, fullDetails: 0 },
  features: [],
});

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [featureInput, setFeatureInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchPlans(); }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchPlans() {
    try {
      setLoading(true);
      const res = await fetch("/api/firebase/pricing");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch {
      showToast("❌ Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  async function savePlan() {
    if (!editingPlan) return;
    if (!editingPlan.name.trim()) return showToast("Plan name is required");
    if (editingPlan.price <= 0) return showToast("Price must be greater than 0");

    setSaving(true);
    try {
      const res = await fetch("/api/firebase/pricing", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast(`✅ Plan ${isNew ? "created" : "updated"} successfully`);
      setEditingPlan(null);
      fetchPlans();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(id: string) {
    try {
      const res = await fetch(`/api/firebase/pricing?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast("✅ Plan deleted");
      setDeleteConfirm(null);
      fetchPlans();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    }
  }

  async function toggleActive(plan: Plan) {
    try {
      await fetch("/api/firebase/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...plan, isActive: !plan.isActive }),
      });
      showToast(`Plan ${plan.isActive ? "deactivated" : "activated"}`);
      fetchPlans();
    } catch {
      showToast("❌ Failed to update plan");
    }
  }

  function openNew() {
    setIsNew(true);
    setEditingPlan({ id: "", ...emptyPlan() });
    setFeatureInput("");
  }

  function openEdit(plan: Plan) {
    setIsNew(false);
    setEditingPlan({ ...plan, features: [...plan.features] });
    setFeatureInput("");
  }

  function addFeature() {
    if (!featureInput.trim() || !editingPlan) return;
    setEditingPlan({ ...editingPlan, features: [...editingPlan.features, featureInput.trim()] });
    setFeatureInput("");
  }

  function removeFeature(i: number) {
    if (!editingPlan) return;
    const features = [...editingPlan.features];
    features.splice(i, 1);
    setEditingPlan({ ...editingPlan, features });
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pricing Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage subscription plans, prices and service allowances</p>
        </div>
        <button
          onClick={openNew}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow"
          style={{ backgroundColor: "#0ca6e8" }}
        >
          + New Plan
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#0ca6e8", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-xl border-2 overflow-hidden shadow-sm transition ${!plan.isActive ? "opacity-50" : ""}`} style={{ borderColor: plan.color }}>
              {/* Card Header */}
              <div className="p-5" style={{ backgroundColor: plan.color + "15" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold" style={{ color: plan.color }}>{plan.name}</h2>
                      {plan.isPopular && (
                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: plan.color }}>POPULAR</span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mt-0.5">{plan.tagline}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${plan.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-3xl font-extrabold mt-3" style={{ color: plan.color }}>
                  LKR {plan.price.toLocaleString()}
                  <span className="text-base font-normal text-slate-500"> /mo</span>
                </p>
              </div>

              {/* Allowances */}
              <div className="px-5 pt-4 pb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Monthly Allowances</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Washes", val: plan.allowances.washes, icon: "🚿" },
                    { label: "Interior", val: plan.allowances.interiorCleans, icon: "🧹" },
                    { label: "Tires", val: plan.allowances.tireCleans, icon: "⚙️" },
                    { label: "Full Detail", val: plan.allowances.fullDetails, icon: "✨" },
                  ].map((a) => (
                    <div key={a.label} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-base">{a.icon}</span>
                      <div>
                        <p className="text-xs text-slate-500">{a.label}</p>
                        <p className="text-sm font-bold text-slate-800">{a.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 flex gap-2 border-t border-slate-100 mt-2">
                <button onClick={() => openEdit(plan)} className="flex-1 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50">
                  Edit
                </button>
                <button onClick={() => toggleActive(plan)} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${plan.isActive ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                  {plan.isActive ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => setDeleteConfirm(plan.id)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / New Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-5">{isNew ? "New Plan" : `Edit ${editingPlan.name}`}</h2>

              <div className="space-y-4">
                {/* Name & Tagline */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan Name *</label>
                    <input value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Basic" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Price (LKR) *</label>
                    <input type="number" value={editingPlan.price} onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tagline</label>
                  <input value={editingPlan.tagline} onChange={e => setEditingPlan({ ...editingPlan, tagline: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Perfect for occasional washes" />
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Color</label>
                  <div className="flex gap-2 mt-2">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setEditingPlan({ ...editingPlan, color: c })}
                        className="w-8 h-8 rounded-full border-2 transition"
                        style={{ backgroundColor: c, borderColor: editingPlan.color === c ? "#0d1629" : "transparent" }} />
                    ))}
                  </div>
                </div>

                {/* Allowances */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Monthly Allowances</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "washes", label: "🚿 Washes" },
                      { key: "interiorCleans", label: "🧹 Interior Cleans" },
                      { key: "tireCleans", label: "⚙️ Tire Cleanings" },
                      { key: "fullDetails", label: "✨ Full Details" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs text-slate-500">{label}</label>
                        <input type="number" min={0}
                          value={(editingPlan.allowances as any)[key]}
                          onChange={e => setEditingPlan({ ...editingPlan, allowances: { ...editingPlan.allowances, [key]: Number(e.target.value) } })}
                          className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Features</label>
                  <div className="space-y-2 mb-2">
                    {editingPlan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="text-sm text-slate-700 flex-1">{f}</span>
                        <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={featureInput} onChange={e => setFeatureInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addFeature()}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a feature and press Enter" />
                    <button onClick={addFeature} className="px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "#0ca6e8" }}>Add</button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex gap-4">
                  {[{ key: "isActive", label: "Active" }, { key: "isPopular", label: "Mark as Popular" }].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(editingPlan as any)[key]}
                        onChange={e => setEditingPlan({ ...editingPlan, [key]: e.target.checked })}
                        className="w-4 h-4 rounded" />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingPlan(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={savePlan} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ backgroundColor: "#0ca6e8", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Saving..." : isNew ? "Create Plan" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Plan?</h3>
            <p className="text-sm text-slate-500 mb-6">This will permanently delete the plan. Active subscriptions using this plan will not be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold">Cancel</button>
              <button onClick={() => deletePlan(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
