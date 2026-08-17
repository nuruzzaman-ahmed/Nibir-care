"use client";

import { useState } from "react";
import { Search, UserX, UserCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
};

const ROLE_LABEL: Record<string, { label: string; cls: string }> = {
  PATIENT: { label: "রোগী", cls: "bg-gray-100 text-gray-600" },
  DOCTOR: { label: "ডাক্তার", cls: "bg-teal-50 text-teal-700" },
  DIAGNOSTIC: { label: "ডায়াগনস্টিক", cls: "bg-blue-50 text-blue-700" },
  ADMIN: { label: "অ্যাডমিন", cls: "bg-purple-50 text-purple-700" },
};

const ROLE_FILTERS = [
  { value: "ALL", label: "সব" },
  { value: "PATIENT", label: "রোগী" },
  { value: "DOCTOR", label: "ডাক্তার" },
  { value: "DIAGNOSTIC", label: "ডায়াগনস্টিক" },
  { value: "ADMIN", label: "অ্যাডমিন" },
];

export function UsersClient({ users: initialUsers }: { users: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchSearch =
      !search ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone ?? "").includes(search);
    return matchRole && matchSearch;
  });

  const toggleActive = async (id: string, currentActive: boolean) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: !currentActive } : u)));
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">ব্যবহারকারী</h1>
        <p className="text-sm text-gray-500 mt-0.5">{users.length} জন নিবন্ধিত ব্যবহারকারী</p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="নাম, ইমেইল, ফোন খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto scroll-hide mb-5 pb-1">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r.value}
            onClick={() => setRoleFilter(r.value)}
            className={cn(
              "whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all shrink-0",
              roleFilter === r.value ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <h3 className="font-semibold text-gray-600 mb-1">কোনো ব্যবহারকারী পাওয়া যায়নি</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const role = ROLE_LABEL[u.role] ?? { label: u.role, cls: "bg-gray-100 text-gray-600" };
            return (
              <div
                key={u.id}
                className={cn(
                  "bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 transition-all",
                  u.isActive ? "border-gray-100" : "border-red-100 bg-red-50/30"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.name ?? "নাম নেই"}</p>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", role.cls)}>
                      {role.label}
                    </span>
                    {!u.isActive && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
                        নিষ্ক্রিয়
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {u.email ?? "ইমেইল নেই"} {u.phone ? `· ${u.phone}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(u.id, u.isActive)}
                  disabled={updating === u.id || u.role === "ADMIN"}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40",
                    u.isActive ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                  )}
                >
                  {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                  {updating === u.id ? "..." : u.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
