import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";

export const metadata = { title: "New Announcement" };

export default async function NewAnnouncementPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.ANNOUNCEMENTS_MANAGE)) {
    redirect("/dashboard");
  }

  return (
    <div>
      <Header title="New Announcement" />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <AnnouncementForm />
      </div>
    </div>
  );
}
