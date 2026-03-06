"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuickLinkForm } from "@/components/admin/QuickLinkForm";
import { Button } from "@/components/ui/Button";
import { Pencil, Trash2, Plus, ExternalLink, CheckCircle2, XCircle } from "lucide-react";

interface QuickLink {
  id:           string;
  title:        string;
  url:          string;
  description:  string | null;
  icon:         string | null;
  displayOrder: number;
  isActive:     boolean;
  createdBy:    { name: string };
}

interface Props {
  links: QuickLink[];
}

export function QuickLinksManager({ links }: Props) {
  const router = useRouter();

  const [showCreate, setShowCreate]         = useState(false);
  const [editingLink, setEditingLink]       = useState<QuickLink | null>(null);
  const [deletingId,  setDeletingId]        = useState<string | null>(null);

  function handleSuccess() {
    setShowCreate(false);
    setEditingLink(null);
    router.refresh();
  }

  function handleCancelForm() {
    setShowCreate(false);
    setEditingLink(null);
  }

  async function handleDelete(link: QuickLink) {
    const confirmed = window.confirm(
      `Delete "${link.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(link.id);
    try {
      const res = await fetch(`/api/admin/quick-links/${link.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete quick link.");
      }
    } catch {
      alert("Network error — please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleEdit(link: QuickLink) {
    setShowCreate(false);
    setEditingLink(link);
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Create form */}
      {showCreate && !editingLink && (
        <QuickLinkForm onSuccess={handleSuccess} onCancel={handleCancelForm} />
      )}

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table header / Add button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-slate-900">Quick Links</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {links.length} link{links.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          {!showCreate && !editingLink && (
            <Button
              type="button"
              size="sm"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Quick Link
            </Button>
          )}
        </div>

        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <ExternalLink className="h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">No quick links yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add links to important tools and resources to show on the dashboard.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-10">
                    Icon
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                    Order
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                    Active
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {links.flatMap((link) => {
                  const rows = [
                  <tr key={link.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        {link.icon ? (
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-base select-none">
                            {link.icon}
                          </span>
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-900">{link.title}</span>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline truncate block max-w-[200px]"
                          title={link.url}
                        >
                          {link.url}
                        </a>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-slate-500 max-w-xs">
                        <span className="truncate block max-w-[220px]" title={link.description ?? ""}>
                          {link.description ?? <span className="text-slate-300 italic">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-600">
                        {link.displayOrder}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {link.isActive ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(link)}
                            title="Edit"
                            className="rounded-md p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(link)}
                            disabled={deletingId === link.id}
                            title="Delete"
                            className="rounded-md p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                  ];
                  if (editingLink?.id === link.id) {
                    rows.push(
                      <tr key={`${link.id}-edit`}>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50/50">
                          <QuickLinkForm
                            link={editingLink}
                            onSuccess={handleSuccess}
                            onCancel={handleCancelForm}
                          />
                        </td>
                      </tr>
                    );
                  }
                  return rows;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
