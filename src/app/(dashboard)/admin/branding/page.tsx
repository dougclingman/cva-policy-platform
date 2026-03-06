import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { BrandingConfigForm } from "@/components/admin/BrandingConfigForm";
import { Palette } from "lucide-react";

export const metadata = { title: "Branding" };

export default async function BrandingPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.ADMIN_VIEW)) redirect("/admin");

  const branding = await prisma.brandingConfig.findFirst() ?? {
    platformName: "Yield",
    tagline:      null,
    logoUrl:      null,
    faviconUrl:   null,
  };

  return (
    <div>
      <Header
        title="Branding"
        subtitle="Customize the platform name, logo, and tagline"
        actions={
          <div className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700">
            <Palette className="h-4 w-4" />
            Platform Identity
          </div>
        }
      />

      <BrandingConfigForm
        initial={{
          platformName: branding.platformName,
          tagline:      branding.tagline      ?? null,
          logoUrl:      branding.logoUrl      ?? null,
          faviconUrl:   branding.faviconUrl   ?? null,
        }}
      />
    </div>
  );
}
