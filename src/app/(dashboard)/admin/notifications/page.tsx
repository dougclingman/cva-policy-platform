import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { EmailConfigForm } from "@/components/admin/EmailConfigForm";

export const metadata = { title: "Email Notifications" };

export default async function NotificationsPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.ADMIN_NOTIFICATIONS)) redirect("/admin");

  const config = await prisma.emailConfig.findFirst({
    include: { notifications: { orderBy: { trigger: "asc" } } },
  });

  return (
    <div className="max-w-3xl">
      <Header
        title="Email Notifications"
        subtitle="Configure SMTP settings and manage notification triggers"
      />
      <EmailConfigForm config={config} />
    </div>
  );
}
