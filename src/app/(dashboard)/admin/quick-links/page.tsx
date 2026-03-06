import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { QuickLinksManager } from "@/components/admin/QuickLinksManager";

export const metadata = { title: "Quick Links" };

export default async function QuickLinksPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.ADMIN_VIEW)) {
    redirect("/admin");
  }

  const links = await prisma.quickLink.findMany({
    orderBy: { displayOrder: "asc" },
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div>
      <Header
        title="Quick Links"
        subtitle="Manage shortcut links displayed on the dashboard for all users"
      />
      <QuickLinksManager links={links} />
    </div>
  );
}
