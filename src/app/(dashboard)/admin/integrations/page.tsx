import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { TeamsConfigForm } from "@/components/admin/TeamsConfigForm";
import { MerakiConfigForm } from "@/components/admin/MerakiConfigForm";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.ADMIN_VIEW)) {
    redirect("/admin");
  }

  const [teamsConfig, merakiConfig] = await Promise.all([
    prisma.teamsConfig.findFirst(),
    prisma.merakiConfig.findFirst(),
  ]);

  const webhookEndpoint = `${process.env.NEXTAUTH_URL ?? "https://your-platform.com"}/api/integrations/teams/webhook`;

  return (
    <div className="max-w-3xl">
      <Header
        title="Integrations"
        subtitle="Connect the CVA Policy Platform with external services"
      />

      <div className="space-y-6">
        {/* Microsoft Teams Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            {/* Teams icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4B53BC] shrink-0">
              <span className="text-white font-bold text-sm select-none">T</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Microsoft Teams Integration</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Sync platform messages with a Teams channel via Incoming Webhook
              </p>
            </div>
          </div>

          {/* Webhook endpoint info box */}
          <div className="px-6 pt-5">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800 mb-1.5">Your Outgoing Webhook Endpoint</p>
              <p className="text-xs text-blue-700 mb-2">
                Register this URL in Teams as an Outgoing Webhook (Teams Admin Center) so that messages
                sent in your Teams channel are forwarded here.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-white border border-blue-200 px-3 py-2 text-xs font-mono text-slate-700 break-all">
                  {webhookEndpoint}
                </code>
              </div>
            </div>
          </div>

          {/* Form */}
          <TeamsConfigForm
            config={{
              id:                 teamsConfig?.id ?? null,
              isEnabled:          teamsConfig?.isEnabled ?? false,
              incomingWebhookUrl: teamsConfig?.incomingWebhookUrl ?? null,
              verificationToken:  teamsConfig?.verificationToken ?? null,
              channelName:        teamsConfig?.channelName ?? null,
            }}
            webhookEndpoint={webhookEndpoint}
          />
        </div>

        {/* Cisco Meraki Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            {/* Meraki icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#67B346] shrink-0">
              <span className="text-white font-bold text-sm select-none">M</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Cisco Meraki Integration</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Monitor network device status from Meraki Dashboard
              </p>
            </div>
          </div>

          {/* Form */}
          <MerakiConfigForm
            initial={{
              id:        merakiConfig?.id ?? null,
              isEnabled: merakiConfig?.isEnabled ?? false,
              apiKey:    merakiConfig?.apiKey ?? null,
              orgId:     merakiConfig?.orgId ?? null,
            }}
          />
        </div>
      </div>
    </div>
  );
}
