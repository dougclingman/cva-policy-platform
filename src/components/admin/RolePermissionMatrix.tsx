"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Check, Shield } from "lucide-react";

interface Permission { id: string; name: string; description?: string | null; resource: string; action: string }
interface Role {
  id: string; name: string; description?: string | null; isSystem: boolean;
  rolePermissions: { permission: Permission }[];
  _count: { userRoles: number };
}

interface Props { roles: Role[]; allPermissions: Permission[] }

const RESOURCE_LABELS: Record<string, string> = {
  policies: "Policies",
  admin:    "Administration",
};

export function RolePermissionMatrix({ roles, allPermissions }: Props) {
  const router      = useRouter();
  const [selected,  setSelected]  = useState<Role | null>(null);
  const [permIds,   setPermIds]   = useState<string[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [saved,     setSaved]     = useState(false);

  function openRole(role: Role) {
    setSelected(role);
    setPermIds(role.rolePermissions.map((rp) => rp.permission.id));
    setSaved(false);
  }

  function togglePerm(id: string) {
    setPermIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }

  async function savePermissions() {
    if (!selected) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/roles/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: permIds }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  // Group permissions by resource
  const grouped = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.resource] = acc[p.resource] ?? []).push(p);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Role List */}
      <div className="space-y-3">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => openRole(role)}
            className={`w-full text-left rounded-xl border p-4 transition-all ${
              selected?.id === role.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-blue-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className={`h-4 w-4 ${selected?.id === role.id ? "text-blue-600" : "text-slate-400"}`} />
              <span className="font-semibold text-slate-900">{role.name}</span>
              {role.isSystem && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 font-medium">System</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-2">{role.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {role.rolePermissions.length} permission{role.rolePermissions.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-slate-400">{role._count.userRoles} users</span>
            </div>
          </button>
        ))}
      </div>

      {/* Permission Editor */}
      <div className="lg:col-span-2">
        {!selected ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20">
            <div className="text-center">
              <Shield className="h-10 w-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Select a role to manage permissions</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-slate-900">{selected.name}</h3>
                <p className="text-xs text-slate-500">{permIds.length} permissions selected</p>
              </div>
              <div className="flex items-center gap-2">
                {saved && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Saved</span>}
                <Button size="sm" onClick={savePermissions} loading={loading}>
                  Save Permissions
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {Object.entries(grouped).map(([resource, perms]) => (
                <div key={resource}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    {RESOURCE_LABELS[resource] ?? resource}
                  </h4>
                  <div className="space-y-2">
                    {perms.map((perm) => (
                      <label key={perm.id} className="flex items-start gap-3 cursor-pointer group">
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={permIds.includes(perm.id)}
                            onChange={() => togglePerm(perm.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                            {perm.name}
                          </div>
                          {perm.description && (
                            <div className="text-xs text-slate-400">{perm.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
