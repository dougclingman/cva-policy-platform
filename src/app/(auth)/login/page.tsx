import { prisma } from "@/lib/prisma";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign In" };

const DEFAULT_BRANDING = {
  platformName: "Yield",
  tagline:      "Cooperative innovation, delivered.",
  logoUrl:      null,
};

export default async function LoginPage() {
  const branding = await prisma.brandingConfig.findFirst().catch(() => null) ?? DEFAULT_BRANDING;

  return (
    <LoginForm
      platformName={branding.platformName}
      tagline={branding.tagline ?? null}
      logoUrl={branding.logoUrl ?? null}
    />
  );
}
