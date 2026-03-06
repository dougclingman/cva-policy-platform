import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { ProjectDetail } from "@/components/projects/ProjectDetail";

export const metadata = { title: "Project Detail" };

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.PROJECTS_READ)) {
    redirect("/dashboard");
  }

  const canManage = hasPermission(permissions, PERMISSIONS.PROJECTS_MANAGE);

  const [project, allUsers] = await Promise.all([
    prisma.project.findUnique({
      where: { id: params.id },
      include: {
        team:      true,
        createdBy: { select: { name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            dependsOn: {
              include: {
                dependencyTask: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
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
    <ProjectDetail
      project={project}
      canManage={canManage}
      allUsers={allUsers}
    />
  );
}
