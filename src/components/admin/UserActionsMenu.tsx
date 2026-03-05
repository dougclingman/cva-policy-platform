"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MoreHorizontal, Pencil, UserX, UserCheck, X } from "lucide-react";

interface Role { id: string; name: string }
interface User { id: string; name: string; email: string; isActive: boolean; roleIds: string[] }

export function UserActionsMenu({ user, roles }: { user: User; roles: Role[] }) {
  const router = useRouter();
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [editOpen,  setEditOpen]  = useState(false);
  const [name,      setName]      = useState(user.name);
  const [selRoles,  setSelRoles]  = useState<string[]>(user.roleIds);
  const [loading,   setLoading]   = useState(false);

  function toggleRole(id: string) {
    setSelRoles((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }

  async function updateUser(payload: Record<string, unknown>) {
    setLoading(true);
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      router.refresh();
    } finally {
      setLoading(false);
      setMenuOpen(false);
      setEditOpen(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 hover:text-slate-600 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
            <button
              onClick={() => { setMenuOpen(false); setEditOpen(true); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-gray-50"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit User
            </button>
            <button
              onClick={() => updateUser({ isActive: !user.isActive })}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
            >
              {user.isActive ? (
                <><UserX className="h-3.5 w-3.5 text-red-500" /><span className="text-red-600">Deactivate</span></>
              ) : (
                <><UserCheck className="h-3.5 w-3.5 text-green-500" /><span className="text-green-700">Activate</span></>
              )}
            </button>
          </div>
        </>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-slate-900">Edit User</h2>
              <button onClick={() => setEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Roles</label>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selRoles.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{role.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button loading={loading} onClick={() => updateUser({ name, roleIds: selRoles })} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
