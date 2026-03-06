import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { TravelRequestForm } from "@/components/travel/TravelRequestForm";

export const metadata = { title: "New Travel Exception Request" };

export default async function NewTravelPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.TRAVEL_MANAGE)) {
    redirect("/dashboard");
  }

  return (
    <div>
      <Header
        title="New Travel Exception Request"
        subtitle="Submit an international travel form on behalf of a team member to initiate an O365 remote-access exception"
      />
      <div className="mt-4 max-w-3xl">
        <TravelRequestForm />
      </div>
    </div>
  );
}
