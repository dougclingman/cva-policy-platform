import { prisma } from "@/lib/prisma";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign In" };

export default async function LoginPage() {
  const branding = await prisma.brandingConfig.findFirst() ?? {
    platformName: "Yield",
    tagline:      "Cooperative innovation, delivered.",
    logoUrl:      null,
  };

  return (
    <LoginForm
      platformName={branding.platformName}
      tagline={branding.tagline ?? null}
      logoUrl={branding.logoUrl ?? null}
    />
  );
}
