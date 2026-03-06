import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const branding = await prisma.brandingConfig.findFirst() ?? {
    platformName: "Yield",
    logoUrl:      null,
    tagline:      null,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar branding={{ platformName: branding.platformName, logoUrl: branding.logoUrl ?? null }} />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
