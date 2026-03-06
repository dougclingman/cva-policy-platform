import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { ProjectForm } from "@/components/projects/ProjectForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Edit Project" };

export default async function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.PROJECTS_MANAGE)) {
    redirect("/projects");
  }

  const [project, teams, users] = await Promise.all([
    prisma.project.findUnique({
      where:   { id: params.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where:   { isActive: true },
      orderBy: { name: "asc" },
      select:  { id: true, name: true, email: true },
    }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div>
      <Header
        title="Edit Project"
        subtitle={`Editing: ${project.title}`}
        actions={
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Link>
        }
      />
      <ProjectForm project={project} teams={teams} users={users} />
    </div>
  );
}
