import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: `Edit: ${announcement?.title ?? "Announcement"}` };
}

export default async function EditAnnouncementPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.ANNOUNCEMENTS_MANAGE)) {
    redirect("/dashboard");
  }

  const announcement = await prisma.announcement.findUnique({
    where: { id: params.id },
    select: {
      id:        true,
      title:     true,
      body:      true,
      priority:  true,
      expiresAt: true,
      status:    true,
    },
  });

  if (!announcement) notFound();

  const formData = {
    ...announcement,
    expiresAt: announcement.expiresAt ? announcement.expiresAt.toISOString() : null,
  };

  return (
    <div>
      <Header title="Edit Announcement" />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <AnnouncementForm announcement={formData} />
      </div>
    </div>
  );
}
